import { renderShell } from '../render.js';

function titleCase(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function decodeSlug(s) {
  try {
    return decodeURIComponent(s || '');
  } catch {
    return s || '';
  }
}

function copyFor(pathname, query) {
  const seg0 = '/' + (pathname.split('/')[1] || '');
  const slug = decodeSlug(pathname.split('/')[2] || '');

  if (seg0 === '/artist') {
    const name = titleCase(slug) || 'Artist';
    return { title: name, subtitle: 'Open in Parachord to listen.' };
  }
  if (seg0 === '/album') {
    const name = query.name || '';
    return {
      title: name || 'Album in Parachord',
      subtitle: 'Open in Parachord to listen.'
    };
  }
  if (seg0 === '/playlist') {
    const name = query.name || '';
    return {
      title: name || 'Playlist in Parachord',
      subtitle: 'Open in Parachord to listen.'
    };
  }
  if (seg0 === '/play') {
    const t = query.title;
    const a = query.artist;
    if (t && a) return { title: `Play "${t}" by ${a}`, subtitle: 'Open in Parachord to listen.' };
    if (t)      return { title: `Play "${t}"`,         subtitle: 'Open in Parachord to listen.' };
    return { title: 'Play in Parachord', subtitle: 'Open in Parachord to listen.' };
  }
  return { title: 'Open in Parachord', subtitle: 'Tap to open Parachord.' };
}

export function renderTemplateC({ pathname, query, deepLink, cta, canonicalUrl, coverArtUrl }) {
  const { title, subtitle } = copyFor(pathname, query);
  const hero = coverArtUrl
    ? `<div class="hero"><img src="${coverArtUrl.replace(/"/g, '&quot;')}" alt=""></div>`
    : `<div class="hero"></div>`;
  return renderShell({
    title, subtitle, deepLink, cta, canonicalUrl,
    ogImage: coverArtUrl || 'https://parachord.com/assets/home.png',
    hero
  });
}
