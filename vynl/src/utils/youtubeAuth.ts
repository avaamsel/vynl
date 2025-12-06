import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { storeYouTubeToken } from './youtube';

WebBrowser.maybeCompleteAuthSession();

const YOUTUBE_CLIENT_ID = process.env.EXPO_PUBLIC_YOUTUBE_CLIENT_ID || '';

const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl',
];

/**
 * Get redirect URI for YouTube OAuth
 */
const getRedirectUri = (): string => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/youtube/callback`;
    }
    return 'http://localhost:8081/api/youtube/callback';
  }

  if (YOUTUBE_CLIENT_ID) {
    try {
      const clientIdMatch = YOUTUBE_CLIENT_ID.match(/^([^.]+)/);
      if (clientIdMatch && clientIdMatch[1]) {
        const clientIdPrefix = clientIdMatch[1];
        const reverseClientId = `com.googleusercontent.apps.${clientIdPrefix}:/oauth2redirect`;
        console.log('[YouTube Auth] Using reverse client ID format (custom URI):', reverseClientId);
        return reverseClientId;
      }
    } catch (error) {
      console.error('[YouTube Auth] Error parsing client ID for reverse format:', error);
    }
  }

  throw new Error(
    'Cannot determine redirect URI for YouTube OAuth. ' +
    'Please set EXPO_PUBLIC_YOUTUBE_CLIENT_ID with a valid iOS or Android OAuth client ID.'
  );
};

export async function initiateYouTubeAuth(): Promise<string | void> {
  if (!YOUTUBE_CLIENT_ID) {
    throw new Error(
      'YouTube OAuth Client ID missing. Set EXPO_PUBLIC_YOUTUBE_CLIENT_ID in your environment.'
    );
  }

  const redirectUri = getRedirectUri();
  console.log('[YouTube Auth] Starting OAuth flow');
  console.log('[YouTube Auth] Initial redirect URI:', redirectUri);
  console.log('[YouTube Auth] Platform:', Platform.OS);

  // Build the authorization URL
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: YOUTUBE_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    access_type: 'offline',
    prompt: 'consent',
    scope: YOUTUBE_SCOPES.join(' '),
  }).toString()}`;

  console.log('[YouTube Auth] Authorization URL:', authUrl);
  console.log('[YouTube Auth] Redirect URI:', redirectUri);
  console.log('[YouTube Auth] Make sure this redirect URI is registered in Google Cloud Console!');

  if (Platform.OS === 'web') {
    return authUrl;
  }

  try {
    const request = new AuthSession.AuthRequest({
      clientId: YOUTUBE_CLIENT_ID,
      scopes: YOUTUBE_SCOPES,
      responseType: AuthSession.ResponseType.Code,
      redirectUri,
      usePKCE: true,
      extraParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    });

    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
    };

    console.log('[YouTube Auth] Using PKCE flow (no client secret needed)');
    console.log('[YouTube Auth] Redirect URI:', redirectUri);

    const result = await request.promptAsync(discovery, { showInRecents: true });

    if (result.type === 'success') {
      const code = result.params.code;
      if (!code) {
        throw new Error('No authorization code received from YouTube');
      }
      
      await exchangeCodeForTokenWithPKCE(code, redirectUri, request);
      return;
    }

    if (result.type === 'error') {
      throw new Error(result.error?.message || 'Failed to authenticate with YouTube Music');
    }

    throw new Error('YouTube authentication cancelled');
  } catch (error: any) {
    console.error('[YouTube Auth] Browser auth error:', error);
    
    if (error.message?.includes('redirect_uri') || error.message?.includes('redirect URI') || error.message?.includes('invalid_request')) {
      console.error('[YouTube Auth] Redirect URI error detected!');
      console.error('[YouTube Auth] The redirect URI being used is:', redirectUri);
      console.error('[YouTube Auth] Please ensure this exact URI is added in your Google Cloud Console:');
      console.error('[YouTube Auth] 1. Go to https://console.cloud.google.com/apis/credentials');
      console.error('[YouTube Auth] 2. Select your OAuth 2.0 Client ID');
      console.error('[YouTube Auth] 3. Add the following to "Authorized redirect URIs":');
      console.error(`[YouTube Auth]    ${redirectUri}`);
      console.error('[YouTube Auth] 4. Save changes');
      throw new Error(`Redirect URI not registered: ${redirectUri}. Please add it to Google Cloud Console.`);
    }
    
    throw error;
  }
}

/**
 * Exchange code for token using PKCE 
 */
async function exchangeCodeForTokenWithPKCE(
  code: string,
  redirectUri: string,
  request: AuthSession.AuthRequest
): Promise<void> {
  if (!request.codeVerifier) {
    throw new Error('PKCE code verifier not found. PKCE must be enabled.');
  }

  try {
    console.log('[YouTube Auth] Exchanging code for token using PKCE...');
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: YOUTUBE_CLIENT_ID,
        code_verifier: request.codeVerifier,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[YouTube Auth] PKCE token exchange failed:', errorText);
      throw new Error(`Failed to exchange code for YouTube token: ${errorText}`);
    }

    const data = await response.json();
    await storeYouTubeToken(data.access_token, data.refresh_token, data.expires_in);
    console.log('[YouTube Auth] Token exchange successful with PKCE');
  } catch (error: any) {
    console.error('[YouTube Auth] PKCE token exchange error:', error);
    throw error;
  }
}

function getApiBaseUrl(): string | null {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const debuggerHost = Constants.expoConfig?.hostUri || Constants.expoConfig?.extra?.hostUri;
    if (debuggerHost) {
      const host = debuggerHost.split(':')[0];
      const port = debuggerHost.split(':')[1] || '8081';
      return `http://${host}:${port}`;
    }

    if (Constants.manifest?.debuggerHost) {
      const host = Constants.manifest.debuggerHost.split(':')[0];
      return `http://${host}:8081`;
    }
  } catch (error) {
    console.error('Error getting API URL from Expo constants:', error);
  }

  return null;
}

/**
 * Exchange code for token
 */
async function exchangeCodeForToken(code: string, redirectUri: string): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();
  let apiUrl = '/api/youtube/token';

  if (apiBaseUrl) {
    apiUrl = `${apiBaseUrl}/api/youtube/token`;
  }

  try {
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
      await storeYouTubeToken(data.access_token, data.refresh_token, data.expires_in);
      return;
    }

    const errorText = await response.text();
    console.error('[YouTube Auth] API route error:', response.status, errorText);
    throw new Error(`Token exchange failed: ${errorText || `HTTP ${response.status}`}`);
  } catch (error: any) {
    if (error.message && !error.message.includes('Token exchange failed')) {
      console.error('[YouTube Auth] Failed to reach API route:', error.message);
      console.error('[YouTube Auth] API URL attempted:', apiUrl);
    } else {
      throw error;
    }
  }

  if (__DEV__) {
    const clientSecret = process.env.EXPO_PUBLIC_YOUTUBE_CLIENT_SECRET;
    if (!clientSecret) {
      throw new Error(
        'Token exchange failed. The server-side API route (/api/youtube/token) is not accessible or is failing. ' +
        'For iOS/Android OAuth clients (which don\'t have client secrets), you must use the server-side API route. ' +
        'Please check:\n' +
        '1. Your dev server is running and the API route is accessible\n' +
        '2. YOUTUBE_CLIENT_SECRET is set in your .env file (from a Web application OAuth client)\n' +
        '3. The API route at /api/youtube/token is working correctly'
      );
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: clientSecret,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to exchange code for YouTube token: ${errorText}`);
    }

    const data = await response.json();
    await storeYouTubeToken(data.access_token, data.refresh_token, data.expires_in);
    return;
  }

  throw new Error('Unable to exchange YouTube authorization code for token');
}

export async function handleYouTubeCallback(url: string): Promise<void> {
  let targetUrl: URL;
  let code: string | null = null;
  let error: string | null = null;
  
  try {
    targetUrl = new URL(url);
    error = targetUrl.searchParams.get('error');
    code = targetUrl.searchParams.get('code');
  } catch (e) {
    const codeMatch = url.match(/[?&]code=([^&]+)/);
    const errorMatch = url.match(/[?&]error=([^&]+)/);
    
    if (errorMatch) {
      error = decodeURIComponent(errorMatch[1]);
    }
    
    if (codeMatch) {
      code = decodeURIComponent(codeMatch[1]);
    }
  }
  
  if (error) {
    throw new Error(`YouTube authentication error: ${error}`);
  }

  if (!code) {
    throw new Error('No authorization code returned from YouTube');
  }

  // Get redirect URI
  const redirectUri = getRedirectUri();
  await exchangeCodeForToken(code, redirectUri);
}

export async function handleYouTubeCallbackFromQuery(): Promise<boolean> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return false;
  }

  const url = new URL(window.location.href);
  const error = url.searchParams.get('youtube_error');
  const code = url.searchParams.get('youtube_code');

  if (error) {
    console.error('YouTube OAuth error:', error);
    window.history.replaceState({}, document.title, window.location.pathname);
    return false;
  }

  if (!code) {
    return false;
  }

  const redirectUri = url.searchParams.get('redirect_uri') || getRedirectUri();
  await exchangeCodeForToken(code, redirectUri);

  window.history.replaceState({}, document.title, window.location.pathname);
  return true;
}


