import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getConfig } from './lib/config';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow requests for static files, API routes, and intro video to pass through
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/sounds/') ||
    pathname.includes('.') // Generally static files like .png, .mp4
  ) {
    return NextResponse.next();
  }

  try {
    const config = await getConfig();
    const setupComplete = config.setupconfig === true;

    // If setup is not complete and user is not on the setup page, redirect them
    if (!setupComplete && pathname !== '/setup') {
      return NextResponse.redirect(new URL('/setup', request.url));
    }

    // If setup is complete and user tries to access setup page, redirect to login
    if (setupComplete && pathname === '/setup') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

  } catch (error) {
    console.error("Middleware error reading config:", error);
    // If config fails, maybe let it pass to avoid breaking the entire app
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // Match all paths except for API routes and static files
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
