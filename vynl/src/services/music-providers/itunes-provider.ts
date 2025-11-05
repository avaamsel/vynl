import { getRecommendationsForSongTable } from "../../server/song-recommendation/recommendationUtils";
import { Song } from "../../types/index.d";

interface ITunesSearchResult {
    results: Array<{
        artistName: string;
        trackName: string;
        artworkUrl100: string;
        trackId: number;
    }>;
}

/**
 * Fetch songs from iTunes API based on search value and number of songs.
 * @param searchValue The search term for the song.
 * @param numberOfSongs The number of songs to fetch.
 * @returns A promise that resolves to an array of song objects.
 */
async function fetchSongs(searchValue: string, numberOfSongs: number = 5): Promise<Array<{ artist: string; title: string; cover: string; trackId: number }>> {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchValue)}&media=music&limit=${numberOfSongs}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const data: ITunesSearchResult = await response.json();

    if (data.results && data.results.length > 0) {
        return data.results.map(result => ({
            artist: result.artistName,
            title: result.trackName,
            cover: result.artworkUrl100,
            trackId: result.trackId
        }));
    }

    return [];
}

/**
 * Fetch similar songs from iTunes API based on an array of track IDs.
 * @param trackIds An array of iTunes track IDs.
 * @returns A promise that resolves to an array of song objects.
 */
async function fetchSimilarSongs(trackIds: number[]): Promise<Array<{ artist: string; title: string }>> {
    // TODO: implement fetching songs by trackIds by using last.fm
    // TODO: the frontend should check that the songs selected by the user exist in last.fm api

    if (!trackIds || trackIds.length < 5) {
        return [];
    }

    // Join track IDs with commas to fetch all in one request
    const url = `https://itunes.apple.com/lookup?id=${trackIds.join(',')}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const data: ITunesSearchResult = await response.json();

    let tracksInfo: Song[] = [];
    
    if (data.results && data.results.length > 0) {
        tracksInfo = data.results.map(result => ({
            artist: result.artistName,
            title: result.trackName,
            song_id: 10, // Placeholder because we have to change the type to string
            duration_sec: null
        }));
    }

    console.log(tracksInfo);

    const similarTracks = getRecommendationsForSongTable(tracksInfo, 20);

    //TODO : start downloading the similar tracks in the database before returning

    return similarTracks;
}

