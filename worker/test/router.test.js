import { describe, it, expect } from 'vitest';
import worker from '../src/index.js';

const ctx = { waitUntil: () => {}, passThroughOnException: () => {} };
const env = { GH_PAGES_ORIGIN: 'https://parachord.github.io' };

async function get(url, headers = {}) {
  return worker.fetch(new Request(url, { headers }), env, ctx);
}

describe('router', () => {
  it('serves assetlinks.json with application/json', async () => {
    const r = await get('https://parachord.com/.well-known/assetlinks.json');
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toMatch(/^application\/json/);
    const body = await r.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('serves apple-app-site-association at extensionless path', async () => {
    const r = await get('https://parachord.com/.well-known/apple-app-site-association');
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toMatch(/^application\/json/);
  });

  it('serves template A for /home', async () => {
    const r = await get('https://parachord.com/home', { 'user-agent': 'Mozilla/5.0' });
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toMatch(/^text\/html/);
    const body = await r.text();
    expect(body).toContain('parachord://home');
  });

  it('serves template B for /play with query', async () => {
    const r = await get('https://parachord.com/play?artist=Radiohead&title=Karma+Police');
    expect(r.status).toBe(200);
    const body = await r.text();
    expect(body).toContain('Radiohead');
    expect(body).toContain('Karma Police');
  });

  it('passes /blog/foo through to GH Pages origin', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async (req) => {
      if (String(req.url || req).startsWith('https://parachord.github.io')) {
        return new Response('<html>blog</html>', { status: 200, headers: { 'content-type': 'text/html' } });
      }
      return original(req);
    };
    try {
      const r = await get('https://parachord.com/blog/foo');
      expect(r.status).toBe(200);
      expect(await r.text()).toContain('blog');
    } finally {
      globalThis.fetch = original;
    }
  });
});
