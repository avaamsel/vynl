/**
 * API route to exchange Spotify authorization code for access token
 * This should be done server-side to keep the client secret secure
 */
export async function POST(req: Request) {
  try {
    const { code, redirectUri } = await req.json();

    if (!code || !redirectUri) {
      return Response.json(
        { error: 'Missing code or redirectUri' },
        { status: 400 }
      );
    }

    const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET; // Server-side only

    if (!clientId || !clientSecret) {
      return Response.json(
        { error: 'Spotify credentials not configured' },
        { status: 500 }
      );
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Spotify token exchange error:', error);
      return Response.json(
        { error: 'Failed to exchange code for token' },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();

    return Response.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
    });
  } catch (error) {
    console.error('Error in Spotify token exchange:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

