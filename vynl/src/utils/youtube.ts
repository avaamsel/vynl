import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import base64 from 'base-64';

const YOUTUBE_TOKEN_KEY = '@vynl:youtube_access_token';
const YOUTUBE_REFRESH_TOKEN_KEY = '@vynl:youtube_refresh_token';
const YOUTUBE_TOKEN_EXPIRY_KEY = '@vynl:youtube_token_expiry';

export interface YouTubePlaylist {
  id: string;
  snippet: {
    title: string;
    description?: string;
  };
  status?: {
    privacyStatus?: string;
  };
}

export interface YouTubeSearchItem {
  id: {
    videoId?: string;
    kind?: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
  };
}

export async function storeYouTubeToken(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  try {
    const expiryTime = Date.now() + expiresIn * 1000;
    await AsyncStorage.multiSet([
      [YOUTUBE_TOKEN_KEY, accessToken],
      [YOUTUBE_REFRESH_TOKEN_KEY, refreshToken],
      [YOUTUBE_TOKEN_EXPIRY_KEY, expiryTime.toString()],
    ]);
  } catch (error) {
    console.error('Error storing YouTube token:', error);
    throw error;
  }
}

export async function clearYouTubeTokens(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      YOUTUBE_TOKEN_KEY,
      YOUTUBE_REFRESH_TOKEN_KEY,
      YOUTUBE_TOKEN_EXPIRY_KEY,
    ]);
  } catch (error) {
    console.error('Error clearing YouTube tokens:', error);
  }
}

export async function getYouTubeToken(): Promise<string | null> {
  try {
    const [token, expiry] = await AsyncStorage.multiGet([
      YOUTUBE_TOKEN_KEY,
      YOUTUBE_TOKEN_EXPIRY_KEY,
    ]);

    const accessToken = token[1];
    const expiryTime = expiry[1] ? parseInt(expiry[1], 10) : 0;

    if (!accessToken || Date.now() >= expiryTime) {
      const refreshToken = await AsyncStorage.getItem(YOUTUBE_REFRESH_TOKEN_KEY);
      if (refreshToken) {
        try {
          const newToken = await refreshYouTubeToken(refreshToken);
          return newToken;
        } catch (error) {
          console.error('Error refreshing YouTube token:', error);
          await clearYouTubeTokens();
          return null;
        }
      }
      return null;
    }

    return accessToken;
  } catch (error) {
    console.error('Error getting YouTube token:', error);
    return null;
  }
}

export async function isYouTubeAuthenticated(): Promise<boolean> {
  const token = await getYouTubeToken();
  return token !== null;
}

async function refreshYouTubeToken(refreshToken: string): Promise<string> {
  try {
    let apiUrl = '/api/youtube/refresh';

    if (Platform.OS !== 'web') {
      const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL;
      if (apiBaseUrl) {
        apiUrl = `${apiBaseUrl}/api/youtube/refresh`;
      } else {
        apiUrl = 'http://localhost:8081/api/youtube/refresh';
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
      throw new Error('Failed to refresh YouTube token');
    }

    const data = await response.json();
    await storeYouTubeToken(data.access_token, data.refresh_token || refreshToken, data.expires_in);
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing YouTube token via API:', error);

    const clientId = process.env.EXPO_PUBLIC_YOUTUBE_CLIENT_ID || '';
    const clientSecret = process.env.EXPO_PUBLIC_YOUTUBE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        'Cannot refresh YouTube token: API route failed and client credentials not available.'
      );
    }

    const credentials = base64.encode(`${clientId}:${clientSecret}`);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to refresh YouTube token: ${errorText}`);
    }

    const data = await response.json();
    await storeYouTubeToken(data.access_token, refreshToken, data.expires_in);
    return data.access_token;
  }
}

async function youtubeFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = await getYouTubeToken();
  if (!token) {
    throw new Error('Not authenticated with YouTube Music');
  }

  let passthroughHeaders: Record<string, string> = {};
  if (options.headers instanceof Headers) {
    passthroughHeaders = Object.fromEntries(options.headers.entries());
  } else if (Array.isArray(options.headers)) {
    passthroughHeaders = Object.fromEntries(options.headers);
  } else if (options.headers) {
    passthroughHeaders = options.headers as Record<string, string>;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...passthroughHeaders,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      await clearYouTubeTokens();
      throw new Error('YouTube authentication expired');
    }

    const errorText = await response.text();
    let errorMessage = errorText || 'YouTube API request failed';
    
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.message) {
        errorMessage = errorJson.error.message;
      }
    } catch {
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function searchYouTubeTrack(
  query: string,
  maxResults: number = 1
): Promise<YouTubeSearchItem[]> {
  const searchParams = new URLSearchParams({
    part: 'snippet',
    maxResults: Math.min(maxResults, 5).toString(),
    type: 'video',
    q: query,
    videoCategoryId: '10',
  });

  const data = await youtubeFetch<{ items: YouTubeSearchItem[] }>(
    `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`
  );

  return data.items || [];
}

/**
 * Get the authenticated user's YouTube channel ID
 * Returns null if the user doesn't have a YouTube channel
 */
export async function getUserYouTubeChannelId(): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      part: 'id',
      mine: 'true',
    });

    const data = await youtubeFetch<{
      items: Array<{ id: string }>;
    }>(`https://www.googleapis.com/youtube/v3/channels?${params.toString()}`);

    return data.items?.[0]?.id || null;
  } catch (error: any) {
    if (error.message?.includes('channelNotFound') || error.message?.includes('Channel not found')) {
      return null;
    }
    throw error;
  }
}

export async function getUserYouTubePlaylists(limit: number = 50): Promise<YouTubePlaylist[]> {
  // check if user has a channel
  const channelId = await getUserYouTubeChannelId();
  if (!channelId) {
    return [];
  }

  const playlists: YouTubePlaylist[] = [];
  let nextPageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      part: 'snippet,status',
      mine: 'true',
      maxResults: '50',
    });

    if (nextPageToken) {
      params.append('pageToken', nextPageToken);
    }

    const data = await youtubeFetch<{
      items: YouTubePlaylist[];
      nextPageToken?: string;
    }>(`https://www.googleapis.com/youtube/v3/playlists?${params.toString()}`);

    playlists.push(...(data.items || []));
    nextPageToken = data.nextPageToken;
  } while (nextPageToken && playlists.length < limit);

  return playlists.slice(0, limit);
}

export async function createYouTubePlaylist(
  name: string,
  description?: string
): Promise<YouTubePlaylist> {
  const body = {
    snippet: {
      title: name,
      description: description || 'Playlist created from Vynl',
    },
    status: {
      privacyStatus: 'private',
    },
  };

  const playlist = await youtubeFetch<YouTubePlaylist>(
    'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status,id',
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );

  if (!playlist || !playlist.id) {
    throw new Error('Failed to create YouTube playlist: missing playlist ID in response');
  }

  return playlist;
}

export async function findOrCreateYouTubePlaylist(
  name: string,
  description?: string
): Promise<YouTubePlaylist> {
  const channelId = await getUserYouTubeChannelId();
  if (!channelId) {
    throw new Error(
      'You need to create a YouTube channel before you can create playlists. ' +
      'Please visit https://www.youtube.com/create_channel to create your channel, then try again.'
    );
  }

  try {
    const playlists = await getUserYouTubePlaylists(50);
    const existing = playlists.find(
      (playlist) => playlist.snippet?.title?.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      if (!existing.id) {
        console.warn('Found existing playlist but it has no ID, will create new one');
      } else {
        console.log(`Found existing playlist: ${existing.id}`);
        return existing;
      }
    }

    console.log('Creating new YouTube playlist:', name);
    const newPlaylist = await createYouTubePlaylist(name, description);
    console.log('Created playlist with ID:', newPlaylist.id);
    return newPlaylist;
  } catch (error: any) {
    if (error.message?.includes('channelNotFound') || error.message?.includes('Channel not found')) {
      throw new Error(
        'You need to create a YouTube channel before you can create playlists. ' +
        'Please visit https://www.youtube.com/create_channel to create your channel, then try again.'
      );
    }
    
    console.error('Error finding YouTube playlist:', error);
    
    try {
      console.log('Retrying playlist creation after error...');
      const newPlaylist = await createYouTubePlaylist(name, description);
      console.log('Successfully created playlist with ID:', newPlaylist.id);
      return newPlaylist;
    } catch (createError: any) {
      if (createError.message?.includes('channelNotFound') || createError.message?.includes('Channel not found')) {
        throw new Error(
          'You need to create a YouTube channel before you can create playlists. ' +
          'Please visit https://www.youtube.com/create_channel to create your channel, then try again.'
        );
      }
      throw createError;
    }
  }
}

async function getYouTubePlaylistItems(
  playlistId: string
): Promise<Array<{ id: string; videoId?: string }>> {
  if (!playlistId) {
    throw new Error('Playlist ID is required to get items');
  }

  const items: Array<{ id: string; videoId?: string }> = [];
  let nextPageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      part: 'snippet',
      playlistId,
      maxResults: '50',
    });

    if (nextPageToken) {
      params.append('pageToken', nextPageToken);
    }

    const data = await youtubeFetch<{
      items: Array<{
        id: string;
        snippet: {
          resourceId?: { videoId?: string };
        };
      }>;
      nextPageToken?: string;
    }>(`https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`);

    items.push(
      ...(data.items || []).map((item) => ({
        id: item.id,
        videoId: item.snippet?.resourceId?.videoId,
      }))
    );

    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  return items;
}

async function clearYouTubePlaylistItems(playlistId: string): Promise<void> {
  if (!playlistId) {
    throw new Error('Playlist ID is required to clear items');
  }

  try {
    const items = await getYouTubePlaylistItems(playlistId);

    if (items.length === 0) {
      return;
    }

    for (const item of items) {
      if (!item.id) continue;

      await youtubeFetch<{ status: string }>(
        `https://www.googleapis.com/youtube/v3/playlistItems?id=${item.id}`,
        {
          method: 'DELETE',
        }
      );
    }
  } catch (error: any) {
    if (error.message?.includes('cannot be found') || error.message?.includes('not found')) {
      console.warn(`Playlist ${playlistId} not found when clearing items, will create fresh`);
      return;
    }
    throw error;
  }
}

async function addVideosToYouTubePlaylist(playlistId: string, videoIds: string[]): Promise<void> {
  if (!playlistId) {
    throw new Error('Playlist ID is required to add videos');
  }

  if (videoIds.length === 0) {
    return;
  }

  for (const videoId of videoIds) {
    if (!videoId) {
      console.warn('Skipping empty video ID');
      continue;
    }

    try {
      await youtubeFetch(
        'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet',
        {
          method: 'POST',
          body: JSON.stringify({
            snippet: {
              playlistId,
              resourceId: {
                kind: 'youtube#video',
                videoId,
              },
            },
          }),
        }
      );
    } catch (error: any) {
      if (error.message?.includes('cannot be found') || error.message?.includes('not found')) {
        throw new Error(
          `Playlist ${playlistId} not found. The playlist may have been deleted or you may not have access to it.`
        );
      }
      throw error;
    }
  }
}

export async function exportPlaylistToYouTube(
  playlistName: string,
  songs: Array<{ title: string; artist: string }>,
  onProgress?: (progress: { current: number; total: number; status: string }) => void
): Promise<{ playlistId: string; playlistUrl: string; tracksFound: number; tracksTotal: number }> {
  try {
    if (songs.length === 0) {
      throw new Error('No songs to export');
    }

    onProgress?.({ current: 0, total: songs.length, status: 'Searching YouTube Music...' });

    const videoIds: string[] = [];
    let tracksFound = 0;

    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      onProgress?.({
        current: i + 1,
        total: songs.length,
        status: `Searching "${song.title}" by ${song.artist}...`,
      });

      try {
        const enrichedQuery = `${song.title} ${song.artist} audio`;
        let results = await searchYouTubeTrack(enrichedQuery, 1);

        if ((!results || results.length === 0) && song.artist) {
          results = await searchYouTubeTrack(`${song.title} ${song.artist}`, 1);
        }

        if ((!results || results.length === 0) && song.title) {
          results = await searchYouTubeTrack(song.title, 1);
        }

        if (results.length > 0 && results[0].id?.videoId) {
          videoIds.push(results[0].id.videoId);
          tracksFound++;
        } else {
          console.warn(`No YouTube result for "${song.title}" by ${song.artist}`);
        }
      } catch (error) {
        console.error(`Error searching YouTube for "${song.title}"`, error);
      }
    }

    if (videoIds.length === 0) {
      throw new Error('No matching tracks found on YouTube Music');
    }

    onProgress?.({
      current: songs.length,
      total: songs.length,
      status: 'Preparing playlist...',
    });

    const playlist = await findOrCreateYouTubePlaylist(playlistName);

    if (!playlist || !playlist.id) {
      throw new Error('Failed to create or find YouTube playlist: missing playlist ID');
    }

    onProgress?.({
      current: songs.length,
      total: songs.length,
      status: 'Updating playlist items...',
    });

    try {
      await clearYouTubePlaylistItems(playlist.id);
    } catch (error: any) {
      console.warn('Could not clear playlist items, will add to existing items:', error.message);
    }

    await addVideosToYouTubePlaylist(playlist.id, videoIds);

    const playlistUrl = `https://music.youtube.com/playlist?list=${playlist.id}`;

    return {
      playlistId: playlist.id,
      playlistUrl,
      tracksFound,
      tracksTotal: songs.length,
    };
  } catch (error) {
    console.error('Error exporting playlist to YouTube Music:', error);
    throw error;
  }
}


