import { createSupabaseClient } from "@/src/server/supabase";
import { getPlaylistFromDatabase } from "@/src/server/dataDeserialization";
import { isPlaylist } from "@/src/types";
import { isPlaylistData } from "@/src/types/database";

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
        
        if (!isPlaylist(body)) {
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

        // Updating playlist object in database
        const { data: p_data, error: p_err } = await supabase
            .from('playlists')
            .insert({ name: new_playlist.name, uid: body.user_id})
            .eq('playlist_id', old_playlist.id)
            .select()
            .single();
        
        if (p_err || !isPlaylistData(p_data)) {
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
