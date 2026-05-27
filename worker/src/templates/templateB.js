import { renderShell, escapeHtml } from '../render.js';

function copyFor(pathname, query) {
  const t = query.title;
  const a = query.artist;

  if (pathname === '/play') {
    // Album: query.album (from MBID lookup) or query.title used as album name.
    if (query.type === 'album') {
      const albumName = query.album || query.title;
      if (albumName && a) return { title: `Play "${albumName}" by ${a}`, subtitle: 'Open the album in Parachord.' };
      if (albumName)      return { title: `Play "${albumName}"`,         subtitle: 'Open the album in Parachord.' };
      return { title: 'Play album in Parachord', subtitle: 'Open the album in Parachord.' };
    }
    // Artist: open the artist page in the app.
    if (query.type === 'artist') {
      if (a) return { title: `Open ${a}`, subtitle: 'Open this artist in Parachord.' };
      return { title: 'Open artist in Parachord', subtitle: 'Open this artist in Parachord.' };
    }
    // Default: track (with or without explicit type=track).
    if (t && a) return { title: `Play "${t}" by ${a}`, subtitle: 'Open in Parachord to listen.' };
    if (t)      return { title: `Play "${t}"`,         subtitle: 'Open in Parachord to listen.' };
    return { title: 'Play in Parachord', subtitle: 'Open in Parachord to listen.' };
  }
  if (pathname === '/listen-along') {
    return { title: 'Listen Along', subtitle: 'Join the listening session in Parachord.' };
  }
  if (pathname === '/import') {
    return { title: 'Import to Parachord', subtitle: 'Open Parachord to import this playlist.' };
  }
  if (pathname.startsWith('/queue/')) {
    return { title: 'Add to Queue', subtitle: 'Open Parachord to queue this.' };
  }
  if (pathname.startsWith('/control/')) {
    return { title: 'Control Parachord', subtitle: 'Open Parachord to send this command.' };
  }
  if (pathname.startsWith('/shuffle/')) {
    return { title: 'Shuffle in Parachord', subtitle: 'Open Parachord to start shuffling.' };
  }
  if (pathname.startsWith('/volume/')) {
    return { title: 'Set Volume', subtitle: 'Open Parachord to adjust playback.' };
  }
  if (pathname.startsWith('/friend/')) {
    const name = pathname.split('/')[2] || '';
    return { title: name ? `${name} on Parachord` : 'Friend on Parachord', subtitle: 'Open Parachord to view this friend.' };
  }
  return { title: 'Open in Parachord', subtitle: 'Tap to open Parachord.' };
}

export function renderTemplateB({ pathname, query, deepLink, cta, canonicalUrl, coverArtUrl }) {
  const { title, subtitle } = copyFor(pathname, query);
  const safeImg = coverArtUrl && /^https:\/\//i.test(coverArtUrl) ? escapeHtml(coverArtUrl) : null;
  const hero = safeImg
    ? `<div class="hero"><img src="${safeImg}" alt=""></div>`
    : `<div class="hero"></div>`;
  return renderShell({
    title, subtitle, deepLink, cta, canonicalUrl,
    ogImage: safeImg ? coverArtUrl : 'https://parachord.com/assets/home.png',
    hero
  });
}
