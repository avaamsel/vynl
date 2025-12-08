import { deserializePlaylist } from "@/src/server/dataDeserialization";
import { createSupabaseClient } from "@/src/server/supabase";
import { isITunesPlaylist, ITunesPlaylist } from "@/src/types";
import { isPlaylistData, isPlaylistSong, isSongData } from "@/src/types/database";

// GET "api/playlist"
export async function GET(req: Request) {
    try {
        const supabase = await createSupabaseClient(req);

        if (supabase instanceof Response) {
            return supabase
        }

        const { searchParams } = new URL(req.url);
        const uid = searchParams.get("uid");
        const party = searchParams.has("party");

        let data, error;

        if (!uid) {
            ({ data, error } = await supabase
                .from('playlists')
                .select('*'));
        } else {
            if (!party) {
                ({ data, error } = await supabase
                    .from('playlists')
                    .select('*')
                    .eq('uid', uid));
            } else {
                ({ data, error } = await supabase
                    .from('party_users')
                    .select(`
                        playlist_id,
                        playlists (*)
                    `)
                    .eq('user_id', uid));
                data = data?.map(d =>
                    d.playlists
                )
            }
        }

        if (error) {
            console.log("Error fetching playlists:", error);
            return new Response(JSON.stringify({ error: error.message }), { status: 404 })
        }

        if (!data) return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });

        let playlists = [];
        for (let i = 0; i < data.length; i++) {
            let playlist = await deserializePlaylist(data[i], supabase);
            playlists.push(playlist);
        }

        return new Response(JSON.stringify(playlists), {
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
            console.log("Client creation failed : ", await supabase.text());
            return supabase
        }

        if (
            !body ||
            typeof body.name !== "string" ||
            typeof body.user_id !== "string" ||
            !Array.isArray(body.songs)
        ) {
            console.log("Invalid body");
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
            console.log(body);
            console.log('data:');
            console.log(p_data);
            return new Response('Failed to insert into database', {
                status: 400
            });
        }

        // TODO: We can reduce the number of http request we make if we batch these requests
        for (let i = 0; i < body.songs.length; i++) {
            const cur_song = body.songs[i];
            const { data: s_data, error: s_err } = await supabase
                .from('songs')
                .upsert(cur_song);

            const { data: ps_data, error: ps_err } = await supabase
                .from('playlists_songs')
                .insert({
                    playlist_id: p_data.playlist_id,
                    position: i,
                    song_id: cur_song.song_id
                });

            if (ps_err || s_err) {
                console.log("Failed to insert songs/playlist_song in database");
                console.log("PS err : ", ps_err);
                console.log("s_err", s_err);

                return new Response('Failed to insert songs into database', {
                    status: 400
                });
            }
        }

        let new_playlist: ITunesPlaylist = {
            id: p_data.playlist_id,
            created_at: p_data.created_at,
            user_id: p_data.uid,
            name: p_data.name,
            songs: body.songs
        }

        return new Response(JSON.stringify(new_playlist), {
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