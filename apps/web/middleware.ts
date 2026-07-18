import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/auth/login', '/auth/register'];

const ROLE_ROUTES: Record<string, string[]> = {
  super_admin:      ['/dashboard/admin'],
  admin:            ['/dashboard/admin'],
  customer:         ['/dashboard/customer'],
  merchant:         ['/dashboard/merchant'],
  delivery_partner: ['/dashboard/driver'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname === p) || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Get auth state from cookie/localStorage via cookie
  const authCookie = request.cookies.get('aegispay-auth');

  // For dashboard routes, check auth
  if (pathname.startsWith('/dashboard')) {
    if (!authCookie) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    try {
      const auth = JSON.parse(authCookie.value);
      const role = auth?.state?.user?.role;

      if (!role || !auth?.state?.accessToken) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

      // Role-based route protection
      const allowedPrefixes = ROLE_ROUTES[role] ?? [];
      const isAllowed = allowedPrefixes.some(prefix => pathname.startsWith(prefix));

      if (!isAllowed) {
        // Redirect to their correct dashboard
        const dest = ROLE_ROUTES[role]?.[0] ?? '/auth/login';
        return NextResponse.redirect(new URL(dest, request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
