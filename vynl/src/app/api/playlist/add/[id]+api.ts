import { createSupabaseClient } from "@/src/server/supabase";
import { getPlaylistFromDatabase } from "@/src/server/dataDeserialization";
import { isITunesPlaylist, isITunesSong, isSongList } from "@/src/types";
import { isPlaylistData, playlist_song } from "@/src/types/database";

// PUT "api/playlist/add/:id"
export async function PUT(req: Request, { id }: Record<string, string>) {
    if (!id) {
        return new Response("Missing playlist ID", { status: 400 });
    }
    try {
        const playlist_id = parseInt(id);

        if (playlist_id == undefined) {
            console.log("Invalid Song ID:", id);
            return new Response('Invalid Playlist ID', {
                status: 400
            });
        }

        const body = await req.json();
        const supabase = await createSupabaseClient(req);
        // If given an error response return it
        if (supabase instanceof Response) {
            return supabase
        }

        const songList = body.songs;
        const old_playlist = await getPlaylistFromDatabase(id, supabase);
        
        // If given an error response from playlist method
        if (old_playlist instanceof Response) {
            console.log("Error fetching old playlist : ", old_playlist);
            return old_playlist;
        }

        if (!isSongList(songList)) {
            return new Response("Invalid body: expected { songs[] }", { status: 400 });
        }

        // Upsert all song objects into the song table
        const { data: s_data, error: s_err } = await supabase
            .from('songs')
            .upsert(songList)

        if (s_err) {
            console.log("s_err", s_err);
            return new Response('Failed to insert into database', {
                status: 400
            });
        }

        // Add or update new playlist songs
        const new_song_ids = new Set<number>();
        let new_playlist_songs: playlist_song[] = [];
        for (let i = 0; i < songList.length; i++) {
            new_song_ids.add(songList[i].song_id);
            new_playlist_songs.push({
                playlist_id: old_playlist.id,
                song_id: songList[i].song_id,
                position: i + old_playlist.songs.length
            });
        }
        const { data: nps_data, error: nps_err } = await supabase
            .from('playlists_songs')
            .upsert(new_playlist_songs)
            .select()

        if (nps_err) {
            console.log("Failed to insert into database : ", nps_err);
            return new Response('Failed to insert into database', {
                status: 400
            });
        }

        return new Response(JSON.stringify(old_playlist), {
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