import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { storeSpotifyToken } from './spotify';

// Complete the auth session
WebBrowser.maybeCompleteAuthSession();

const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || '';

// Spotify OAuth scopes
const SPOTIFY_SCOPES = [
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-private',
  'user-read-email',
].join(' ');

// Redirect URI - needs to match what's configured in Spotify app settings
const getRedirectUri = () => {
  if (Platform.OS === 'web') {
    // For web, use the current origin
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/spotify/callback`;
    }
    return 'http://localhost:8081/api/spotify/callback';
  }
  // For mobile, use Expo's proxy
  return AuthSession.makeRedirectUri();
};

/**
 * Initialize Spotify OAuth flow
 */
export async function initiateSpotifyAuth(): Promise<string | void> {
  if (!SPOTIFY_CLIENT_ID) {
    throw new Error('Spotify Client ID is not configured. Please set EXPO_PUBLIC_SPOTIFY_CLIENT_ID in your environment variables.');
  }

  const redirectUri = getRedirectUri();

  if (Platform.OS === 'web') {
    // Web OAuth flow - redirect to Spotify
    const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: SPOTIFY_SCOPES,
      show_dialog: 'true',
    })}`;
    
    return authUrl;
  } else {
    // Mobile OAuth flow using Expo AuthSession
    try {
      const request = new AuthSession.AuthRequest({
        clientId: SPOTIFY_CLIENT_ID,
        scopes: SPOTIFY_SCOPES.split(' '),
        responseType: AuthSession.ResponseType.Code,
        redirectUri: redirectUri,
        usePKCE: false, // Spotify doesn't require PKCE
      });

      const discovery = {
        authorizationEndpoint: 'https://accounts.spotify.com/authorize',
        tokenEndpoint: 'https://accounts.spotify.com/api/token',
      };

      const result = await request.promptAsync(discovery, {
        showInRecents: true,
      });

      if (result.type === 'success') {
        const { code } = result.params;
        if (code) {
          // Exchange code for token using backend API
          await exchangeCodeForToken(code, redirectUri);
        } else {
          throw new Error('No authorization code received');
        }
      } else if (result.type === 'error') {
        throw new Error(result.error?.message || 'Authentication failed');
      } else {
        throw new Error('Authentication cancelled');
      }
    } catch (error: any) {
      console.error('Error in Spotify auth:', error);
      throw error;
    }
  }
}

/**
 * Exchange authorization code for access token
 * Uses backend API route for security
 */
async function exchangeCodeForToken(code: string, redirectUri: string): Promise<void> {
  try {
    // Use backend API route to exchange code for token
    // This keeps the client secret secure
    let apiUrl = '/api/spotify/token';
    
    if (Platform.OS !== 'web') {
      // For mobile with Expo Router, API routes are available via the dev server
      // In development, try to use the Expo dev server
      // You may need to configure EXPO_PUBLIC_API_URL for your setup
      const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL;
      if (apiBaseUrl) {
        apiUrl = `${apiBaseUrl}/api/spotify/token`;
      } else {
        // Fallback: Try to construct from Expo constants if available
        // Note: This may not work in all environments
        // For production, you should set EXPO_PUBLIC_API_URL
        console.warn('EXPO_PUBLIC_API_URL not set. Token exchange may fail on mobile.');
        // Try localhost as fallback (works in development with Expo)
        apiUrl = 'http://localhost:8081/api/spotify/token';
      }
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirectUri,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange error:', errorText);
      throw new Error('Failed to exchange code for token. Please make sure the backend API is running and configured with Spotify credentials. For mobile, you may need to set EXPO_PUBLIC_API_URL in your environment variables.');
    }

    const data = await response.json();
    await storeSpotifyToken(data.access_token, data.refresh_token, data.expires_in);
  } catch (error: any) {
    console.error('Error exchanging code for token:', error);
    // Provide more helpful error message
    if (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')) {
      throw new Error('Could not connect to the server. Make sure your development server is running and EXPO_PUBLIC_API_URL is configured correctly.');
    }
    throw error;
  }
}

/**
 * Handle OAuth callback (for web)
 */
export async function handleSpotifyCallback(url: string): Promise<void> {
  try {
    const parsedUrl = new URL(url);
    const code = parsedUrl.searchParams.get('code');
    const error = parsedUrl.searchParams.get('error');

    if (error) {
      throw new Error(`Spotify authentication error: ${error}`);
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

    const redirectUri = getRedirectUri();
    await exchangeCodeForToken(code, redirectUri);
  } catch (error) {
    console.error('Error handling Spotify callback:', error);
    throw error;
  }
}

