/**
 * ============================================================
 * GROWTHCRESTAI — OPTION A: Cloudflare Worker Proxy
 * ============================================================
 *
 * HOW TO DEPLOY (free, takes ~5 minutes):
 * ────────────────────────────────────────
 * 1. Go to https://workers.cloudflare.com and sign up free
 * 2. Click "Create Worker"
 * 3. Delete all default code in the editor
 * 4. Paste THIS entire file into the editor
 * 5. Click "Save and Deploy"
 * 6. Copy your worker URL (looks like: https://your-name.workers.dev)
 * 7. Paste that URL into the WordPress widget file where it says:
 *    var PROXY_URL = 'https://your-name.workers.dev';
 *
 * SECURITY: Add your Anthropic API key in Cloudflare dashboard:
 *   Worker Settings → Variables → Add Variable
 *   Name: ANTHROPIC_API_KEY
 *   Value: sk-ant-xxxxxxxxxxxxxxxx
 *   Toggle "Encrypt" ON
 * ============================================================
 */

export default {
  async fetch(request, env) {

    // Allow requests from your WordPress site only
    const ALLOWED_ORIGINS = [
      'https://growthcrestai.com',
      'https://www.growthcrestai.com',
      'http://localhost',       // for local testing
      'http://localhost:3000',
    ];

    const origin = request.headers.get('Origin') || '';
    const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Only allow from your site
    if (!isAllowed) {
      return new Response('Forbidden', { status: 403 });
    }

    try {
      const body = await request.json();

      // Forward request to Anthropic API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          system: body.system,
          messages: body.messages,
        }),
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
        }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
        }
      });
    }
  }
};
