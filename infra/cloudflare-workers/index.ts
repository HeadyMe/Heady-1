// Minimal Cloudflare Worker entry point for deterministic builds
export default {
  async fetch(request: Request): Promise<Response> {
    return new Response('Heady Edge Router - Deterministic Build', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  },
};
