import { describe, it, expect } from 'vitest';
import { renderTemplateC } from '../src/templates/templateC.js';

const cta = { href: 'https://parachord.com/apps', label: 'Get Parachord' };

describe('renderTemplateC', () => {
  it('renders an artist page with title-cased entity name', () => {
    const html = renderTemplateC({
      pathname: '/artist/radiohead',
      query: {},
      deepLink: 'parachord://artist/radiohead',
      cta,
      canonicalUrl: 'https://parachord.com/artist/radiohead',
      coverArtUrl: null
    });
    expect(html).toContain('Radiohead');
  });

  it('reflects the deep link in both the anchor href and the JS redirect', () => {
    const deepLink = 'parachord://artist/radiohead';
    const html = renderTemplateC({
      pathname: '/artist/radiohead',
      query: {},
      deepLink,
      cta,
      canonicalUrl: 'https://parachord.com/artist/radiohead',
      coverArtUrl: null
    });
    expect(html).toContain(`href="${deepLink}"`);
    expect(html).toContain(JSON.stringify(deepLink));
  });

  it('renders an album page with the default copy when no name is given', () => {
    const html = renderTemplateC({
      pathname: '/album/abc123',
      query: {},
      deepLink: 'parachord://album/abc123',
      cta,
      canonicalUrl: 'https://parachord.com/album/abc123',
      coverArtUrl: null
    });
    expect(html).toContain('Album');
  });

  it('renders an album page with the name from the query', () => {
    const html = renderTemplateC({
      pathname: '/album/abc123',
      query: { name: 'Kid A' },
      deepLink: 'parachord://album/abc123',
      cta,
      canonicalUrl: 'https://parachord.com/album/abc123?name=Kid+A',
      coverArtUrl: null
    });
    expect(html).toContain('Kid A');
  });

  it('renders a playlist page with the default copy when no name is given', () => {
    const html = renderTemplateC({
      pathname: '/playlist/xyz789',
      query: {},
      deepLink: 'parachord://playlist/xyz789',
      cta,
      canonicalUrl: 'https://parachord.com/playlist/xyz789',
      coverArtUrl: null
    });
    expect(html).toContain('Playlist');
  });

  it('renders /play/:trackid with the "Play X by Y" copy when title and artist are present', () => {
    const html = renderTemplateC({
      pathname: '/play/track123',
      query: { title: 'Karma Police', artist: 'Radiohead' },
      deepLink: 'parachord://play/track123',
      cta,
      canonicalUrl: 'https://parachord.com/play/track123?title=Karma+Police&artist=Radiohead',
      coverArtUrl: null
    });
    expect(html).toContain('Karma Police');
    expect(html).toContain('Radiohead');
  });

  it('includes the cover art URL in the HTML when provided', () => {
    const html = renderTemplateC({
      pathname: '/album/abc123',
      query: { name: 'Kid A' },
      deepLink: 'parachord://album/abc123',
      cta,
      canonicalUrl: 'https://parachord.com/album/abc123',
      coverArtUrl: 'https://i.scdn.co/image/xyz.jpg'
    });
    expect(html).toContain('https://i.scdn.co/image/xyz.jpg');
    expect(html).toMatch(/<img[^>]+src="https:\/\/i\.scdn\.co\/image\/xyz\.jpg"/);
  });

  it('renders a gradient hero (no img tag) when no cover art is provided', () => {
    const html = renderTemplateC({
      pathname: '/artist/radiohead',
      query: {},
      deepLink: 'parachord://artist/radiohead',
      cta,
      canonicalUrl: 'https://parachord.com/artist/radiohead',
      coverArtUrl: null
    });
    expect(html).toContain('class="hero"');
    expect(html).not.toMatch(/<div class="hero"[^>]*>\s*<img/);
  });
});
