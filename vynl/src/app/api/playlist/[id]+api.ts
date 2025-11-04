import { createSupabaseClient } from "@/src/server/supabase";

// GET "api/playlist"
export async function GET(req: Request, { id }: Record<string, string>) {
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

        const { data, error } = await supabase
            .from('playlists')
            .select('*')
            .eq('playlist_id', playlist_id)
            .single()

        if (error) {
            console.log("Error fetching playlist:", error);
            return new Response(JSON.stringify({ error: error.message }), { status: 404 })
        }

        if (!data) {
            return new Response('Playlist Not Found', {
                status: 404
            });
        }

        console.log("Fetched playlist:", data);
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        console.error(error);
        return new Response('Unknown Server Error', {
            status: 500
        });
    }

    
}
