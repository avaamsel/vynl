# Spotify Authentication Fix

## Problem
The app was trying to connect to `localhost:8081/api/spotify/token` which doesn't work on mobile devices because:
- Physical devices can't access `localhost` (it refers to the device itself, not your dev machine)
- The API route needs to be accessible from the mobile device

## Solution
Implemented a two-tier approach:

### 1. Try Backend API Route (Preferred)
- First attempts to use the backend API route at `/api/spotify/token`
- Works on web and if the API URL is properly configured
- More secure (client secret stays on server)

### 2. Fallback to Client-Side (Development Only)
- If the API route is not accessible, falls back to client-side token exchange
- Only works in development mode (`__DEV__`)
- Requires `EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET` in `.env`

## Changes Made

### 1. Updated `spotifyAuth.ts`
- Added `getApiBaseUrl()` function that tries to detect the development server URL
- Updated `exchangeCodeForToken()` to try API route first, then fallback to client-side
- Added base64 encoding functions that work in React Native
- Added better error messages

### 2. Updated `.env` file
- Added `EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET` for development
- ⚠️ **WARNING**: This exposes the client secret in the app - only for development!

## How to Use

### Development
1. Make sure your `.env` file has:
   ```
   EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id
   EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET=your_client_secret
   ```

2. Restart your Expo dev server:
   ```bash
   npx expo start -c
   ```

3. Test the authentication - it should work now!

### Production
For production, you **MUST**:
1. Remove `EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET` from `.env`
2. Set up a backend server with the `/api/spotify/token` endpoint
3. Set `EXPO_PUBLIC_API_URL` to your production API URL
4. Keep `SPOTIFY_CLIENT_SECRET` (without `EXPO_PUBLIC_`) on the server only

## Testing

1. Open your app
2. Go to a playlist
3. Click "Export to Spotify"
4. Click "Connect Spotify"
5. Authorize the app
6. The token exchange should now work!

## Debugging

If you still see errors, check the console for:
- "Attempting token exchange via API route: ..." - shows which URL is being tried
- "API route failed, trying client-side exchange" - indicates fallback is being used
- "⚠️ Using client-side token exchange (DEVELOPMENT ONLY)" - confirms fallback is active
- "✅ Token exchange successful via client-side (development)" - success!

## Security Reminder

🚨 **NEVER commit `EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET` to version control!**
- Add it to `.gitignore` if it's not already there
- Use environment variables in your deployment platform
- For production, use a backend server to keep the secret secure

