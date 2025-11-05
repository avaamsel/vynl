import { Database } from "../types/database.types";
import { playlist_data } from "../types/database";
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

    if (error) {
        console.error(error);
        return null;
    }

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

export async function getPlaylistFromDatabase(id: string, supabase: SupabaseClient<Database>): Promise<Playlist | Response> {
    const playlist_id = parseInt(id);

    if (playlist_id == undefined) {
        console.log("Invalid Playlist ID:", id);
        return new Response('Invalid Playlist ID', {
            status: 400
        });
    }

    const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('playlist_id', playlist_id)
        .single();

    if (error) {
        console.log("Error fetching playlist:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 404 })
    }

    if (!data) {
        console.log("Playlist not found:", playlist_id);
        return new Response('Playlist Not Found', {
            status: 404
        });
    }

    const deserializedPlaylist = await deserializePlaylist(data, supabase);

    if (!deserializedPlaylist) {
        console.log("Error deserializing playlist:", id);
        return new Response('Error Deserializing Playlist', {
            status: 500
        });
    }
    return deserializedPlaylist;
}