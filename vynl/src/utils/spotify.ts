import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import base64 from 'base-64';

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
      const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL;
      if (apiBaseUrl) {
        apiUrl = `${apiBaseUrl}/api/spotify/refresh`;
      } else {
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
    // Only works in development with client secret available
    console.warn('Falling back to direct token refresh (not recommended for production)');
    
    const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || '';
    const clientSecret = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error(
        'Cannot refresh token: API route failed and client credentials not available. ' +
        'Please ensure EXPO_PUBLIC_SPOTIFY_CLIENT_ID and EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET are set for development.'
      );
    }
    
    // Create Basic Auth header
    const credentials = base64.encode(`${clientId}:${clientSecret}`);
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
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
 * Get user's Spotify playlists
 */
export async function getUserSpotifyPlaylists(limit: number = 50): Promise<SpotifyPlaylist[]> {
  const token = await getSpotifyToken();
  if (!token) {
    throw new Error('Not authenticated with Spotify');
  }

  const playlists: SpotifyPlaylist[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore && playlists.length < limit) {
    const response = await fetch(
      `https://api.spotify.com/v1/me/playlists?limit=50&offset=${offset}`,
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
      throw new Error('Failed to get Spotify playlists');
    }

    const data = await response.json();
    playlists.push(...data.items);
    
    hasMore = data.items.length === 50 && playlists.length < limit;
    offset += 50;
  }

  return playlists.slice(0, limit);
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
 * Find an existing playlist by name or create a new one
 * This ensures the same URI is generated for the same playlist name
 */
export async function findOrCreateSpotifyPlaylist(
  name: string,
  description?: string
): Promise<SpotifyPlaylist> {
  try {
    // First, try to find an existing playlist with the same name
    const playlists = await getUserSpotifyPlaylists(50);
    const existingPlaylist = playlists.find(p => p.name === name);
    
    if (existingPlaylist) {
      console.log(`Found existing playlist "${name}" with ID: ${existingPlaylist.id}`);
      return existingPlaylist;
    }
    
    // If not found, create a new one
    console.log(`Creating new playlist "${name}"`);
    return await createSpotifyPlaylist(name, description);
  } catch (error) {
    console.error('Error finding or creating playlist:', error);
    // If getting playlists fails, try to create a new one
    return await createSpotifyPlaylist(name, description);
  }
}

/**
 * Validate a Spotify track URI
 */
function isValidSpotifyUri(uri: string | null | undefined): boolean {
  if (!uri || typeof uri !== 'string') {
    return false;
  }
  // Spotify URIs should be in format: spotify:track:<track_id>
  return uri.startsWith('spotify:track:') && uri.length > 14;
}

/**
 * Get tracks from a Spotify playlist
 */
async function getPlaylistTracks(playlistId: string): Promise<Array<{ uri: string }>> {
  const token = await getSpotifyToken();
  if (!token) {
    throw new Error('Not authenticated with Spotify');
  }

  const tracks: Array<{ uri: string }> = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=100`,
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
      throw new Error('Failed to get playlist tracks');
    }

    const data = await response.json();
    // Filter out null tracks (deleted tracks) and extract URIs
    const items = data.items
      .filter((item: any) => item.track !== null)
      .map((item: any) => ({ uri: item.track.uri }))
      .filter((item: any) => item.uri);
    tracks.push(...items);
    
    hasMore = data.items.length === 100;
    offset += 100;
  }

  return tracks;
}

/**
 * Replace all tracks in a Spotify playlist
 */
async function replacePlaylistTracks(
  playlistId: string,
  trackUris: string[]
): Promise<void> {
  const token = await getSpotifyToken();
  if (!token) {
    throw new Error('Not authenticated with Spotify');
  }

  // Filter out invalid URIs before processing
  const validUris = trackUris.filter(uri => isValidSpotifyUri(uri));
  
  if (validUris.length === 0) {
    throw new Error('No valid track URIs to add to playlist');
  }

  if (validUris.length < trackUris.length) {
    const invalidCount = trackUris.length - validUris.length;
    console.warn(`Filtered out ${invalidCount} invalid track URI(s)`);
  }

  // First, get existing tracks to clear them
  const existingTracks = await getPlaylistTracks(playlistId);
  
  // Clear existing tracks if any
  if (existingTracks.length > 0) {
    const existingUris = existingTracks.map(t => t.uri).filter(uri => uri);
    
    // Spotify API allows removing up to 100 tracks at once
    const clearChunks = [];
    for (let i = 0; i < existingUris.length; i += 100) {
      clearChunks.push(existingUris.slice(i, i + 100));
    }

    for (const chunk of clearChunks) {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: 'DELETE',
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
        console.warn('Failed to clear existing tracks, continuing anyway');
      }
    }
  }

  // Add new tracks
  console.log(`Adding ${validUris.length} track URI(s) to playlist ${playlistId}:`);
  validUris.forEach((uri, index) => {
    console.log(`  [${index + 1}] ${uri}`);
  });

  // Spotify API allows adding up to 100 tracks at once
  const chunks = [];
  for (let i = 0; i < validUris.length; i += 100) {
    chunks.push(validUris.slice(i, i + 100));
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
      
      // Try to get more detailed error information
      let errorMessage = 'Failed to add tracks to Spotify playlist';
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error.message || errorMessage;
          // If it's an INVALID_URI error, provide more helpful context
          if (errorData.error.message?.includes('INVALID_URI') || 
              errorData.error.message?.includes('invalid uri')) {
            errorMessage = `Invalid track URI detected. Please try exporting again. The problematic track may have been filtered out automatically.`;
            console.error('INVALID_URI error details:', errorData);
            console.error('URIs that caused the error:', chunk);
          }
        }
      } catch (e) {
        // If we can't parse the error, use the default message
        console.error('Failed to parse error response:', e);
      }
      
      throw new Error(errorMessage);
    }
  }
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

  // Filter out invalid URIs before processing
  const validUris = trackUris.filter(uri => isValidSpotifyUri(uri));
  
  console.log(`Adding ${validUris.length} track URI(s) to playlist ${playlistId}:`);
  validUris.forEach((uri, index) => {
    console.log(`  [${index + 1}] ${uri}`);
  });
  
  if (validUris.length === 0) {
    throw new Error('No valid track URIs to add to playlist');
  }

  if (validUris.length < trackUris.length) {
    const invalidCount = trackUris.length - validUris.length;
    console.warn(`Filtered out ${invalidCount} invalid track URI(s)`);
  }

  // Spotify API allows adding up to 100 tracks at once
  const chunks = [];
  for (let i = 0; i < validUris.length; i += 100) {
    chunks.push(validUris.slice(i, i + 100));
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
      
      // Try to get more detailed error information
      let errorMessage = 'Failed to add tracks to Spotify playlist';
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error.message || errorMessage;
          // If it's an INVALID_URI error, provide more helpful context
          if (errorData.error.message?.includes('INVALID_URI') || 
              errorData.error.message?.includes('invalid uri')) {
            errorMessage = `Invalid track URI detected. Please try exporting again. The problematic track may have been filtered out automatically.`;
            console.error('INVALID_URI error details:', errorData);
            console.error('URIs that caused the error:', chunk);
          }
        }
      } catch (e) {
        // If we can't parse the error, use the default message
        console.error('Failed to parse error response:', e);
      }
      
      throw new Error(errorMessage);
    }
  }
}

/**
 * Export a playlist to Spotify
 * This function handles the entire export process:
 * 1. Search for each song on Spotify
 * 2. Find existing playlist with same name or create a new one (ensures same URI)
 * 3. Replace all tracks in the playlist with found tracks
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
        
        if (results.length > 0 && results[0].uri && isValidSpotifyUri(results[0].uri)) {
          console.log(`Found URI for "${song.title}" by ${song.artist}: ${results[0].uri}`);
          trackUris.push(results[0].uri);
          tracksFound++;
        } else {
          // Try with just the title
          const titleOnlyResults = await searchSpotifyTrack(song.title, 1);
          if (titleOnlyResults.length > 0 && titleOnlyResults[0].uri && isValidSpotifyUri(titleOnlyResults[0].uri)) {
            console.log(`Found URI for "${song.title}" by ${song.artist}: ${titleOnlyResults[0].uri}`);
            trackUris.push(titleOnlyResults[0].uri);
            tracksFound++;
          } else {
            console.warn(`No valid URI found for "${song.title}" by ${song.artist}`);
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
      status: 'Finding or creating playlist...' 
    });

    // Find existing playlist with same name or create a new one
    // This ensures the same URI is generated for the same playlist name
    const playlist = await findOrCreateSpotifyPlaylist(playlistName);

    onProgress?.({ 
      current: songs.length, 
      total: songs.length, 
      status: 'Updating playlist tracks...' 
    });

    // Replace all tracks in the playlist (clear existing and add new ones)
    await replacePlaylistTracks(playlist.id, trackUris);

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

