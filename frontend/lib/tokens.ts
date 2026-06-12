import crypto from 'crypto';

export function generatePublicToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashPublicToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
}
