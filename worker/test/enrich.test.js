import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveCoverArt, resolveMbid } from '../src/enrich.js';

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

describe('resolveMbid', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns null when no mbid provided', async () => {
    expect(await resolveMbid({})).toBeNull();
    expect(await resolveMbid({ type: 'album' })).toBeNull();
  });

  it('resolves album (release-group) metadata + cover art', async () => {
    let mbUrl = '';
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      mbUrl = String(url);
      if (mbUrl.includes('musicbrainz.org/ws/2/release-group/')) {
        return new Response(JSON.stringify({
          title: 'Rites of Spring',
          'artist-credit': [{ name: 'Noah Gundersen', joinphrase: '' }]
        }), { status: 200 });
      }
      return new Response('', { status: 404 });
    }));
    const r = await resolveMbid({ mbid: '0ae16d85-8692-4e91-903a-b4c3dbab9dac', type: 'album' });
    expect(r.artist).toBe('Noah Gundersen');
    expect(r.title).toBe('Rites of Spring');
    expect(r.album).toBe('Rites of Spring');
    expect(r.coverArtUrl).toContain('coverartarchive.org/release-group/0ae16d85-8692-4e91-903a-b4c3dbab9dac');
    expect(r.type).toBe('album');
  });

  it('maps type=track to recording endpoint', async () => {
    let mbUrl = '';
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      mbUrl = String(url);
      if (mbUrl.includes('/recording/')) {
        return new Response(JSON.stringify({
          title: 'Some Song',
          'artist-credit': [{ name: 'Some Artist', joinphrase: '' }]
        }), { status: 200 });
      }
      return new Response('', { status: 404 });
    }));
    const r = await resolveMbid({ mbid: 'abc', type: 'track' });
    expect(mbUrl).toContain('/recording/abc');
    expect(r.title).toBe('Some Song');
    expect(r.artist).toBe('Some Artist');
    // Recordings don't have CAA cover art (releases do); coverArtUrl is null for non-album types.
    expect(r.coverArtUrl).toBeNull();
  });

  it('maps type=artist to artist endpoint', async () => {
    let mbUrl = '';
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      mbUrl = String(url);
      return new Response(JSON.stringify({ name: 'Noah Gundersen' }), { status: 200 });
    }));
    const r = await resolveMbid({ mbid: 'artist-mbid', type: 'artist' });
    expect(mbUrl).toContain('/artist/artist-mbid');
    expect(r.artist).toBe('Noah Gundersen');
  });

  it('joins multi-artist credits with their joinphrases', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      title: 'Duet',
      'artist-credit': [
        { name: 'Artist A', joinphrase: ' & ' },
        { name: 'Artist B', joinphrase: '' }
      ]
    }), { status: 200 })));
    const r = await resolveMbid({ mbid: 'x', type: 'album' });
    expect(r.artist).toBe('Artist A & Artist B');
  });

  it('returns null when MusicBrainz returns 404', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not found', { status: 404 })));
    expect(await resolveMbid({ mbid: 'bogus', type: 'album' })).toBeNull();
  });

  it('defaults type to album (release-group) when omitted', async () => {
    let mbUrl = '';
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      mbUrl = String(url);
      return new Response('', { status: 404 });
    }));
    await resolveMbid({ mbid: 'abc' });
    expect(mbUrl).toContain('/release-group/');
  });

  it('sends User-Agent identifying this app (MusicBrainz requires it)', async () => {
    let capturedUA = '';
    vi.stubGlobal('fetch', vi.fn(async (url, opts) => {
      capturedUA = opts?.headers?.['User-Agent'] || '';
      return new Response('', { status: 404 });
    }));
    await resolveMbid({ mbid: 'abc', type: 'album' });
    expect(capturedUA).toMatch(/parachord-edge/);
    expect(capturedUA).toMatch(/parachord\.com/);
  });
});
