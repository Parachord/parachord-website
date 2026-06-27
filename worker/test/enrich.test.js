import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveCoverArt, resolveMbid, resolvePlaylistFromUrl } from '../src/enrich.js';

// Minimal HTML head that mirrors Achordion's OG-tag shape.
function achordionHtml({
  title = '🪹 (Fall 2024) by jherskowitz',
  description = '🪹 (Fall 2024) by jherskowitz · 8 tracks · Achordion playlist.',
  image = 'https://achordion.xyz/playlist/c2accebd/opengraph-image-17lsgi?ffe3d536244006f0',
  type = 'music.playlist'
} = {}) {
  return `<!DOCTYPE html><html><head>
    <meta property="og:title" content="${title}"/>
    <meta property="og:description" content="${description}"/>
    <meta property="og:image" content="${image}"/>
    <meta property="og:type" content="${type}"/>
    <title>Some Page</title>
  </head><body></body></html>`;
}

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

describe('resolvePlaylistFromUrl', () => {
  beforeEach(() => vi.restoreAllMocks());

  const ACHORDION_URL = 'https://achordion.xyz/playlist/c2accebd-ccd1-42c6-8ce7-ec0e8cf6cd13';

  it('returns null when no url provided', async () => {
    expect(await resolvePlaylistFromUrl({})).toBeNull();
    expect(await resolvePlaylistFromUrl({ url: '' })).toBeNull();
  });

  it('rejects non-https URLs without fetching', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    expect(await resolvePlaylistFromUrl({ url: 'http://achordion.xyz/playlist/abc' })).toBeNull();
    expect(await resolvePlaylistFromUrl({ url: 'file:///etc/passwd' })).toBeNull();
    expect(await resolvePlaylistFromUrl({ url: 'ftp://achordion.xyz/abc' })).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects hosts not in the allowlist without fetching', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    expect(await resolvePlaylistFromUrl({ url: 'https://attacker.example/abc' })).toBeNull();
    expect(await resolvePlaylistFromUrl({ url: 'https://192.168.1.1/abc' })).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('parses og:title, og:description, og:image from Achordion HTML', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(achordionHtml(), {
      status: 200, headers: { 'content-type': 'text/html' }
    })));
    const r = await resolvePlaylistFromUrl({ url: ACHORDION_URL });
    expect(r.title).toBe('🪹 (Fall 2024) by jherskowitz');
    expect(r.description).toBe('🪹 (Fall 2024) by jherskowitz · 8 tracks · Achordion playlist.');
    expect(r.coverArtUrl).toBe('https://achordion.xyz/playlist/c2accebd/opengraph-image-17lsgi?ffe3d536244006f0');
    expect(r.providerType).toBe('music.playlist');
    expect(r.sourceUrl).toBe(ACHORDION_URL);
  });

  it('returns null when fetch returns non-2xx', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not found', { status: 404 })));
    expect(await resolvePlaylistFromUrl({ url: ACHORDION_URL })).toBeNull();
  });

  it('returns null when HTML has no OG tags', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html><head></head><body>nope</body></html>', { status: 200 })));
    expect(await resolvePlaylistFromUrl({ url: ACHORDION_URL })).toBeNull();
  });

  it('returns partial result when only og:title is present', async () => {
    const html = `<html><head><meta property="og:title" content="My Playlist"/></head></html>`;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(html, { status: 200 })));
    const r = await resolvePlaylistFromUrl({ url: ACHORDION_URL });
    expect(r.title).toBe('My Playlist');
    expect(r.coverArtUrl).toBeNull();
  });

  it('sends identifying User-Agent', async () => {
    let capturedUA = '';
    vi.stubGlobal('fetch', vi.fn(async (url, opts) => {
      capturedUA = opts?.headers?.['User-Agent'] || '';
      return new Response(achordionHtml(), { status: 200 });
    }));
    await resolvePlaylistFromUrl({ url: ACHORDION_URL });
    expect(capturedUA).toMatch(/parachord-edge/);
  });

  it('handles HTML where attributes are in reverse order (content before property)', async () => {
    const html = `<meta content="Reverse Order Title" property="og:title"/>`;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(html, { status: 200 })));
    const r = await resolvePlaylistFromUrl({ url: ACHORDION_URL });
    expect(r?.title).toBe('Reverse Order Title');
  });

  it('decodes HTML entities in extracted OG values (some providers serve &amp; in image URLs)', async () => {
    const html = `<html><head>
      <meta property="og:title" content="Tom &amp; Jerry"/>
      <meta property="og:image" content="https://cdn.example/x.jpg?a=1&amp;b=2&amp;c=3"/>
    </head></html>`;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(html, { status: 200 })));
    const r = await resolvePlaylistFromUrl({ url: ACHORDION_URL });
    expect(r.title).toBe('Tom & Jerry');
    expect(r.coverArtUrl).toBe('https://cdn.example/x.jpg?a=1&b=2&c=3');
  });

  it('accepts open.spotify.com URLs', async () => {
    const html = `<html><head>
      <meta property="og:title" content="Today's Top Hits"/>
      <meta property="og:description" content="Playlist · Spotify · 50 items · 34.2M saves"/>
      <meta property="og:image" content="https://i.scdn.co/image/abc"/>
      <meta property="og:type" content="music.playlist"/>
    </head></html>`;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(html, { status: 200 })));
    const r = await resolvePlaylistFromUrl({ url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M' });
    expect(r.title).toBe("Today's Top Hits");
    expect(r.coverArtUrl).toBe('https://i.scdn.co/image/abc');
    expect(r.providerType).toBe('music.playlist');
  });

  it('accepts music.apple.com URLs (missing og:type is fine)', async () => {
    const html = `<html><head>
      <meta property="og:title" content="Today's Hits on Apple Music">
      <meta property="og:description" content="Playlist · 50 Songs">
      <meta property="og:image" content="https://is1-ssl.mzstatic.com/image/thumb/abc/1200x630SC.jpg">
    </head></html>`;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(html, { status: 200 })));
    const r = await resolvePlaylistFromUrl({ url: 'https://music.apple.com/us/playlist/todays-hits/pl.abc' });
    expect(r.title).toBe("Today's Hits on Apple Music");
    expect(r.providerType).toBeNull();  // Apple Music doesn't serve og:type
  });

  it('rejects YouTube URLs (rolled back — YouTube serves OG-stripped HTML to CF edge IPs)', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    expect(await resolvePlaylistFromUrl({ url: 'https://www.youtube.com/playlist?list=abc' })).toBeNull();
    expect(await resolvePlaylistFromUrl({ url: 'https://youtube.com/playlist?list=abc' })).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('accepts soundcloud.com playlist URLs', async () => {
    const html = `<html><head>
      <meta property="og:type" content="music.playlist">
      <meta property="og:title" content="Frozen in Time (2026)">
      <meta property="og:image" content="https://i1.sndcdn.com/artworks-ale9ktpNlR3D-0-t500x500.jpg">
      <meta property="og:description" content="Old dog. New tricks.">
    </head></html>`;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(html, { status: 200 })));
    const r = await resolvePlaylistFromUrl({ url: 'https://soundcloud.com/jherskowitz/sets/frozen-in-time-2026' });
    expect(r.title).toBe('Frozen in Time (2026)');
    expect(r.description).toBe('Old dog. New tricks.');
    expect(r.coverArtUrl).toContain('sndcdn.com');
    expect(r.providerType).toBe('music.playlist');
  });

  it('accepts on.soundcloud.com short links (redirects to canonical)', async () => {
    // redirect: 'follow' in our fetch handles the 302; the allowlist check
    // is on the original hostname, which we've now whitelisted.
    vi.stubGlobal('fetch', vi.fn(async () => new Response(`<meta property="og:title" content="X"/>`, { status: 200 })));
    const r = await resolvePlaylistFromUrl({ url: 'https://on.soundcloud.com/Drk2sCLhCHVNugYtAP' });
    expect(r?.title).toBe('X');
  });
});
