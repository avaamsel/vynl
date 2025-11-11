const BASE_URL = "https://ws.audioscrobbler.com/2.0/";

const LASTFM_API_KEY = process.env.EXPO_PUBLIC_LASTFM_API_KEY || "";

export class LastFmService {
    constructor() {
        if (!LASTFM_API_KEY) {
            throw new Error("Missing LASTFM_API_KEY environment variable. Make sure it's set in .env and dotenv is loaded.");
        }
    }

    private formatParams(params: Record<string, string | number>) {
        return {
        ...params,
        api_key: LASTFM_API_KEY,
        format: "json",
        };
    }
    

    /**
     * Check if a specific track exists in Last.fm database.
     * Returns true if found, false otherwise.
     */
    async trackExists(artist: string, track: string): Promise<boolean> {
        const params = new URLSearchParams({
            method: "track.getinfo",
            artist,
            track,
            api_key: LASTFM_API_KEY,
            format: "json",
        });

        try {
            const response = await fetch(`${BASE_URL}?${params.toString()}`);
            const data = await response.json();

            if (data?.track) {
                return true;
            }

            return false;
        } catch (error) {
            console.error("Error while checking track existence:", error);
            return false;
        }
    }



    /**
     * Search for tracks based on a query (e.g., partial song name input by user).
     */
    async searchTracks(query: string, limit: number = 5) {
        try {
            const params = new URLSearchParams(
            this.formatParams({
                method: "track.search",
                track: query,
                limit,
            })
            );

            const response = await fetch(`${BASE_URL}?${params.toString()}`);
            const data = await response.json();

            return data.results?.trackmatches?.track || [];
        } catch (error) {
            console.error("Error searching tracks:", error);
            return [];
        }
    }


    /**
     * Get similar (recommended) tracks for a given seed track.
     */
    async getSimilarTracks(artist: string, track: string, limit: number = 5) {
        try {
            // Build query parameters (including api_key + format via your helper)
            const params = new URLSearchParams(
            this.formatParams({
                method: "track.getsimilar",
                artist,
                track,
                limit,
            })
            );

            const response = await fetch(`${BASE_URL}?${params.toString()}`);
            const data = await response.json();

            return data.similartracks?.track || [];
        } catch (error) {
            console.error("Error fetching similar tracks:", error);
            return [];
        }
    }


    /**
     * Get detailed info about a specific track (can help validate iTunes results).
     */
    async getTrackInfo(artist: string, track: string): Promise<any | null> {
        try {
            const params = new URLSearchParams(
            this.formatParams({
                method: "track.getinfo",
                artist,
                track,
            })
            );

            const response = await fetch(`${BASE_URL}?${params.toString()}`);
            const data = await response.json();

            return data.track || null;
        } catch (error) {
            console.error("Error fetching track info:", error);
            return null;
        }
    }
}
