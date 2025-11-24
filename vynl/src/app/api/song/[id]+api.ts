import { getSongFromDatabase } from "@/src/server/dataDeserialization";
import { createSupabaseClient } from "@/src/server/supabase";
import { ITunesSong } from "@/src/types/";

export async function GET(req: Request, { id }: Record<string, string>) {
    try {
        const supabase = await createSupabaseClient(req);

        if (supabase instanceof Response) {
            return supabase
        }

        const song_id = parseInt(id);

        if (song_id == undefined) {
            console.log("Invalid Song ID:", id);
            return new Response('Invalid Playlist ID', {
                status: 400
            });
        }

        const song = await getSongFromDatabase(song_id, supabase);

        if (song instanceof Response) {
            return song;
        }

        return new Response(JSON.stringify(song), {
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