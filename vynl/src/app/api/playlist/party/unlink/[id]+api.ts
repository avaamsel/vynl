import { createSupabaseClient } from "@/src/server/supabase";

// PUT "api/playlist/party/unlink/:id"
export async function PUT(req: Request, { id }: Record<string, string>) {
    try {
        const supabase = await createSupabaseClient(req);

        // If given an error response return it
        if (supabase instanceof Response) {
            return supabase
        }

        const playlist_id = parseInt(id);

        if (playlist_id == undefined) {
            console.log("Invalid Playlist ID:", id);
            return new Response('Invalid Playlist ID', {
                status: 400
            });
        }

        const { data: playlist, error: p_err } = await supabase
            .from('playlists')
            .select('*')
            .eq('playlist_id', playlist_id)
            .single();

        if (!playlist) {
            return new Response("Playlist not found", {
                status: 404,
                headers: { 'Content-Type': 'text/html' }
            });
        }

        // Using RLS, the user can only select party user entries that they "own"
        // So when they call delete they only need to specific the playlist_id
        // because they cannot select any other entries that do not contain their uuid.
        // And to delete an entry you must also be able to select it.
        const { data: unlink_data, error: unlink_err } = await supabase
            .from('party_user')
            .delete()
            .eq( 'playlist_id', playlist.playlist_id );

        if (unlink_err) {
            console.log(unlink_err);
            return new Response("Error linking playlist", {
                status: 400,
                headers: { 'Content-Type': 'text/html' }
            });
        }

        return new Response("OK", {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });
    } catch (error) {
        console.error(error);
        return new Response('Unknown Server Error', {
            status: 500,
            headers: { 'Content-Type': 'text/html' }
        });
    }
}