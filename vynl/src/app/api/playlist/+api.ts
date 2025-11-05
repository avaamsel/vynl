import { createSupabaseClient } from "@/src/server/supabase";

// GET "api/playlist"
export async function GET(req: Request) {
    try {
        const supabase = await createSupabaseClient(req);
        console.log("Supabase client created:", supabase);

        if (supabase instanceof Response) {
            return supabase
        }

        const { data, error } = await supabase
            .from('playlists')
            .select('*')

        if (error) {
            console.log("Error fetching playlists:", error);
            return new Response(JSON.stringify({ error: error.message }), { status: 404 })
        }

        console.log("Fetched playlists:", data);
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

// PUT "api/playlist/:id"
export async function PUT(req: Request) {
    
}