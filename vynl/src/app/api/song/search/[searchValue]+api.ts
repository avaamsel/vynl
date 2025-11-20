import { createSupabaseClient } from "@/src/server/supabase";
import { ITunesSong } from "@/src/types/index";
import { fetchSongs } from "@/src/services/music-providers/itunes-provider";

// GET "api/playlist"
export async function GET(req: Request, { searchValue }: Record<string, string>): Promise<ITunesSong[] | Response> {
    try {
        const songResults = await fetchSongs(searchValue, 5);

        return new Response(JSON.stringify(songResults), {
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