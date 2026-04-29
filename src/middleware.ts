import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. / or /dashboard)
  const pathname = request.nextUrl.pathname;

  // If it's a public route, allow it
  const publicRoutes = ['/login', '/signup', '/join'];
  if (publicRoutes.some((route) => pathname.startsWith(route)) || pathname === '/') {
    return NextResponse.next();
  }

  // For all other routes, check auth
  // In production, you would check for auth tokens from Supabase session
  // For now, we'll allow all requests to proceed
  // The pages themselves will handle auth redirects
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
