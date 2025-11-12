import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SPOTIFY_TOKEN_KEY = '@vynl:spotify_access_token';
const SPOTIFY_REFRESH_TOKEN_KEY = '@vynl:spotify_refresh_token';
const SPOTIFY_TOKEN_EXPIRY_KEY = '@vynl:spotify_token_expiry';

export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    images: Array<{ url: string }>;
  };
}

export interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[];
  };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  external_urls: {
    spotify: string;
  };
}

/**
 * Store Spotify access token securely
 */
export async function storeSpotifyToken(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  try {
    const expiryTime = Date.now() + expiresIn * 1000;
    await AsyncStorage.multiSet([
      [SPOTIFY_TOKEN_KEY, accessToken],
      [SPOTIFY_REFRESH_TOKEN_KEY, refreshToken],
      [SPOTIFY_TOKEN_EXPIRY_KEY, expiryTime.toString()],
    ]);
  } catch (error) {
    console.error('Error storing Spotify token:', error);
    throw error;
  }
}

/**
 * Get stored Spotify access token
 */
export async function getSpotifyToken(): Promise<string | null> {
  try {
    const [token, expiry] = await AsyncStorage.multiGet([
      SPOTIFY_TOKEN_KEY,
      SPOTIFY_TOKEN_EXPIRY_KEY,
    ]);

    const accessToken = token[1];
    const expiryTime = expiry[1] ? parseInt(expiry[1], 10) : 0;

    // Check if token is expired
    if (!accessToken || Date.now() >= expiryTime) {
      // Token expired, try to refresh
      const refreshToken = await AsyncStorage.getItem(SPOTIFY_REFRESH_TOKEN_KEY);
      if (refreshToken) {
        try {
          const newToken = await refreshSpotifyToken(refreshToken);
          return newToken;
        } catch (error) {
          console.error('Error refreshing token:', error);
          // Clear invalid tokens
          await clearSpotifyTokens();
          return null;
        }
      }
      return null;
    }

    return accessToken;
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    return null;
  }
}

/**
 * Refresh Spotify access token using refresh token
 * Uses backend API route for security
 */
async function refreshSpotifyToken(refreshToken: string): Promise<string> {
  try {
    // Use backend API route to refresh token (more secure)
    let apiUrl = '/api/spotify/refresh';
    
    if (Platform.OS !== 'web') {
      // For mobile with Expo Router, API routes are available via the dev server
      const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL;
      if (apiBaseUrl) {
        apiUrl = `${apiBaseUrl}/api/spotify/refresh`;
      } else {
        // Fallback for development
        apiUrl = 'http://localhost:8081/api/spotify/refresh';
      }
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    await storeSpotifyToken(data.access_token, data.refresh_token || refreshToken, data.expires_in);
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing token via API:', error);
    // Fallback to direct API call if backend route doesn't exist
    // Note: This requires the client secret, which should NOT be exposed in production
    // This is a fallback for development only
    console.warn('Falling back to direct token refresh (not recommended for production)');
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || '',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to refresh token: ${errorText}`);
    }

    const data = await response.json();
    await storeSpotifyToken(data.access_token, refreshToken, data.expires_in);
    return data.access_token;
  }
}

/**
 * Clear stored Spotify tokens
 */
export async function clearSpotifyTokens(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      SPOTIFY_TOKEN_KEY,
      SPOTIFY_REFRESH_TOKEN_KEY,
      SPOTIFY_TOKEN_EXPIRY_KEY,
    ]);
  } catch (error) {
    console.error('Error clearing Spotify tokens:', error);
  }
}

/**
 * Check if user is authenticated with Spotify
 */
export async function isSpotifyAuthenticated(): Promise<boolean> {
  const token = await getSpotifyToken();
  return token !== null;
}

/**
 * Get current Spotify user profile
 */
export async function getSpotifyUser(): Promise<any> {
  const token = await getSpotifyToken();
  if (!token) {
    throw new Error('Not authenticated with Spotify');
  }

  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      await clearSpotifyTokens();
      throw new Error('Spotify authentication expired');
    }
    throw new Error('Failed to get Spotify user');
  }

  return response.json();
}

/**
 * Search for a track on Spotify
 */
export async function searchSpotifyTrack(
  query: string,
  limit: number = 5
): Promise<SpotifyTrack[]> {
  const token = await getSpotifyToken();
  if (!token) {
    throw new Error('Not authenticated with Spotify');
  }

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      await clearSpotifyTokens();
      throw new Error('Spotify authentication expired');
    }
    throw new Error('Failed to search Spotify');
  }

  const data: SpotifySearchResult = await response.json();
  return data.tracks.items;
}

/**
 * Create a playlist on Spotify
 */
export async function createSpotifyPlaylist(
  name: string,
  description?: string
): Promise<SpotifyPlaylist> {
  const token = await getSpotifyToken();
  if (!token) {
    throw new Error('Not authenticated with Spotify');
  }

  const user = await getSpotifyUser();
  const userId = user.id;

  const response = await fetch(
    `https://api.spotify.com/v1/users/${userId}/playlists`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description: description || `Playlist created from Vynl`,
        public: false,
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      await clearSpotifyTokens();
      throw new Error('Spotify authentication expired');
    }
    throw new Error('Failed to create Spotify playlist');
  }

  return response.json();
}

/**
 * Add tracks to a Spotify playlist
 */
export async function addTracksToSpotifyPlaylist(
  playlistId: string,
  trackUris: string[]
): Promise<void> {
  const token = await getSpotifyToken();
  if (!token) {
    throw new Error('Not authenticated with Spotify');
  }

  // Spotify API allows adding up to 100 tracks at once
  const chunks = [];
  for (let i = 0; i < trackUris.length; i += 100) {
    chunks.push(trackUris.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: chunk,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        await clearSpotifyTokens();
        throw new Error('Spotify authentication expired');
      }
      throw new Error('Failed to add tracks to Spotify playlist');
    }
  }
}

/**
 * Export a playlist to Spotify
 * This function handles the entire export process:
 * 1. Search for each song on Spotify
 * 2. Create a new playlist
 * 3. Add all found tracks to the playlist
 */
export async function exportPlaylistToSpotify(
  playlistName: string,
  songs: Array<{ title: string; artist: string }>,
  onProgress?: (progress: { current: number; total: number; status: string }) => void
): Promise<{ playlistId: string; playlistUrl: string; tracksFound: number; tracksTotal: number }> {
  try {
    onProgress?.({ current: 0, total: songs.length, status: 'Searching for tracks...' });

    // Search for each track on Spotify
    const trackUris: string[] = [];
    let tracksFound = 0;

    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      onProgress?.({ 
        current: i + 1, 
        total: songs.length, 
        status: `Searching for "${song.title}" by ${song.artist}...` 
      });

      try {
        // Search using both title and artist
        const searchQuery = `track:${song.title} artist:${song.artist}`;
        const results = await searchSpotifyTrack(searchQuery, 1);
        
        if (results.length > 0) {
          trackUris.push(results[0].uri);
          tracksFound++;
        } else {
          // Try with just the title
          const titleOnlyResults = await searchSpotifyTrack(song.title, 1);
          if (titleOnlyResults.length > 0) {
            trackUris.push(titleOnlyResults[0].uri);
            tracksFound++;
          }
        }
      } catch (error) {
        console.error(`Error searching for "${song.title}":`, error);
        // Continue with next song
      }
    }

    if (trackUris.length === 0) {
      throw new Error('No tracks found on Spotify');
    }

    onProgress?.({ 
      current: songs.length, 
      total: songs.length, 
      status: 'Creating playlist...' 
    });

    // Create the playlist
    const playlist = await createSpotifyPlaylist(playlistName);

    onProgress?.({ 
      current: songs.length, 
      total: songs.length, 
      status: 'Adding tracks to playlist...' 
    });

    // Add tracks to the playlist
    await addTracksToSpotifyPlaylist(playlist.id, trackUris);

    return {
      playlistId: playlist.id,
      playlistUrl: playlist.external_urls.spotify,
      tracksFound,
      tracksTotal: songs.length,
    };
  } catch (error) {
    console.error('Error exporting playlist to Spotify:', error);
    throw error;
  }
}

