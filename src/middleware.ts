import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const AUTH_COOKIE_NAME = 'volley_auth_session';

const PUBLIC_FILE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.svg',
  '.ico',
  '.webp',
  '.json',
  '.webmanifest',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, next internal files, and images
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    PUBLIC_FILE_EXTENSIONS.some(ext => pathname.toLowerCase().endsWith(ext)) ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next();
  }

  // Allow auth API routes and public club directory / onboarding endpoints
  if (
    pathname.startsWith('/api/auth') ||
    pathname === '/api/clubs' ||
    pathname === '/api/clubs/current'
  ) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has(AUTH_COOKIE_NAME);

  // Public portal landing page (always accessible)
  if (pathname.startsWith('/portal')) {
    return NextResponse.next();
  }

  // If visiting login or register page
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (hasSession) {
      // Already logged in, redirect to dashboard
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // For protected API endpoints: return 401 JSON if not logged in
  if (pathname.startsWith('/api')) {
    if (!hasSession) {
      return NextResponse.json(
        { error: 'Brak autoryzacji. Zaloguj się, aby uzyskać dostęp do systemu.' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // For all other pages: redirect unauthenticated visitors to SaaS Portal (/portal)
  if (!hasSession) {
    const portalUrl = new URL('/portal', request.url);
    return NextResponse.redirect(portalUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

