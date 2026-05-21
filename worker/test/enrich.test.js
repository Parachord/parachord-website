import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveCoverArt } from '../src/enrich.js';

const env = { SPOTIFY_CLIENT_ID: 'id', SPOTIFY_CLIENT_SECRET: 'sec' };

describe('resolveCoverArt', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns null when no metadata provided', async () => {
    expect(await resolveCoverArt({ env })).toBeNull();
  });

  it('returns null when env has no Spotify creds and no other source matches', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
    const r = await resolveCoverArt({ artist: 'X', title: 'Y', env: {} });
    expect(r).toBeNull();
  });

  it('returns Spotify image when available', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (String(url).includes('accounts.spotify.com')) {
        return new Response(JSON.stringify({ access_token: 't', expires_in: 3600 }), { status: 200 });
      }
      if (String(url).includes('api.spotify.com')) {
        return new Response(JSON.stringify({
          tracks: { items: [{ album: { images: [{ url: 'https://i.scdn.co/abc.jpg' }] } }] }
        }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    }));
    const r = await resolveCoverArt({ artist: 'X', title: 'Y', env });
    expect(r).toBe('https://i.scdn.co/abc.jpg');
  });

  it('falls back to iTunes when Spotify yields nothing', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (String(url).includes('accounts.spotify.com')) {
        return new Response(JSON.stringify({ access_token: 't', expires_in: 3600 }), { status: 200 });
      }
      if (String(url).includes('api.spotify.com')) {
        return new Response(JSON.stringify({ tracks: { items: [] } }), { status: 200 });
      }
      if (String(url).includes('itunes.apple.com')) {
        return new Response(JSON.stringify({
          results: [{ artworkUrl100: 'https://is1-ssl.mzstatic.com/abc/100x100bb.jpg' }]
        }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    }));
    const r = await resolveCoverArt({ artist: 'X', title: 'Y', env });
    expect(r).toContain('mzstatic.com');
  });
});
