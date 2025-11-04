import { createSupabaseClient } from "@/src/server/supabase";
import { isPlaylistData } from "@/src/types/database.types";
import { deserializePlaylist } from "@/src/server/dataDeserialization";

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
            console.log("Invalid Playlist ID:", id);
            return new Response('Invalid Playlist ID', {
                status: 400
            });
        }

        const { data, error } = await supabase
            .from('playlists')
            .select('*')
            .eq('playlist_id', playlist_id)
            .single();

        if (error) {
            console.log("Error fetching playlist:", error);
            return new Response(JSON.stringify({ error: error.message }), { status: 404 })
        }

        if (!data) {
            console.log("Playlist not found:", playlist_id);
            return new Response('Playlist Not Found', {
                status: 404
            });
        }

        console.log("Fetched playlist:", data);

        const deserializedPlaylist = await deserializePlaylist(data, supabase);

        if (!deserializedPlaylist) {
            console.log("Error deserializing playlist:", playlist_id);
            return new Response('Error Deserializing Playlist', {
                status: 500
            });
        }

        const response = new Response(JSON.stringify(deserializedPlaylist), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        console.log("Sending data:" + JSON.stringify(deserializedPlaylist));
        // console.log("Response:", response);
        return response;
    } catch (error) {
        console.error(error);
        return new Response('Unknown Server Error', {
            status: 500
        });
    }

    
}
