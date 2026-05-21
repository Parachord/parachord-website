import { describe, it, expect } from 'vitest';
import { renderTemplateA } from '../src/templates/templateA.js';

describe('renderTemplateA', () => {
  it('uses a verb-specific title for /home', () => {
    const html = renderTemplateA({
      pathname: '/home',
      deepLink: 'parachord://home',
      cta: { href: 'https://parachord.com/apps', label: 'Get Parachord' },
      canonicalUrl: 'https://parachord.com/home'
    });
    expect(html).toMatch(/<title>[^<]*Parachord[^<]*<\/title>/i);
    expect(html).toContain('parachord://home');
  });

  it('uses a verb-specific title for /charts', () => {
    const html = renderTemplateA({
      pathname: '/charts',
      deepLink: 'parachord://charts',
      cta: { href: 'https://parachord.com/apps', label: 'Get Parachord' },
      canonicalUrl: 'https://parachord.com/charts'
    });
    expect(html.toLowerCase()).toContain('chart');
  });

  it('falls back to a generic copy for unknown but classified paths', () => {
    const html = renderTemplateA({
      pathname: '/settings/whatever',
      deepLink: 'parachord://settings/whatever',
      cta: { href: 'https://parachord.com/apps', label: 'Get Parachord' },
      canonicalUrl: 'https://parachord.com/settings/whatever'
    });
    expect(html).toContain('Parachord');
  });
});
