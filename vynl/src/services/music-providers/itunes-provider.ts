import { getRecommendationsForSongTable } from "../../server/song-recommendation/recommendationUtils";
import { ITunesSong } from "../../types/";

interface ITunesSearchResult {
    results: Array<{
        artistName: string;
        trackName: string;
        artworkUrl100: string;
        previewUrl: string;
        trackId: number;
        trackTimeMillis: number;
    }>;
}

function encodeForITunes(str: string): string {
  const trimmed = str.trim();

  // Replace spaces with +
  const withPluses = trimmed.replace(/ /g, '+');

  return withPluses
    .split('+')
    .map(part => encodeURIComponent(part))
    .join('+');
}



/**
 * Fetch songs from iTunes API based on search value and number of songs.
 * @param searchValue The search term for the song.
 * @param numberOfSongs The number of songs to fetch.
 * @returns A promise that resolves to an array of song objects.
 */
export async function fetchSongs(searchValue: string, numberOfSongs: number = 5): Promise<ITunesSong[]> {
    const url = `https://itunes.apple.com/search?term=${encodeForITunes(searchValue)}&media=music&limit=${numberOfSongs}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const data: ITunesSearchResult = await response.json();

    let songs: ITunesSong[] = [];

    if (data.results && data.results.length > 0) {
        songs = data.results.map(result => ({
            song_id: result.trackId,
            title: result.trackName,
            artist: result.artistName,
            duration_sec: Math.round(result.trackTimeMillis / 1000),
            cover_url: result.artworkUrl100,
            preview_url: result.previewUrl
        }));

        return songs;
    }

    return [];
}

/**
 * Fetch similar songs from iTunes API based on an array of track IDs.
 * @param trackIds An array of iTunes track IDs.
 * @returns A promise that resolves to an array of song objects.
 */
/*
async function fetchSimilarSongs(trackIds: number[]): Promise<Array<ITunesSong>> {
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

    let tracksInfo: ITunesSong[] = [];

    if (data.results && data.results.length > 0) {
        tracksInfo = data.results.map(result => ({
            artist: result.artistName,
            title: result.trackName,
            cover: result.artworkUrl100,
            preview_url: result.previewUrl
        }));
    }

    console.log(tracksInfo);

    const similarTracks = getRecommendationsForSongTable(tracksInfo, 20);

    //TODO : start downloading the similar tracks in the database before returning

    return similarTracks;
}
 */
