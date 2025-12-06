export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const userAgent = req.headers.get('user-agent') || '';

    // Check if this is a mobile app request (based on user agent or query param)
    const isMobile = userAgent.includes('Expo') || url.searchParams.get('mobile') === 'true';

    if (error) {
      if (isMobile) {
        // Redirect to app via deep link
        return Response.redirect(`vynl://youtube-callback?error=${encodeURIComponent(error)}`, 303);
      }
      return Response.redirect('/?youtube_error=' + encodeURIComponent(error), 303);
    }

    if (!code) {
      if (isMobile) {
        return Response.redirect('vynl://youtube-callback?error=no_code', 303);
      }
      return Response.redirect('/?youtube_error=no_code', 303);
    }

    const redirectUri = url.searchParams.get('state') || url.origin + url.pathname;
    
    if (isMobile) {
      // Redirect to app via deep link with the code
      return Response.redirect(
        `vynl://youtube-callback?code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`,
        303
      );
    }
    
    // For web, redirect to the app page
    return Response.redirect(
      `/?youtube_code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`,
      303
    );
  } catch (error) {
    console.error('Error in YouTube callback:', error);
    return Response.redirect('/?youtube_error=callback_error', 303);
  }
}


