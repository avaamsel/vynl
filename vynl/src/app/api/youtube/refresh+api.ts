export async function POST(req: Request) {
  try {
    const { refresh_token } = await req.json();

    if (!refresh_token) {
      return Response.json({ error: 'Missing refresh_token' }, { status: 400 });
    }

    const clientId = process.env.EXPO_PUBLIC_YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return Response.json({ error: 'YouTube credentials missing' }, { status: 500 });
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error('YouTube token refresh failed:', errorBody);
      return Response.json({ error: 'Failed to refresh YouTube token' }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();

    return Response.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || refresh_token,
      expires_in: tokenData.expires_in,
    });
  } catch (error) {
    console.error('Error refreshing YouTube token:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}


