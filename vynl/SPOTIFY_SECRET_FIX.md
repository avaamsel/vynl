# Fixing "Invalid client secret" Error

## Error Message
```
Client-side token exchange error: 400 {"error":"invalid_client","error_description":"Invalid client secret"}
```

## Possible Causes

### 1. Incorrect Client Secret
The client secret in your `.env` file might not match the one in your Spotify Developer Dashboard.

### 2. Client Secret Was Reset
If you reset your client secret in the Spotify dashboard, you need to update it in your `.env` file.

### 3. Wrong Client ID/Secret Pair
Make sure the Client ID and Client Secret belong to the same Spotify app.

## How to Fix

### Step 1: Verify Your Spotify Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click on your app
3. Check your **Client ID** - it should match `EXPO_PUBLIC_SPOTIFY_CLIENT_ID` in your `.env`
4. Click **"Show Client Secret"** or **"View Client Secret"**
5. Copy the client secret (it will only be shown once if it's new)

### Step 2: Update Your .env File

1. Open your `.env` file in the `vynl/` directory
2. Update `EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET` with the correct value:
   ```env
   EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id_here
   EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET=your_client_secret_here
   ```
3. Make sure there are no extra spaces or quotes around the values
4. Make sure there are no line breaks in the middle of the values

### Step 3: Restart Your Dev Server

After updating the `.env` file, you **must** restart your Expo dev server:

```bash
# Stop the server (Ctrl+C)
npx expo start -c  # -c clears cache
```

### Step 4: Verify the Fix

1. Try authenticating with Spotify again
2. Check the console for debug messages:
   - "Debug: Client ID (first 10 chars): ..."
   - "Debug: Client Secret (first 10 chars): ..."
3. If you still get the error, verify the credentials match exactly what's in the Spotify dashboard

## Common Mistakes

1. **Extra Spaces**: Make sure there are no spaces before or after the `=` sign
   ```env
   # ❌ Wrong
   EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET = value
   
   # ✅ Correct
   EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET=value
   ```

2. **Quotes**: Don't add quotes around the values (unless the value itself contains spaces)
   ```env
   # ❌ Wrong
   EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET="value"
   
   # ✅ Correct
   EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET=value
   ```

3. **Line Breaks**: Make sure each value is on a single line
   ```env
   # ❌ Wrong
   EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET=value
   that_continues_on_next_line
   
   # ✅ Correct
   EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET=complete_value_on_one_line
   ```

4. **Wrong File**: Make sure you're editing the `.env` file in the `vynl/` directory, not the root directory

## If It Still Doesn't Work

1. **Double-check in Spotify Dashboard**:
   - Go to your app settings
   - Click "View Client Secret" (you might need to reset it if you can't view it)
   - Copy it exactly as shown

2. **Check for Hidden Characters**:
   - Sometimes copying from certain sources can add hidden characters
   - Try typing the secret manually instead of copying

3. **Verify Client ID Matches**:
   - Make sure the Client ID in your `.env` matches the one in the Spotify dashboard
   - They must belong to the same app

4. **Check Redirect URIs**:
   - Make sure your redirect URIs are correctly configured in the Spotify dashboard
   - They must match exactly what's being used in the app

## Security Note

⚠️ **Remember**: The `EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET` is exposed in your app bundle. This is only for development. For production, you must use a backend server to keep the secret secure.

