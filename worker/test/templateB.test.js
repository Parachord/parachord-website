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
