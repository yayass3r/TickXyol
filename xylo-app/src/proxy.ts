import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/articles',
];

const ADMIN_PATHS = ['/admin'];
const CREATOR_PATHS = ['/articles/new', '/articles/edit'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security headers
  const responseHeaders = new Headers();
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  responseHeaders.set('X-Frame-Options', 'DENY');
  responseHeaders.set('X-XSS-Protection', '1; mode=block');
  responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Skip auth for public paths and static files
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.')
  ) {
    return NextResponse.next({ headers: responseHeaders });
  }

  // Get token from cookie
  const token = request.cookies.get('xylo_token')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: responseHeaders });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401, headers: responseHeaders });
    }
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.delete('xylo_token');
    return res;
  }

  // Admin route protection
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (payload.role !== 'ADMIN' && payload.role !== 'MODERATOR') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Creator route protection
  if (CREATOR_PATHS.some((p) => pathname.startsWith(p))) {
    if (payload.role !== 'CREATOR' && payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Attach user info to request headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-email', payload.email);

  return NextResponse.next({
    request: { headers: requestHeaders },
    headers: responseHeaders,
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
