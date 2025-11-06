import { createSupabaseClient } from "@/src/server/supabase";
import { ITunesSong } from "@/src/types/index.d";
import { fetchSongs } from "@/src/services/music-providers/itunes-provider";

// GET "api/playlist"
export async function GET(req: Request, { searchValue }: Record<string, string>): Promise<ITunesSong[] | Response> {
    try {
        const supabase = await createSupabaseClient(req);

        // If given an error response return it
        if (supabase instanceof Response) {
            return supabase
        }

        const searchResults = await fetchSongs(searchValue, 5);

        const songResults: ITunesSong[] = [];
        for (const result of searchResults) {
            songResults.push({
                artist: result.artist,
                title: result.title,
                cover: result.cover,
                preview_url: result.preview_url
            });
        }

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