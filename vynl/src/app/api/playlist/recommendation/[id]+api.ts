import { createSupabaseClient } from "@/src/server/supabase";
import { getPlaylistFromDatabase } from "@/src/server/dataDeserialization";
import { ITunesSong } from "@/src/types";
import { getRecommendationsForSongTable } from "@/src/server/song-recommendation/recommendationUtils";
import { fetchSongs } from "@/src/services/music-providers/itunes-provider";
import { REGIONS } from '@/src/constants/regions';

export async function GET(req: Request, { id }: Record<string, string>) {
    if (!id) {
        return new Response("Missing playlist ID", { status: 400 });
    }
    console.log("Recommendation request for playlist ID:", id);
    try {
        const { searchParams } = new URL(req.url);
        const amount = searchParams.get("amount") || "5"; // default if missing
        const numberOfSeedSongs = parseInt(amount);

        if (!numberOfSeedSongs || numberOfSeedSongs <= 0) {
            return new Response('Invalid amount parameter', {
                status: 400
            });
        }

        const url = new URL(req.url);
        const countriesParam = url.searchParams.get("countries");
        const countries = countriesParam ? countriesParam.split(",") : REGIONS[0].topCountries;
        const supabase = await createSupabaseClient(req);

        if (supabase instanceof Response) {
            return supabase
        }

        const deserializedPlaylist = await getPlaylistFromDatabase(id, supabase);

        if (deserializedPlaylist instanceof Response) {
            return deserializedPlaylist;
        }

        const songs: ITunesSong[] = [];
        deserializedPlaylist.songs.forEach((element: ITunesSong) => {
            songs.push({
                song_id: element.song_id,
                title: element.title,
                artist: element.artist,
                duration_sec: element.duration_sec,
                cover_url: element.cover_url,
                preview_url: element.preview_url
            });
        });

        const lastFMRecommendations = await getRecommendationsForSongTable(songs, numberOfSeedSongs);

        const recommendations: ITunesSong[] = [];

        for (const s of lastFMRecommendations) {
            try {
                const result = await fetchSongs(`${s.title} ${s.artist}`, 1, countries);
                if (result && result.length >= 1) {
                    recommendations.push(result[0]);
                } else {
                    console.log("Failed to find equivalent for : ", s);
                }
            } catch (err) {
                console.error("Failed to fetch song:", s.title, err);
            }
        }

        return new Response(JSON.stringify(recommendations), {
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