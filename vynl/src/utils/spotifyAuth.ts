import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Constants from 'expo-constants';
import { Platform } from 'react-native';
import base64 from 'base-64';
import { storeSpotifyToken } from './spotify';

WebBrowser.maybeCompleteAuthSession();

const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || '';

/**
 * Simple base64 encoding for React Native
 * This is a basic implementation that works without external libraries
 */
function manualBase64Encode(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let result = '';
  let i = 0;
  
  while (i < str.length) {
    const a = str.charCodeAt(i++);
    const b = i < str.length ? str.charCodeAt(i++) : 0;
    const c = i < str.length ? str.charCodeAt(i++) : 0;
    
    const bitmap = (a << 16) | (b << 8) | c;
    
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
  }
  
  return result;
}

/**
 * Base64 encode from Uint8Array
 */
function base64Encode(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let result = '';
  let i = 0;
  
  while (i < bytes.length) {
    const a = bytes[i++];
    const b = i < bytes.length ? bytes[i++] : 0;
    const c = i < bytes.length ? bytes[i++] : 0;
    
    const bitmap = (a << 16) | (b << 8) | c;
    
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < bytes.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += i - 1 < bytes.length ? chars.charAt(bitmap & 63) : '=';
  }
  
  return result;
}

// Spotify OAuth scopes
const SPOTIFY_SCOPES = [
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-private',
  'user-read-email',
].join(' ');

// Redirect URI - needs to match what's configured in Spotify app settings
const getRedirectUri = () => {
  let redirectUri: string;
  
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      redirectUri = `${window.location.origin}/api/spotify/callback`;
    } else {
      redirectUri = 'http://localhost:8081/api/spotify/callback';
    }
  } else {
    redirectUri = AuthSession.makeRedirectUri();
  }
  
  console.log(`[Spotify Auth] Generated redirect URI: ${redirectUri}`);
  console.log(`[Spotify Auth] Platform: ${Platform.OS}`);
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    console.log(`[Spotify Auth] Window location origin: ${window.location.origin}`);
  }
  
  return redirectUri;
};

/**
 * Initialize Spotify OAuth flow
 */
export async function initiateSpotifyAuth(): Promise<string | void> {
  if (!SPOTIFY_CLIENT_ID) {
    throw new Error('Spotify Client ID is not configured. Please set EXPO_PUBLIC_SPOTIFY_CLIENT_ID in your environment variables.');
  }

  const redirectUri = getRedirectUri();
  
  console.log(`[Spotify Auth] Starting OAuth flow with redirect URI: ${redirectUri}`);
  console.log(`[Spotify Auth] Make sure this redirect URI is added to your Spotify app settings at: https://developer.spotify.com/dashboard`);

  if (Platform.OS === 'web') {
    const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: SPOTIFY_SCOPES,
      show_dialog: 'true',
    })}`;
    
    console.log(`[Spotify Auth] Generated auth URL: ${authUrl}`);
    return authUrl;
  } else {
    try {
      const request = new AuthSession.AuthRequest({
        clientId: SPOTIFY_CLIENT_ID,
        scopes: SPOTIFY_SCOPES.split(' '),
        responseType: AuthSession.ResponseType.Code,
        redirectUri: redirectUri,
        usePKCE: false,
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
        const errorMsg = result.error?.message || 'Authentication failed';
        console.error(`[Spotify Auth] OAuth error: ${errorMsg}`);
        if (errorMsg.includes('redirect_uri') || errorMsg.includes('redirect URI')) {
          console.error(`[Spotify Auth] Redirect URI mismatch!`);
          console.error(`[Spotify Auth] The redirect URI being used is: ${redirectUri}`);
          console.error(`[Spotify Auth] Please ensure this exact URI is added in your Spotify app settings:`);
          console.error(`[Spotify Auth] 1. Go to https://developer.spotify.com/dashboard`);
          console.error(`[Spotify Auth] 2. Select your app`);
          console.error(`[Spotify Auth] 3. Click "Edit Settings"`);
          console.error(`[Spotify Auth] 4. Add "${redirectUri}" to the "Redirect URIs" list`);
          console.error(`[Spotify Auth] 5. Save changes`);
        }
        throw new Error(errorMsg);
      } else {
        throw new Error('Authentication cancelled');
      }
    } catch (error: any) {
      console.error('[Spotify Auth] Error in Spotify auth:', error);
      if (error.message?.includes('redirect_uri') || error.message?.includes('redirect URI') || error.message?.includes('invalid_client')) {
        console.error(`[Spotify Auth] Redirect URI error detected!`);
        console.error(`[Spotify Auth] The redirect URI being used is: ${redirectUri}`);
        console.error(`[Spotify Auth] Please check your Spotify app settings and ensure this redirect URI is configured.`);
      }
      throw error;
    }
  }
}

/**
 * Get the development server URL for API routes
 */
function getApiBaseUrl(): string | null {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'web') {
    return null; // Will use relative URL
  }

  try {
    const debuggerHost = Constants.expoConfig?.hostUri || Constants.expoConfig?.extra?.hostUri;
    if (debuggerHost) {
      // Extract hostname and port
      const host = debuggerHost.split(':')[0];
      const port = debuggerHost.split(':')[1] || '8081';
      return `http://${host}:${port}`;
    }

    // Try using the manifest URL
    if (Constants.manifest?.debuggerHost) {
      const host = Constants.manifest.debuggerHost.split(':')[0];
      return `http://${host}:8081`;
    }

    if (__DEV__) {
      console.warn('Could not determine API URL from Expo Constants. Falling back to client-side token exchange.');
    }
  } catch (error) {
    console.error('Error getting API URL from Constants:', error);
  }

  return null;
}

/**
 * Exchange authorization code for access token
 * Tries backend API route first, falls back to client-side for development
 */
async function exchangeCodeForToken(code: string, redirectUri: string): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();
  let apiUrl = '/api/spotify/token';
  
  if (apiBaseUrl) {
    apiUrl = `${apiBaseUrl}/api/spotify/token`;
  }

  // Try backend API route first
  try {
    console.log('Attempting token exchange via API route:', apiUrl);
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

    if (response.ok) {
      const data = await response.json();
      await storeSpotifyToken(data.access_token, data.refresh_token, data.expires_in);
      console.log('Token exchange successful via API route');
      return;
    } else {
      const errorText = await response.text();
      console.error('API route returned error:', response.status, errorText);
    }
  } catch (error: any) {
    console.warn('API route failed, trying client-side exchange:', error.message);
  }

  if (__DEV__) {
    try {
      // For development, we need EXPO_PUBLIC_ prefix to access in client
      const clientSecret = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET;
      
      if (!clientSecret) {
        throw new Error(
          'EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET not found in environment variables. ' +
          'For development, add EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET to your .env file. ' +
          'NOTE: This exposes the secret in the app - ONLY use for development, never in production builds!'
        );
      }

      console.warn('Using client-side token exchange (DEVELOPMENT ONLY - not secure for production)');
      
      // Verify we have the credentials
      if (!SPOTIFY_CLIENT_ID || !clientSecret) {
        throw new Error('Missing Spotify credentials. Check EXPO_PUBLIC_SPOTIFY_CLIENT_ID and EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET');
      }
      
      // Trim any whitespace that might have been accidentally added
      const trimmedClientId = SPOTIFY_CLIENT_ID.trim();
      const trimmedClientSecret = clientSecret.trim();
      
      // Create base64 encoded credentials
      // Use base-64 library for reliable cross-platform encoding
      const credentialsString = `${trimmedClientId}:${trimmedClientSecret}`;
      const credentials = base64.encode(credentialsString);
      
      console.log('Debug: Client ID (first 10 chars):', trimmedClientId.substring(0, 10) + '...');
      console.log('Debug: Client Secret (first 10 chars):', trimmedClientSecret.substring(0, 10) + '...');
      console.log('Debug: Client ID length:', trimmedClientId.length);
      console.log('Debug: Client Secret length:', trimmedClientSecret.length);
      
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }).toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Client-side token exchange error:', response.status, errorText);
        
        if (response.status === 400 && errorText.includes('invalid_client')) {
          throw new Error(
            'Invalid client secret. Please verify:\n' +
            '1. EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET in your .env file matches the secret in Spotify Developer Dashboard\n' +
            '2. The Client ID and Client Secret belong to the same Spotify app\n' +
            '3. You have restarted your dev server after updating .env\n' +
            '4. There are no extra spaces or quotes in your .env file\n' +
            `\nCurrent Client ID: ${trimmedClientId.substring(0, 10)}... (length: ${trimmedClientId.length})\n` +
            `Current Client Secret: ${trimmedClientSecret.substring(0, 10)}... (length: ${trimmedClientSecret.length})`
          );
        }
        
        throw new Error(`Failed to exchange token (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      await storeSpotifyToken(data.access_token, data.refresh_token, data.expires_in);
      console.log('Token exchange successful via client-side (development)');
      return;
    } catch (error: any) {
      console.error('Client-side token exchange failed:', error);
      throw new Error(
        `Token exchange failed: ${error.message || 'Please check your Spotify credentials and network connection.'}`
      );
    }
  } else {
    throw new Error(
      'Could not connect to the API server for token exchange. ' +
      'In production, you must set up a backend server with the /api/spotify/token endpoint. ' +
      'Set EXPO_PUBLIC_API_URL to your production API URL.'
    );
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

