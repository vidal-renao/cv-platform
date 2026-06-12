import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'cv_session';
const INTERNAL_ROLES = new Set(['SUPERADMIN', 'ADMIN', 'STAFF']);
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const RATE_LIMIT_BUCKETS = new Map<string, { count: number; resetAt: number }>();

type SessionPayload = {
  id?: string;
  email?: string;
  role?: string;
  exp?: number;
};

function base64UrlToBytes(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function decodePayload(value: string): SessionPayload | null {
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(value));
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}

async function verifySession(token: string): Promise<SessionPayload | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [header, payload, signature] = parts;
  const decoded = decodePayload(payload);
  if (!decoded?.id || !decoded.email || !decoded.role || !decoded.exp) {
    return null;
  }

  if (decoded.exp * 1000 <= Date.now()) {
    return null;
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlToBytes(signature),
    new TextEncoder().encode(`${header}.${payload}`)
  );

  return valid ? decoded : null;
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', request.nextUrl.pathname);

  const response = NextResponse.redirect(loginUrl);
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}

function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const expectedOrigin = request.nextUrl.origin;

  if (origin) {
    return origin === expectedOrigin;
  }

  if (referer) {
    try {
      return new URL(referer).origin === expectedOrigin;
    } catch {
      return false;
    }
  }

  return true;
}

function numberFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function rateLimitCategory(pathname: string): 'auth' | 'chat' | 'upload' | 'api' {
  if (/^\/api\/auth\/(login|register|forgot-password|reset-password)/.test(pathname)) {
    return 'auth';
  }

  if (/^\/api\/clients\/[^/]+\/(generate-access|resend-access)/.test(pathname)) {
    return 'auth';
  }

  if (pathname === '/api/chat/messages') {
    return 'chat';
  }

  if (/^\/api\/packages\/[^/]+\/proof/.test(pathname)) {
    return 'upload';
  }

  return 'api';
}

function rateLimitMax(category: 'auth' | 'chat' | 'upload' | 'api'): number {
  if (category === 'auth') return numberFromEnv('RATE_LIMIT_MAX_AUTH', 10);
  if (category === 'chat') return numberFromEnv('RATE_LIMIT_MAX_CHAT', 60);
  if (category === 'upload') return numberFromEnv('RATE_LIMIT_MAX_UPLOAD', 20);
  return numberFromEnv('RATE_LIMIT_MAX_API', 100);
}

function rateLimitRequest(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (
    process.env.RATE_LIMIT_ENABLED === 'false' ||
    request.method === 'OPTIONS' ||
    pathname === '/api/health' ||
    pathname === '/api/ready'
  ) {
    return null;
  }

  const windowMs = numberFromEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000);
  const now = Date.now();
  const category = rateLimitCategory(pathname);
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const key = `${category}:${ip}`;
  const current = RATE_LIMIT_BUCKETS.get(key);

  if (!current || current.resetAt <= now) {
    RATE_LIMIT_BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  current.count += 1;

  if (current.count > rateLimitMax(category)) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    );
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const session = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    const limited = rateLimitRequest(request);
    if (limited) {
      return limited;
    }

    if (MUTATING_METHODS.has(request.method) && !isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'CSRF origin check failed' }, { status: 403 });
    }

    return NextResponse.next();
  }

  if (!session) {
    return redirectToLogin(request);
  }

  const user = await verifySession(session);
  if (!user) {
    return redirectToLogin(request);
  }

  if (pathname.startsWith('/dashboard') && !INTERNAL_ROLES.has(user.role || '')) {
    return NextResponse.redirect(new URL('/client/dashboard', request.url));
  }

  if (pathname.startsWith('/client') && user.role !== 'CLIENT') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/client/:path*', '/api/:path*'],
};
