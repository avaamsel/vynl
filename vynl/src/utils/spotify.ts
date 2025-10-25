import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const spotifyClientId: string = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID!;
const backendUrl: string = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';

// spotify api endpoints
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

const storage = Platform.OS === 'web' 
  ? localStorage 
  : AsyncStorage;

type SpotifyConfig = {
  clientId: string;
  backendUrl: string;
  storage: Storage;
  scopes: string[];
};

// configure spotify client
export const spotify = {
  config: {
    clientId: spotifyClientId,
    backendUrl: backendUrl,
    storage: Platform.OS === 'web' ? localStorage : AsyncStorage,
    scopes: [
      'user-read-email',
      'user-library-read',
      'playlist-read-private',
      'user-top-read'
    ]
  } as SpotifyConfig,

  async exchangeCodeForToken(
    code: string,
    redirectUri: string
  ): Promise<SpotifyTokenResponse> {
    try {
      const response = await fetch(`${this.config.backendUrl}/auth/spotify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to exchange Spotify code for token: ${errorMessage}`);
    }
  },

  // gets current auth token
  async getToken(): Promise<string | null> {
    return await this.config.storage.getItem('spotify_token');
  },

  // saves auth token to storage
  async setToken(token: string): Promise<void> {
    await this.config.storage.setItem('spotify_token', token);
  }
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
})
