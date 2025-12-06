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
  const clientId = process.env.EXPO_PUBLIC_YOUTUBE_CLIENT_ID || '';
  const clientSecret = process.env.EXPO_PUBLIC_YOUTUBE_CLIENT_SECRET;

  if (!clientId) {
    throw new Error('YouTube OAuth Client ID is required to refresh token');
  }

  if (Platform.OS !== 'web') {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
        }).toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to refresh YouTube token: ${errorText}`);
      }

      const data = await response.json();
      await storeYouTubeToken(data.access_token, data.refresh_token || refreshToken, data.expires_in);
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing YouTube token (mobile):', error);
      throw error;
    }
  }

  try {
    let apiUrl = '/api/youtube/refresh';
    const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL;
    if (apiBaseUrl && !apiBaseUrl.includes('localhost')) {
      apiUrl = `${apiBaseUrl}/api/youtube/refresh`;
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

    if (response.ok) {
      const data = await response.json();
      await storeYouTubeToken(data.access_token, data.refresh_token || refreshToken, data.expires_in);
      return data.access_token;
    }
  } catch (error) {
    console.warn('API route refresh failed, trying direct refresh:', error);
  }

  try {
    const bodyParams = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    });

    if (clientSecret) {
      bodyParams.append('client_secret', clientSecret);
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to refresh YouTube token: ${errorText}`);
    }

    const data = await response.json();
    await storeYouTubeToken(data.access_token, data.refresh_token || refreshToken, data.expires_in);
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing YouTube token (direct):', error);
    throw error;
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

  if (options.method === 'DELETE' || response.status === 204) {
    return {} as T;
  }

  // Check if response has content before parsing JSON
  const contentType = response.headers.get('content-type');
  const text = await response.text();
  
  if (!text || !contentType?.includes('application/json')) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    if (response.ok) {
      return {} as T;
    }
    throw error;
  }
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

export async function findExistingYouTubePlaylist(
  name: string
): Promise<YouTubePlaylist | null> {
  try {
    const channelId = await getUserYouTubeChannelId();
    if (!channelId) {
      return null;
    }

    const playlists = await getUserYouTubePlaylists(50);
    const existing = playlists.find(
      (playlist) => playlist.snippet?.title?.toLowerCase() === name.toLowerCase()
    );

    if (existing && existing.id) {
      return existing;
    }

    return null;
  } catch (error) {
    console.error('Error finding existing YouTube playlist:', error);
    return null;
  }
}

export async function createUniqueYouTubePlaylist(
  baseName: string,
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
    const existingNames = new Set(
      playlists.map((p) => p.snippet?.title?.toLowerCase() || '').filter(Boolean)
    );

    let uniqueName = baseName;
    let counter = 1;

    // Find a unique name by appending (1), (2), etc.
    while (existingNames.has(uniqueName.toLowerCase())) {
      uniqueName = `${baseName} (${counter})`;
      counter++;
    }

    console.log(`Creating new YouTube playlist with unique name: "${uniqueName}"`);
    const newPlaylist = await createYouTubePlaylist(uniqueName, description);
    console.log('Created playlist with ID:', newPlaylist.id);
    return newPlaylist;
  } catch (error: any) {
    if (error.message?.includes('channelNotFound') || error.message?.includes('Channel not found')) {
      throw new Error(
        'You need to create a YouTube channel before you can create playlists. ' +
        'Please visit https://www.youtube.com/create_channel to create your channel, then try again.'
      );
    }
    throw error;
  }
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

  try {
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
  } catch (error: any) {
    const errorMessage = (error.message || '').toLowerCase();
    const errorString = JSON.stringify(error).toLowerCase();
    
    if (
      errorMessage.includes('cannot be found') ||
      errorMessage.includes('not found') ||
      errorMessage.includes('playlist identified') ||
      errorMessage.includes('playlistid') ||
      errorMessage.includes('playlist') && errorMessage.includes('found') ||
      errorString.includes('cannot be found') ||
      errorString.includes('playlist identified')
    ) {
      console.warn(`Playlist ${playlistId} not found when getting items (treating as empty)`);
      return [];
    }
    console.warn(`Error getting playlist items for ${playlistId}, treating as empty: ${error.message}`);
    return [];
  }

  return items;
}

async function clearYouTubePlaylistItems(playlistId: string): Promise<void> {
  if (!playlistId) {
    throw new Error('Playlist ID is required to clear items');
  }

  try {
    console.log(`Fetching items from playlist ${playlistId}...`);
    const items = await getYouTubePlaylistItems(playlistId);
    console.log(`Found ${items.length} items to clear from playlist ${playlistId}`);

    if (items.length === 0) {
      console.log(`Playlist ${playlistId} is already empty`);
      return;
    }

    let deletedCount = 0;
    let notFoundCount = 0;
    for (const item of items) {
      if (!item.id) {
        console.warn('Skipping item without ID');
        continue;
      }

      try {
        await youtubeFetch<{ status: string }>(
          `https://www.googleapis.com/youtube/v3/playlistItems?id=${item.id}`,
          {
            method: 'DELETE',
          }
        );
        deletedCount++;
      } catch (deleteError: any) {
        if (
          deleteError.message?.includes('not found') ||
          deleteError.message?.includes('cannot be found') ||
          deleteError.message?.includes('Playlist item not found')
        ) {
          notFoundCount++;
          console.log(`Playlist item ${item.id} already deleted or not found (treating as success)`);
        } else {
          console.error(`Failed to delete playlist item ${item.id}:`, deleteError);
        }
      }
    }

    const successCount = deletedCount + notFoundCount;
    console.log(`Successfully processed ${successCount} of ${items.length} items from playlist ${playlistId} (${deletedCount} deleted, ${notFoundCount} already gone)`);
  } catch (error: any) {
    const errorMessage = (error.message || '').toLowerCase();
    const errorString = JSON.stringify(error).toLowerCase();
    
    if (
      errorMessage.includes('cannot be found') ||
      errorMessage.includes('not found') ||
      errorMessage.includes('playlist identified') ||
      errorMessage.includes('playlistid') ||
      errorMessage.includes('playlist') && errorMessage.includes('found') ||
      errorString.includes('cannot be found') ||
      errorString.includes('playlist identified')
    ) {
      console.warn(`Playlist ${playlistId} not found when clearing items (treating as empty/cleared)`);
      return;
    }
    console.error(`Error clearing playlist items for ${playlistId}:`, error);
    console.warn(`Warning: Error clearing playlist, but proceeding anyway: ${error.message}`);
  }
}

async function addVideosToYouTubePlaylist(playlistId: string, videoIds: string[]): Promise<void> {
  if (!playlistId) {
    throw new Error('Playlist ID is required to add videos');
  }

  if (videoIds.length === 0) {
    console.warn('No video IDs to add to playlist');
    return;
  }

  let addedCount = 0;
  let failedCount = 0;

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
      addedCount++;
    } catch (error: any) {
      failedCount++;
      const errorMessage = (error.message || '').toLowerCase();
      
      if (errorMessage.includes('cannot be found') || errorMessage.includes('not found')) {
        console.error(`Playlist ${playlistId} not found when adding video ${videoId}`);
        throw new Error(
          `Playlist ${playlistId} not found. The playlist may have been deleted or you may not have access to it.`
        );
      }
      
      console.error(`Failed to add video ${videoId} to playlist ${playlistId}:`, error.message);
    }
  }

  console.log(`Added ${addedCount} of ${videoIds.length} videos to playlist ${playlistId}`);
  
  if (addedCount === 0 && videoIds.length > 0) {
    throw new Error(`Failed to add any videos to playlist ${playlistId}`);
  }
  
  if (failedCount > 0) {
    console.warn(`Warning: ${failedCount} videos failed to add to playlist ${playlistId}`);
  }
}

export async function exportPlaylistToYouTube(
  playlistName: string,
  songs: Array<{ title: string; artist: string }>,
  onProgress?: (progress: { current: number; total: number; status: string }) => void,
  options?: {
    useExistingPlaylist?: boolean;
    existingPlaylistId?: string;
    appendToExisting?: boolean;
  }
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

    let playlist: YouTubePlaylist;
    let isNewPlaylist = false;

    if (options?.useExistingPlaylist && options?.existingPlaylistId) {
      playlist = { id: options.existingPlaylistId, snippet: { title: playlistName } };
      console.log(`Using existing playlist with ID: ${playlist.id}`);
    } else if (options?.useExistingPlaylist) {
      const existing = await findExistingYouTubePlaylist(playlistName);
      if (!existing) {
        throw new Error(`Playlist "${playlistName}" not found`);
      }
      playlist = existing;
      console.log(`Found existing playlist with ID: ${playlist.id}`);
    } else {
      playlist = await createUniqueYouTubePlaylist(playlistName);
      isNewPlaylist = true;
      console.log(`Created new playlist with ID: ${playlist.id}, isNewPlaylist: ${isNewPlaylist}`);
    }

    if (!playlist || !playlist.id) {
      throw new Error('Failed to create or find YouTube playlist: missing playlist ID');
    }

    if (isNewPlaylist) {
      console.log(`Skipping clear step for new playlist ${playlist.id}`);
    } else if (!options?.appendToExisting) {
      if (isNewPlaylist) {
        console.warn(`WARNING: Attempted to clear new playlist ${playlist.id}, skipping clear step`);
      } else {
        onProgress?.({
          current: songs.length,
          total: songs.length,
          status: 'Clearing existing playlist items...',
        });

        try {
          console.log(`Clearing existing playlist ${playlist.id} before replacing...`);
          await clearYouTubePlaylistItems(playlist.id);
        
          const remainingItems = await getYouTubePlaylistItems(playlist.id);
          if (remainingItems.length > 0) {
            console.warn(`Playlist ${playlist.id} still has ${remainingItems.length} items after clearing. Retrying...`);
            await clearYouTubePlaylistItems(playlist.id);
            const verifyItems = await getYouTubePlaylistItems(playlist.id);
            if (verifyItems.length > 0) {
              console.warn(`Warning: ${verifyItems.length} items still remain in playlist after clearing. New items will be added anyway.`);
            } else {
              console.log(`Successfully cleared playlist ${playlist.id} on retry`);
            }
          } else {
            console.log(`Successfully cleared playlist ${playlist.id}`);
          }
        } catch (error: any) {
          const errorMessage = (error.message || '').toLowerCase();
          const errorString = JSON.stringify(error).toLowerCase();
          
          if (
            errorMessage.includes('cannot be found') ||
            errorMessage.includes('not found') ||
            errorMessage.includes('playlist identified') ||
            errorMessage.includes('playlistid') ||
            errorMessage.includes('playlist') && errorMessage.includes('found') ||
            errorString.includes('cannot be found') ||
            errorString.includes('playlist identified')
          ) {
            console.warn(`Playlist ${playlist.id} not found when clearing (treating as empty, proceeding with export)`);
          } else {
            console.error('Error clearing playlist items:', error);
            console.warn(`Warning: Could not clear playlist items: ${error.message}. Proceeding to add new items anyway.`);
          }
        }
      }
    }

    if (isNewPlaylist) {
      console.log(`Waiting for newly created playlist ${playlist.id} to be available...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    }

    onProgress?.({
      current: songs.length,
      total: songs.length,
      status: options?.appendToExisting ? 'Adding to playlist...' : 'Adding new playlist items...',
    });

    let retries = isNewPlaylist ? 3 : 1;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await addVideosToYouTubePlaylist(playlist.id, videoIds);
        lastError = null;
        break; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        const errorMessage = (error.message || '').toLowerCase();
        
        if (
          (errorMessage.includes('cannot be found') || errorMessage.includes('not found')) &&
          attempt < retries
        ) {
          const waitTime = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
          console.warn(`Playlist ${playlist.id} not found on attempt ${attempt}, waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        throw error;
      }
    }
    
    if (lastError) {
      throw lastError;
    }

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


