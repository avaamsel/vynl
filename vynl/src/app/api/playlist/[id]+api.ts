import { createSupabaseClient } from "@/src/server/supabase";
import { getPlaylistFromDatabase } from "@/src/server/dataDeserialization";
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
