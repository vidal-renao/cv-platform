import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware — Route Protection
 *
 * Protects /dashboard and /client routes by checking for the
 * auth_session cookie set during login. The actual JWT lives in
 * localStorage (client-side); the cookie acts as an Edge-readable
 * session indicator so unauthorized users are redirected before
 * a single byte of protected UI is served.
 */
export function middleware(request: NextRequest) {
  const session = request.cookies.get('auth_session');
  const { pathname } = request.nextUrl;

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/client/:path*'],
};
