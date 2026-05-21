import { describe, it, expect } from 'vitest';
import { renderShell } from '../src/render.js';

describe('renderShell', () => {
  const baseProps = {
    title: 'Open in Parachord',
    subtitle: 'Tap to launch the app',
    deepLink: 'parachord://play?title=X',
    cta: { href: 'https://parachord.com/apps', label: 'Get Parachord' },
    canonicalUrl: 'https://parachord.com/play?title=X',
    ogImage: 'https://parachord.com/assets/home.png'
  };

  it('emits a hidden auto-trigger anchor with the deep link', () => {
    const html = renderShell(baseProps);
    expect(html).toContain(`href="parachord://play?title=X"`);
    expect(html).toContain('id="open"');
  });

  it('includes a setTimeout location.href trigger', () => {
    const html = renderShell(baseProps);
    expect(html).toMatch(/setTimeout\([^)]*location\.href/);
  });

  it('renders the CTA href and label', () => {
    const html = renderShell(baseProps);
    expect(html).toContain('https://parachord.com/apps');
    expect(html).toContain('Get Parachord');
  });

  it('sets og:title, og:url, og:image, og:description', () => {
    const html = renderShell(baseProps);
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:url"');
    expect(html).toContain('property="og:image"');
    expect(html).toContain('property="og:description"');
    expect(html).toContain('https://parachord.com/play?title=X');
  });

  it('escapes HTML in title/subtitle to prevent XSS', () => {
    const html = renderShell({
      ...baseProps,
      title: '<script>alert(1)</script>',
      subtitle: 'A "quoted" thing & ampersand'
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&amp;');
    expect(html).toContain('&quot;');
  });

  it('escapes the deep link in the href attribute', () => {
    const html = renderShell({
      ...baseProps,
      deepLink: 'parachord://chat?prompt="evil"'
    });
    expect(html).toContain('&quot;evil&quot;');
  });
});
