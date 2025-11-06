import { createSupabaseClient } from "@/src/server/supabase";
import { getPlaylistFromDatabase } from "@/src/server/dataDeserialization";
import { ITunesSong } from "@/src/types";
import { getRecommendationsForSongTable } from "@/src/server/song-recommendation/recommendationUtils";

export async function GET(req: Request, { id }: Record<string, string>) {
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

        const recommendations = await getRecommendationsForSongTable(songs, numberOfSeedSongs);

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