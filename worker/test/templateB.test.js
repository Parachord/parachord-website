import { describe, it, expect } from 'vitest';
import { renderTemplateB } from '../src/templates/templateB.js';

const cta = { href: 'https://parachord.com/apps', label: 'Get Parachord' };

describe('renderTemplateB', () => {
  it('renders "Play X by Y" context for /play with artist+title', () => {
    const html = renderTemplateB({
      pathname: '/play',
      query: { title: 'Karma Police', artist: 'Radiohead' },
      deepLink: 'parachord://play?title=Karma+Police&artist=Radiohead',
      cta,
      canonicalUrl: 'https://parachord.com/play?title=Karma+Police&artist=Radiohead',
      coverArtUrl: null
    });
    expect(html).toContain('Karma Police');
    expect(html).toContain('Radiohead');
  });

  it('shows cover art when provided', () => {
    const html = renderTemplateB({
      pathname: '/play',
      query: { title: 'X', artist: 'Y' },
      deepLink: 'parachord://play',
      cta,
      canonicalUrl: 'https://parachord.com/play',
      coverArtUrl: 'https://i.scdn.co/image/abc.jpg'
    });
    expect(html).toContain('https://i.scdn.co/image/abc.jpg');
  });

  it('handles control verbs without query gracefully', () => {
    const html = renderTemplateB({
      pathname: '/control/play',
      query: {},
      deepLink: 'parachord://control/play',
      cta,
      canonicalUrl: 'https://parachord.com/control/play',
      coverArtUrl: null
    });
    expect(html.toLowerCase()).toContain('parachord');
  });

  it('drops non-https cover art URLs', () => {
    const html = renderTemplateB({
      pathname: '/play',
      query: { title: 'X', artist: 'Y' },
      deepLink: 'parachord://play',
      cta,
      canonicalUrl: 'https://parachord.com/play',
      coverArtUrl: 'javascript:alert(1)'
    });
    expect(html).not.toContain('javascript:alert');
    expect(html).not.toContain('<img');
  });

  it('escapes HTML-special chars in cover-art URL', () => {
    const html = renderTemplateB({
      pathname: '/play',
      query: { title: 'X', artist: 'Y' },
      deepLink: 'parachord://play',
      cta,
      canonicalUrl: 'https://parachord.com/play',
      coverArtUrl: 'https://example.com/img.jpg?a=1&b=<2>'
    });
    expect(html).toContain('&amp;b=&lt;2&gt;');
  });

  it('renders "Play album X by Y" copy when type=album', () => {
    const html = renderTemplateB({
      pathname: '/play',
      query: { type: 'album', album: 'Rites of Spring', artist: 'Noah Gundersen' },
      deepLink: 'parachord://play?type=album&mbid=abc',
      cta,
      canonicalUrl: 'https://parachord.com/play?type=album&mbid=abc',
      coverArtUrl: 'https://coverartarchive.org/release-group/abc/front-500'
    });
    expect(html).toContain('Rites of Spring');
    expect(html).toContain('Noah Gundersen');
    expect(html.toLowerCase()).toContain('album');
    expect(html).toContain('coverartarchive.org/release-group/abc/front-500');
  });

  it('renders "Open artist X" copy when type=artist', () => {
    const html = renderTemplateB({
      pathname: '/play',
      query: { type: 'artist', artist: 'Noah Gundersen' },
      deepLink: 'parachord://play?type=artist&mbid=abc',
      cta,
      canonicalUrl: 'https://parachord.com/play?type=artist&mbid=abc',
      coverArtUrl: null
    });
    expect(html).toContain('Noah Gundersen');
    expect(html.toLowerCase()).toMatch(/open|artist/);
  });

  it('falls back to album copy without artist if only album name is known', () => {
    const html = renderTemplateB({
      pathname: '/play',
      query: { type: 'album', album: 'Rites of Spring' },
      deepLink: 'parachord://play?type=album',
      cta,
      canonicalUrl: 'https://parachord.com/play?type=album',
      coverArtUrl: null
    });
    expect(html).toContain('Rites of Spring');
  });

  it('renders playlist copy when type=playlist with title + description', () => {
    const html = renderTemplateB({
      pathname: '/play',
      query: {
        type: 'playlist',
        title: '🪹 (Fall 2024) by jherskowitz',
        description: '🪹 (Fall 2024) by jherskowitz · 8 tracks · Achordion playlist.'
      },
      deepLink: 'parachord://play?type=playlist&url=https://achordion.xyz/playlist/abc',
      cta,
      canonicalUrl: 'https://parachord.com/play?type=playlist&url=https://achordion.xyz/playlist/abc',
      coverArtUrl: 'https://achordion.xyz/playlist/abc/opengraph-image-xyz'
    });
    expect(html).toContain('🪹 (Fall 2024) by jherskowitz');
    expect(html).toContain('8 tracks');
    expect(html).toContain('Achordion playlist');
    expect(html).toContain('opengraph-image-xyz');
    // Title should not appear twice in a row (subtitle dedup)
    const titleCount = (html.match(/🪹 \(Fall 2024\) by jherskowitz/g) || []).length;
    // Appears in <title>, og:title, og:description, h1 — but the subtitle
    // <p class="sub"> should have ONLY the tail, not the duplicate prefix.
    expect(html).toMatch(/<p class="sub">8 tracks · Achordion playlist\.<\/p>/);
  });

  it('falls back to generic playlist copy when no metadata resolves', () => {
    const html = renderTemplateB({
      pathname: '/play',
      query: { type: 'playlist', url: 'https://achordion.xyz/playlist/missing' },
      deepLink: 'parachord://play?type=playlist&url=...',
      cta,
      canonicalUrl: 'https://parachord.com/play?type=playlist',
      coverArtUrl: null
    });
    expect(html.toLowerCase()).toContain('playlist');
    expect(html.toLowerCase()).toContain('parachord');
  });

  it('handles /import with a url param', () => {
    const html = renderTemplateB({
      pathname: '/import',
      query: { url: 'https://open.spotify.com/playlist/abc' },
      deepLink: 'parachord://import?url=...',
      cta,
      canonicalUrl: 'https://parachord.com/import?url=...',
      coverArtUrl: null
    });
    expect(html.toLowerCase()).toContain('import');
  });
});
