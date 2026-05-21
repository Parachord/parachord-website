import { renderShell } from '../render.js';

const COPY = {
  '/home':          { title: 'Open Parachord',         subtitle: 'Your home in Parachord.' },
  '/charts':        { title: 'Open the Charts',        subtitle: "See what's trending in Parachord." },
  '/critics-picks': { title: "Critics' Picks",         subtitle: 'Hand-picked albums in Parachord.' },
  '/playlists':     { title: 'Your Playlists',          subtitle: 'Open your library in Parachord.' },
  '/library':       { title: 'Your Library',            subtitle: 'Open your library in Parachord.' },
  '/history':       { title: 'Your Listening History',  subtitle: 'Open your history in Parachord.' },
  '/recommendations': { title: 'Recommendations',       subtitle: 'Personalized picks in Parachord.' },
  '/settings':      { title: 'Parachord Settings',      subtitle: 'Open Parachord to adjust.' },
  '/chat':          { title: 'Chat in Parachord',       subtitle: 'Open Parachord to start chatting.' },
  '/search':        { title: 'Search Parachord',        subtitle: 'Open Parachord to search.' },
};

function copyFor(pathname) {
  if (COPY[pathname]) return COPY[pathname];
  // Strip sub-path: /library/saved → /library
  const root = '/' + pathname.split('/')[1];
  if (COPY[root]) return COPY[root];
  return { title: 'Open in Parachord', subtitle: 'Tap to open Parachord.' };
}

export function renderTemplateA({ pathname, deepLink, cta, canonicalUrl }) {
  const { title, subtitle } = copyFor(pathname);
  return renderShell({
    title, subtitle, deepLink, cta, canonicalUrl,
    ogImage: 'https://parachord.com/assets/home.png'
  });
}
