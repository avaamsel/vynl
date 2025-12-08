import { createSupabaseClient } from "@/src/server/supabase";
import { getPlaylistFromDatabase } from "@/src/server/dataDeserialization";
import { isPlaylistData, playlist_song } from "@/src/types/database";
import { isITunesPlaylist, isITunesSong, isSongList } from "@/src/types";

// GET "api/playlist"
export async function GET(req: Request, { id }: Record<string, string>) {
    try {
        const supabase = await createSupabaseClient(req);

        // If given an error response return it
        if (supabase instanceof Response) {
            return supabase
        }

        const playlist = await getPlaylistFromDatabase(id, supabase);
        
        // If given an error response from playlist method
        if (playlist instanceof Response) {
            return playlist;
        }

        return new Response(JSON.stringify(playlist), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error(error);
        return new Response('Unknown Server Error', {
            status: 500
        });
    }
}

// PUT "api/playlist"
// Does not create a playlist, only updates
export async function PUT(req: Request, { id }: Record<string, string>) {
    if (!id) {
        return new Response("Missing playlist ID", { status: 400 });
    }
    try {
        const playlist_id = parseInt(id);

        if (playlist_id == undefined) {
            console.log("Invalid Song ID:", id);
            return new Response('Invalid Playlist ID', {
                status: 400
            });
        }

        const body = await req.json();
        const supabase = await createSupabaseClient(req);
        // If given an error response return it
        if (supabase instanceof Response) {
            return supabase
        }

        const songList = body.songs;
        const newName = body.name;
        const old_playlist = await getPlaylistFromDatabase(id, supabase);
        
        // If given an error response from playlist method
        if (old_playlist instanceof Response) {
            console.log("old playlist", old_playlist);
            return old_playlist;
        }
        if (!isSongList(songList)) {
            return new Response("Invalid body: expected { name, songs[] }", { status: 400 });
        }

        // Upsert all song objects into the song table
        const { data: s_data, error: s_err } = await supabase
            .from('songs')
            .upsert(songList)

        if (s_err) {
            console.log("s_err", s_err);
            return new Response('Failed to insert into database', {
                status: 400
            });
        }

        if (old_playlist.name != newName) {
            // Updating playlist object in database
            const { data: p_data, error: p_err } = await supabase
                .from('playlists')
                .update({ name: newName})
                .eq('playlist_id', playlist_id)
                .select()
                .single();

            if (p_err || !isPlaylistData(p_data)) {
                console.log("p_data : ", p_err);
                console.log("New name : ", newName, old_playlist.name);
                return new Response('Failed to insert into database', {
                    status: 400
                });
            }
        }

        // Add or update new playlist songs
        const new_song_ids = new Set<number>();
        let new_playlist_songs: playlist_song[] = [];
        for (let i = 0; i < songList.length; i++) {
            new_song_ids.add(songList[i].song_id);
            new_playlist_songs.push({
                playlist_id: old_playlist.id,
                song_id: songList[i].song_id,
                position: i
            });
        }
        const { data: nps_data, error: nps_err } = await supabase
            .from('playlists_songs')
            .upsert(new_playlist_songs)
            .select()

        if (nps_err) {
            console.log("Failed to insert into database : ", nps_err);
            // Check if error is due to row-level security policy (party mode ended)
            if (nps_err.code === '42501' || (nps_err.message && nps_err.message.includes('row-level security policy'))) {
                return new Response(JSON.stringify({ 
                    error: 'PARTY_ENDED',
                    message: 'Host has ended the party session. No songs can be added at this time.' 
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            return new Response('Failed to insert into database', {
                status: 400
            });
        }

        // Delete playlist songs that are not included anymore
        let songs_to_remove: number[] = [];
        for (let i = 0; i < old_playlist.songs.length; i++) {
            const cur_song_id = old_playlist.songs[i].song_id;
            if (!new_song_ids.has(cur_song_id)) {
                songs_to_remove.push(old_playlist.songs[i].song_id);
            }
        }
        const { data: ops_data, error: ops_err } = await supabase
            .from('playlists_songs')
            .delete()
            .eq('playlist_id', old_playlist.id)
            .in('song_id', songs_to_remove)

        if (ops_err) {
            console.log("Ops err", ops_err);
            return new Response('Failed to insert into database', {
                status: 400
            });
        }

        return new Response(JSON.stringify(old_playlist), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error(error);
        return new Response('Unknown Server Error', {
            status: 500
        });
    }
}

export async function DELETE(req: Request, { id }: Record<string, string>) {
    try {
        const supabase = await createSupabaseClient(req);

        // If given an error response return it
        if (supabase instanceof Response) {
            return supabase
        }

        const playlist_id = parseInt(id);

        if (playlist_id == undefined) {
            return new Response('Invalid Playlist ID', {
                status: 400
            });
        }

        // Everything is set to cascade delete so all playlists_songs  and party_users
        // will get deleted with this call. 
        const { data, error } = await supabase
            .from('playlists')
            .delete()
            .eq('playlist_id', playlist_id);

        return new Response("OK", {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error(error);
        return new Response('Unknown Server Error', {
            status: 500
        });
    }
}
