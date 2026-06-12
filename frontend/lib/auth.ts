import jwt from 'jsonwebtoken';

export const AUTH_COOKIE_NAME = 'cv_session';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      'FATAL: JWT_SECRET environment variable is missing, empty, or too short. ' +
      'It must be at least 32 characters for zero-trust compliance.'
    );
  }
  return secret;
}

export interface UserPayload {
  id: string;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'STAFF' | 'CLIENT';
  exp?: number;
  iat?: number;
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) {
    return null;
  }

  const cookies = header.split(';');
  for (const cookie of cookies) {
    const [rawKey, ...rawValue] = cookie.trim().split('=');
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join('='));
    }
  }
  return null;
}

/**
 * Extracts and verifies the JWT from the HttpOnly session cookie.
 * Returns the decoded UserPayload, or null if missing/invalid.
 */
export function getUser(request: Request): UserPayload | null {
  try {
    const token = readCookie(request.headers.get('cookie'), AUTH_COOKIE_NAME);

    if (!token) {
      return null;
    }

    return jwt.verify(token, getJwtSecret()) as UserPayload;
  } catch (err) {
    console.warn('[AUTH] Token verification failed:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

/**
 * Signs a new JWT for the user.
 */
export function generateToken(payload: { id: string; email: string; role: UserPayload['role'] }): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '1d' });
}
