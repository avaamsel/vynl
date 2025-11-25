/**
 * API route to refresh Spotify access token
 * This should be done server-side to keep the client secret secure
 */
export async function POST(req: Request) {
  try {
    const { refresh_token } = await req.json();

    if (!refresh_token) {
      return Response.json(
        { error: 'Missing refresh_token' },
        { status: 400 }
      );
    }

    const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return Response.json(
        { error: 'Spotify credentials not configured' },
        { status: 500 }
      );
    }

    // Refresh the token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Spotify token refresh error:', error);
      return Response.json(
        { error: 'Failed to refresh token' },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();

    return Response.json({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      refresh_token: tokenData.refresh_token || refresh_token,
    });
  } catch (error) {
    console.error('Error in Spotify token refresh:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

