import { createSupabaseClient } from "@/src/server/supabase";
import { isITunesPlaylist } from "@/src/types";
import { isPlaylistData, isPlaylistSong, isSongData } from "@/src/types/database";

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

// POST "api/playlist"
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const supabase = await createSupabaseClient(req);

        if (supabase instanceof Response) {
            return supabase
        }

        if (
            !body ||
            typeof body.name !== "string" ||
            typeof body.user_id !== "string" ||
            !Array.isArray(body.songs)
        ) {
            return new Response("Invalid body: expected { user_id, name, songs[] }", {
                status: 400
            });
        }

        const { data: p_data, error: p_err } = await supabase
            .from('playlists')
            .insert({ name: body.name, uid: body.user_id})
            .select()
            .single();
        
        if (p_err || !isPlaylistData(p_data)) {
            console.log('error: ');
            console.log(p_err);
            console.log('data:');
            console.log(p_data);
            return new Response('Failed to insert into database', {
                status: 400
            });
        }

        for (const song of body.songs) {
            if (!isSongData(song)) {
                return new Response("Invalid song structure in playlist.songs", {
                    status: 400
                });
            }
        }

        for (let i = 0; i < body.songs.length; i++) {
            const cur_song = body.songs[i];
            const { data: s_data, error: s_err } = await supabase
                .from('songs')
                .upsert({
                    song_id: cur_song.song_id, 
                    artist: cur_song.artist, 
                    duration_sec: cur_song.duration_sec,
                    title: cur_song.title,
                    cover_url: cur_song.cover_url,
                    preview_url: cur_song.preview_url
                });

            const { data: ps_data, error: ps_err } = await supabase
                .from('playlists_songs')
                .insert({
                    playlist_id: p_data.playlist_id,
                    position: i,
                    song_id: cur_song.song_id
                });

            if (ps_err || s_err || !isSongData(s_data) || !isPlaylistSong(ps_data)) {
                return new Response('Failed to insert songs into database', {
                    status: 400
                });
            }
        }

        return new Response('Happy happy times', {
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