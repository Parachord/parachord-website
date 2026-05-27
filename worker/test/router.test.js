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
    const original = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({ results: [] }), {
      status: 200, headers: { 'content-type': 'application/json' }
    });
    try {
      const r = await get('https://parachord.com/play?artist=Radiohead&title=Karma+Police');
      expect(r.status).toBe(200);
      const body = await r.text();
      expect(body).toContain('Radiohead');
      expect(body).toContain('Karma Police');
    } finally {
      globalThis.fetch = original;
    }
  });

  it('normalizes /play/album?mbid=X to /play?type=album and resolves metadata', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async (url) => {
      const s = String(url);
      if (s.includes('musicbrainz.org/ws/2/release-group/')) {
        return new Response(JSON.stringify({
          title: 'Rites of Spring',
          'artist-credit': [{ name: 'Noah Gundersen', joinphrase: '' }]
        }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    };
    try {
      const r = await get('https://parachord.com/play/album?mbid=0ae16d85-8692-4e91-903a-b4c3dbab9dac');
      expect(r.status).toBe(200);
      const body = await r.text();
      expect(body).toContain('Rites of Spring');
      expect(body).toContain('Noah Gundersen');
      expect(body).toContain('coverartarchive.org/release-group/0ae16d85-8692-4e91-903a-b4c3dbab9dac/front-500');
    } finally {
      globalThis.fetch = original;
    }
  });

  it('normalizes /play/playlist?url=<achordion-url> and scrapes OG metadata', async () => {
    const original = globalThis.fetch;
    const achordionHtml = `<html><head>
      <meta property="og:title" content="🪹 (Fall 2024) by jherskowitz"/>
      <meta property="og:description" content="🪹 (Fall 2024) by jherskowitz · 8 tracks · Achordion playlist."/>
      <meta property="og:image" content="https://achordion.xyz/playlist/c2accebd/opengraph-image-xyz"/>
      <meta property="og:type" content="music.playlist"/>
    </head></html>`;
    globalThis.fetch = async (url) => {
      if (String(url).startsWith('https://achordion.xyz/')) {
        return new Response(achordionHtml, { status: 200, headers: { 'content-type': 'text/html' } });
      }
      return new Response('{}', { status: 404 });
    };
    try {
      const r = await get('https://parachord.com/play/playlist?url=https%3A%2F%2Fachordion.xyz%2Fplaylist%2Fc2accebd-ccd1-42c6-8ce7-ec0e8cf6cd13');
      expect(r.status).toBe(200);
      const body = await r.text();
      expect(body).toContain('🪹 (Fall 2024) by jherskowitz');
      expect(body).toContain('8 tracks');
      expect(body).toContain('opengraph-image-xyz');
    } finally {
      globalThis.fetch = original;
    }
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
