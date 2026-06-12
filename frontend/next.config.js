/** @type {import('next').NextConfig} */

const ContentSecurityPolicy = [
  "default-src 'self'",
  // Next.js requires unsafe-inline for hydration scripts; JSON-LD uses dangerouslySetInnerHTML
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Tailwind generates inline styles
  "style-src 'self' 'unsafe-inline'",
  // Allow same-origin images + data URIs for base64 + blob for any canvas/workers
  "img-src 'self' data: blob: https:",
  // OpenStreetMap embed
  "frame-src https://www.openstreetmap.org",
  // API calls go to same origin; wa.me for WhatsApp redirect
  "connect-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
