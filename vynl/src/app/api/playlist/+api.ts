import { createSupabaseClient } from "@/src/server/supabase";
import { isPlaylist } from "@/src/types";
import { playlist_data } from "@/src/types/database";

// GET "api/playlist"
export async function GET(req: Request) {
    try {
        const supabase = await createSupabaseClient(req);

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

// CREATE "api/playlist"
export async function CREATE(req: Request) {
    try {
        const body = await req.json();
        const supabase = await createSupabaseClient(req);

        if (supabase instanceof Response) {
            return supabase
        }

        if (!isPlaylist(body)) {
            return new Response('Invalid Body, expected playlist object', {
                status: 400
            });
        }

        const { data, error } = await supabase
            .from('playlists')
            // .insert({name: body.name, uid: body.user_id})
            .select();
        
        if (error) {
            return new Response('Failed to insert into database', {
                status: 400
            });
        }

        console.log(data)

    } catch (error) {
        console.error(error);
        return new Response('Unknown Server Error', {
            status: 500
        });
    }
}