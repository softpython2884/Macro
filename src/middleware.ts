import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    // We need the absolute URL for fetch in middleware.
    const configUrl = new URL('/api/config', request.url);
    const response = await fetch(configUrl);

    if (!response.ok) {
      console.error(`[MIDDLEWARE] Config API failed with status ${response.status}. Allowing request to proceed.`);
      return NextResponse.next();
    }
    
    const config = await response.json();
    if (config.error) {
       console.error(`[MIDDLEWARE] Config API returned an error: ${config.error}`);
       return NextResponse.next();
    }
    
    const setupComplete = config.setupconfig === true;

    // Redirect to setup if not complete and not already on setup page
    if (!setupComplete && pathname !== '/setup') {
      return NextResponse.redirect(new URL('/setup', request.url));
    }

    // Redirect from setup to login if setup is already complete
    if (setupComplete && pathname === '/setup') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch (error) {
    console.error('[MIDDLEWARE] Exception caught while fetching config:', error);
  }

  return NextResponse.next();
}

export const config = {
  // Match all paths except for API routes, static files, and images.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
