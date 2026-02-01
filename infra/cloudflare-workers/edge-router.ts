/**
 * Cloudflare Worker - Edge Router for Heady Ecosystem
 * Routes requests to appropriate services and provides edge caching
 */

export interface Env {
  HEADY_API_URL: string;
  HEADY_CONNECTION_URL: string;
  HEADY_SYSTEMS_URL: string;
  GITHUB_WEBHOOK_SECRET: string;
  KV_CACHE: KVNamespace;
  ANALYTICS: AnalyticsEngineDataset;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route based on path
    try {
      let response: Response;

      // API routes -> Heady Automation IDE on Render
      if (path.startsWith('/api/')) {
        response = await handleAPIRequest(request, env);
      }
      // HeadyConnection routes
      else if (path.startsWith('/connection/') || url.hostname.includes('headyconnection')) {
        response = await proxyToService(request, env.HEADY_CONNECTION_URL);
      }
      // HeadySystems routes
      else if (path.startsWith('/systems/') || url.hostname.includes('headysystems')) {
        response = await proxyToService(request, env.HEADY_SYSTEMS_URL);
      }
      // GitHub webhook handler
      else if (path === '/webhooks/github') {
        response = await handleGitHubWebhook(request, env);
      }
      // Default to HeadyConnection
      else {
        response = await proxyToService(request, env.HEADY_CONNECTION_URL);
      }

      // Add CORS headers to response
      const newResponse = new Response(response.body, response);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newResponse.headers.set(key, value);
      });

      // Track analytics
      if (env.ANALYTICS) {
        ctx.waitUntil(
          env.ANALYTICS.writeDataPoint({
            blobs: [path, request.method, url.hostname],
            doubles: [response.status],
            indexes: [url.hostname],
          })
        );
      }

      return newResponse;
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Internal server error', message: (error as Error).message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
  },
};

/**
 * Handle API requests with caching
 */
async function handleAPIRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const cacheKey = `api:${url.pathname}${url.search}`;

  // Check cache for GET requests
  if (request.method === 'GET') {
    const cached = await env.KV_CACHE.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
        },
      });
    }
  }

  // Proxy to Render backend
  const response = await proxyToService(request, env.HEADY_API_URL);

  // Cache successful GET responses
  if (request.method === 'GET' && response.ok) {
    const body = await response.text();
    await env.KV_CACHE.put(cacheKey, body, { expirationTtl: 300 }); // 5 min cache
    return new Response(body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
      },
    });
  }

  return response;
}

/**
 * Proxy request to backend service
 */
async function proxyToService(request: Request, targetUrl: string): Promise<Response> {
  const url = new URL(request.url);
  const targetURL = new URL(url.pathname + url.search, targetUrl);

  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP') || '');
  headers.set('X-Forwarded-Proto', url.protocol.slice(0, -1));
  headers.set('X-Forwarded-Host', url.hostname);

  return await fetch(targetURL.toString(), {
    method: request.method,
    headers,
    body: request.body,
  });
}

/**
 * Handle GitHub webhook events
 */
async function handleGitHubWebhook(request: Request, env: Env): Promise<Response> {
  // Verify webhook signature
  const signature = request.headers.get('X-Hub-Signature-256');
  if (!signature) {
    return new Response('Missing signature', { status: 401 });
  }

  const body = await request.text();
  const isValid = await verifyGitHubSignature(body, signature, env.GITHUB_WEBHOOK_SECRET);

  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = request.headers.get('X-GitHub-Event');
  const payload = JSON.parse(body);

  // Forward to backend for processing
  const response = await fetch(`${env.HEADY_API_URL}/webhooks/github`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-GitHub-Event': event || '',
    },
    body: JSON.stringify(payload),
  });

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Verify GitHub webhook signature
 */
async function verifyGitHubSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  const expectedSignature = `sha256=${hashHex}`;

  return signature === expectedSignature;
}
