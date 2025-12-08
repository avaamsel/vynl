import { createSupabaseClient } from "@/src/server/supabase";
import { getPlaylistFromDatabase } from "@/src/server/dataDeserialization";
import { isITunesPlaylist, isITunesSong, isSongList } from "@/src/types";
import { isPlaylistData, playlist_song } from "@/src/types/database";

// PUT "api/playlist/add/:id"
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
        const old_playlist = await getPlaylistFromDatabase(id, supabase);
        
        // If given an error response from playlist method
        if (old_playlist instanceof Response) {
            console.log("Error fetching old playlist : ", old_playlist);
            return old_playlist;
        }

        if (!isSongList(songList)) {
            return new Response("Invalid body: expected { songs[] }", { status: 400 });
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

        // Get list of song ids
        const new_song_ids = new Array();
        const song_id_set = new Set();
        for (let i = 0; i < songList.length; i++) {
            if (song_id_set.has(songList[i].song_id)) {
                // Song was a duplicate, so skip from adding it to list
                continue;
            }
            new_song_ids.push(songList[i].song_id);
            song_id_set.add(songList[i].song_id);
        }
        const { data: nps_data, error: nps_err } = await supabase
            .rpc('add_songs_to_playlist', {
                p_playlist_id: old_playlist.id,
                p_song_ids: new_song_ids
            });

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

        return new Response('OK', {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });
    } catch (error) {
        console.error(error);
        return new Response('Unknown Server Error', {
            status: 500
        });
    }
}