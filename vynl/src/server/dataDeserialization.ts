import { Database } from "../types/database.types.ts";
import { playlist_data } from "../types/database";
import { ITunesPlaylist, ITunesSong } from "../types";
import { SupabaseClient } from "@supabase/supabase-js";

export async function deserializePlaylist(playlist_data: playlist_data, supabase: SupabaseClient<Database>): Promise<ITunesPlaylist | null> {

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

    const songs: ITunesSong[] = (data ?? [])
        .map((ps) => ps.songs)
        .filter((song): song is ITunesSong => song !== null)
        .map((s) => ({
            song_id: s.song_id,
            title: s.title,
            artist: s.artist,
            duration_sec: s.duration_sec,
            cover_url: s.cover_url,
            preview_url: s.preview_url,
        }));

    const playlist: ITunesPlaylist = {
        id: playlist_data.playlist_id,
        name: playlist_data.name,
        created_at: playlist_data.created_at,
        user_id: playlist_data.uid,
        songs,
    };

    return playlist;
}

export async function getPlaylistFromDatabase(id: string, supabase: SupabaseClient<Database>): Promise<ITunesPlaylist | Response> {
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

export async function getSongFromDatabase(song_id: number, supabase: SupabaseClient<Database>): Promise<ITunesSong | Response> {
    const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('song_id', song_id)
        .single();

    if (error) {
        console.log("Error fetching song:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 404 })
    }

    if (!data) {
        console.log("Song not found:", song_id);
        return new Response('Playlist Not Found', {
            status: 404
        });
    }

    const song: ITunesSong = data;

    return song;
}