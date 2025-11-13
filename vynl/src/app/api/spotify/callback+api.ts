/**
 * API route to handle Spotify OAuth callback (for web)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      // Redirect to error page
      return Response.redirect('/?spotify_error=' + encodeURIComponent(error), 303);
    }

    if (!code) {
      return Response.redirect('/?spotify_error=no_code', 303);
    }

    const redirectUri = url.searchParams.get('state') || '/';
    return Response.redirect(`/?spotify_code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`, 303);
  } catch (error) {
    console.error('Error in Spotify callback:', error);
    return Response.redirect('/?spotify_error=callback_error', 303);
  }
}

