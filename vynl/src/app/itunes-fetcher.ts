interface ITunesSearchResult {
    results: Array<{
        artistName: string;
        trackName: string;
        artworkUrl100: string;
        trackId: number;
    }>;
}

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

async function fetchSimilarSongs(trackIds: number[]): Promise<null> {
    // TODO: implement fetching songs by trackIds by using last.fm
    return null;
}