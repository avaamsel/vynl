export async function POST(req: Request) {
  try {
    const { code, redirectUri } = await req.json();

    if (!code || !redirectUri) {
      return Response.json({ error: 'Missing code or redirectUri' }, { status: 400 });
    }

    const webClientId = process.env.YOUTUBE_CLIENT_ID;
    const clientId = webClientId || process.env.EXPO_PUBLIC_YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.EXPO_PUBLIC_YOUTUBE_CLIENT_SECRET;

    if (!clientId) {
      return Response.json({ error: 'YouTube client ID missing' }, { status: 500 });
    }
    
    if (!clientSecret) {
      return Response.json({ 
        error: 'YouTube client secret missing. Create a Web application OAuth client and set YOUTUBE_CLIENT_SECRET in your .env file.' 
      }, { status: 500 });
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        access_type: 'offline',
        prompt: 'consent',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error('[YouTube Token API] Google token exchange failed:', tokenResponse.status, errorBody);
      console.error('[YouTube Token API] Used client_id:', clientId?.substring(0, 20) + '...');
      console.error('[YouTube Token API] Redirect URI:', redirectUri);
      return Response.json({ 
        error: 'Failed to exchange YouTube token',
        details: errorBody 
      }, { status: tokenResponse.status });
    }

    const tokenData = await tokenResponse.json();

    return Response.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
    });
  } catch (error) {
    console.error('Error exchanging YouTube token:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}


