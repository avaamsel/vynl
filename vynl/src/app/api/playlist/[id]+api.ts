import { createSupabaseClient } from "@/src/server/supabase";
import { getPlaylistFromDatabase } from "@/src/server/dataDeserialization";
import { isPlaylistData, playlist_song } from "@/src/types/database";
import { isITunesPlaylist } from "@/src/types";

// GET "api/playlist"
export async function GET(req: Request, { id }: Record<string, string>) {
    try {
        const supabase = await createSupabaseClient(req);

        // If given an error response return it
        if (supabase instanceof Response) {
            return supabase
        }

        const playlist = getPlaylistFromDatabase(id, supabase);
        
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
    try {
        const body = await req.json();
        const supabase = await createSupabaseClient(req);
        // If given an error response return it
        if (supabase instanceof Response) {
            return supabase
        }
        
        if (!isITunesPlaylist(body)) {
            return new Response('Invalid Body, Expected Playlist Object', {
                status: 400
            });
        }

        const new_playlist = body;
        const old_playlist = await getPlaylistFromDatabase(id, supabase);
        
        // If given an error response from playlist method
        if (old_playlist instanceof Response) {
            return old_playlist;
        }

        // Upsert all song objects into the song table
        const { data: s_data, error: s_err } = await supabase
            .from('songs')
            .upsert(new_playlist.songs)

        if (s_err) {
            return new Response('Failed to insert into database', {
                status: 400
            });
        }

        // Updating playlist object in database
        const { data: p_data, error: p_err } = await supabase
            .from('playlists')
            .update({ name: new_playlist.name})
            .eq('playlist_id', old_playlist.id)
            .select()
            .single();
        
        if (p_err || !isPlaylistData(p_data)) {
            return new Response('Failed to insert into database', {
                status: 400
            });
        }

        // Add or update new playlist songs
        const new_song_ids = new Set<number>();
        //TODO : should be an ITunes Playlist no ?
        let new_playlist_songs: playlist_song[] = [];
        for (let i = 0; i < new_playlist.songs.length; i++) {
            new_song_ids.add(new_playlist.songs[i].song_id);
            new_playlist_songs.push({
                playlist_id: old_playlist.id,
                song_id: new_playlist.songs[i].song_id,
                position: i
            });
        }
        const { data: nps_data, error: nps_err } = await supabase
            .from('playlists_songs')
            .upsert(new_playlist_songs)
            .select()

        if (nps_err) {
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
