/**
 * Catch-all API proxy route
 *
 * When BACKEND_URL is set (e.g. your deployed Express backend), every request
 * to /api/* is transparently forwarded there with the original method, headers,
 * and body.  This keeps the frontend as the single network entry point and
 * eliminates CORS issues between the browser and the backend.
 *
 * If BACKEND_URL is NOT set the route returns a 503 with a clear message so
 * the developer knows what environment variable to add.
 *
 * Usage (Vercel → Settings → Environment Variables):
 *   BACKEND_URL = https://your-backend.railway.app
 */

const BACKEND_URL = process.env.BACKEND_URL;

async function handler(request, { params }) {
  if (!BACKEND_URL) {
    return new Response(
      JSON.stringify({
        error: 'Backend not configured',
        hint: 'Set the BACKEND_URL environment variable in Vercel to point to your deployed backend.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const path = params.path.join('/');
  const targetUrl = `${BACKEND_URL}/api/${path}${
    request.nextUrl.search ? request.nextUrl.search : ''
  }`;

  // Forward all headers except host (which would confuse the backend)
  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.delete('host');

  let body = undefined;
  const method = request.method.toUpperCase();
  if (!['GET', 'HEAD', 'DELETE'].includes(method)) {
    body = await request.arrayBuffer();
  }

  try {
    const backendResponse = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body,
      // Required for Node.js 18+: don't follow redirects, let the client handle them
      redirect: 'manual',
    });

    // Stream the response back, preserving status and headers
    const responseHeaders = new Headers(backendResponse.headers);
    // Remove transfer-encoding — Next.js handles this automatically
    responseHeaders.delete('transfer-encoding');

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error(`[Proxy] Failed to reach backend at ${targetUrl}:`, err.message);
    return new Response(
      JSON.stringify({ error: 'Backend unreachable', detail: err.message }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
