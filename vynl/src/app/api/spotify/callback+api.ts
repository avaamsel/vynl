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

    // Store the code in a way that the client can retrieve it
    // For a more robust solution, you might want to use sessions or temporary storage
    // For now, we'll redirect back with the code and let the client handle it
    const redirectUri = url.searchParams.get('state') || '/';
    
    // In a production app, you'd exchange the code for a token here on the server
    // and then redirect with a session token or store it server-side
    // For now, we'll redirect to a callback handler page
    return Response.redirect(`/?spotify_code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`, 303);
  } catch (error) {
    console.error('Error in Spotify callback:', error);
    return Response.redirect('/?spotify_error=callback_error', 303);
  }
}

