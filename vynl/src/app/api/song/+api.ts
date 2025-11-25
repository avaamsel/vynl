import { createSupabaseClient } from "@/src/server/supabase";
import { isITunesSong } from "@/src/types";
import { isSongData } from "@/src/types/database";

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const supabase = await createSupabaseClient(req);

        if (supabase instanceof Response) {
            console.log("Failed to create client");
            return supabase
        }

        if (!isITunesSong(body)) {
            console.log("is not itunes song");
            return new Response('Invalid Body, expected itunes song object', {
                status: 400
            });
        }

        const { data: s_data, error: s_err } = await supabase
            .from('songs')
            .upsert(
                {
                artist: body.artist,
                title: body.title,
                song_id: body.song_id,
                duration_sec: body.duration_sec,
                cover_url: body.cover_url,
                preview_url: body.preview_url
                },
                { onConflict: 'song_id' }
            )
            .select()
            .single();

        
        if (s_err || !isSongData(s_data)) {
            console.log("ici", s_err, s_data);
            return new Response('Failed to insert song into database', {
                status: 400
            });
        }
        return new Response(JSON.stringify(s_data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error(error);
        return new Response('Unknown Server Error', {
            status: 500
        });
    }
}