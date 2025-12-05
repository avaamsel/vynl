import { createSupabaseClient } from "@/src/server/supabase";
import { ITunesSong } from "@/src/types/index";
import { fetchSongs } from "@/src/services/music-providers/itunes-provider";
import { REGIONS } from '@/src/constants/regions';

// GET "api/playlist"
export async function GET(req: Request, { searchValue }: Record<string, string>): Promise<ITunesSong[] | Response> {
    try {

        const url = new URL(req.url);
        const countriesParam = url.searchParams.get("countries");
        const countries = countriesParam ? countriesParam.split(",") : REGIONS[0].topCountries;

        const decodedValue = decodeURIComponent(searchValue);
        const songResults = await fetchSongs(decodedValue, 5, countries);

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