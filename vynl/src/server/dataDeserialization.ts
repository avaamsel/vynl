import { Database, playlist_data } from "../types/database.types";
import { Playlist, Song } from "../types";
import { SupabaseClient } from "@supabase/supabase-js";

export async function deserializePlaylist(playlist_data: playlist_data, supabase: SupabaseClient<Database>): Promise<Playlist | null> {

    const { data, error } = await supabase
        .from("playlists_songs")
        .select(`
            playlist_id,
            position,
            song_id,
            songs (
                song_id,
                title,
                artist,
                duration_sec
            )`)
        .eq("playlist_id", playlist_data.playlist_id)
        .order("position", { ascending: true });

    const songs: Song[] = (data ?? [])
        .map((ps) => ps.songs)
        .filter((song): song is Song => song !== null)
        .map((s) => ({
            song_id: s.song_id,
            title: s.title,
            artist: s.artist,
            duration_sec: s.duration_sec
        }));

    const playlist: Playlist = {
        id: playlist_data.playlist_id,
        name: playlist_data.name,
        created_at: playlist_data.created_at,
        user_id: playlist_data.uid,
        songs,
    };

    return playlist;
}