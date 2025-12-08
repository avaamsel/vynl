import { getPlaylistFromDatabase } from "@/src/server/dataDeserialization";
import { createSupabaseClient } from "@/src/server/supabase";
import { isITunesSong } from "@/src/types";


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
        
        const song = body.song;
        const old_playlist = await getPlaylistFromDatabase(id, supabase);
        
        // If given an error response from playlist method
        if (old_playlist instanceof Response) {
            console.log("Error fetching old playlist : ", old_playlist);
            return old_playlist;
        }

        if (!isITunesSong(song)) {
            return new Response("Invalid body: expected { song }", { status: 400 });
        }

        const { data: rps_data, error: rps_error } = await supabase
            .rpc('remove_song_from_playlist', {
                p_playlist_id: old_playlist.id,
                p_song_ids: song.song_id
            });

        if (rps_error) {
            console.log("Failed to insert into database : ", rps_error);
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