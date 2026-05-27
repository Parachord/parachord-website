import { handleAssetLinks, handleAasa } from './well-known.js';
import { classifyPath } from './dispatch.js';
import { reconstructDeepLink } from './reconstruct.js';
import { storeCtaForUserAgent } from './ua.js';
import { renderTemplateA } from './templates/templateA.js';
import { renderTemplateB } from './templates/templateB.js';
import { renderTemplateC } from './templates/templateC.js';
import { resolveCoverArt, resolveMbid, resolvePlaylistFromUrl } from './enrich.js';

// Recognized `type` words that can appear as the path segment after /play/.
// e.g. /play/album?mbid=X normalizes to /play?type=album&mbid=X.
const PLAY_TYPE_WORDS = new Set([
  'album', 'track', 'artist', 'release', 'release-group', 'recording',
  'playlist',
]);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Well-known files first — exact-match, no normalization.
    if (url.pathname === '/.well-known/assetlinks.json') {
      return handleAssetLinks();
    }
    if (url.pathname === '/.well-known/apple-app-site-association') {
      return handleAasa();
    }

    // URL normalization: /play/<type>?... → /play?type=<type>&...
    // Lets external link-generators use either shape; both render the same.
    normalizePlayTypePath(url);

    // Universal-link verb routes
    const template = classifyPath(url.pathname);
    if (template !== 'passthrough') {
      return renderVerbPage(template, url, request, env);
    }

    // Everything else → GH Pages origin
    return passthrough(request, env);
  }
};

function normalizePlayTypePath(url) {
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length === 2 && segments[0] === 'play' && PLAY_TYPE_WORDS.has(segments[1])) {
    // Set type query param if not already present, then collapse path to /play.
    if (!url.searchParams.has('type')) {
      url.searchParams.set('type', segments[1]);
    }
    url.pathname = '/play';
  }
}

async function renderVerbPage(template, url, request, env) {
  const deepLink = reconstructDeepLink(url);
  const ua = request.headers.get('user-agent') || '';
  const cta = storeCtaForUserAgent(ua, deepLink);
  const canonicalUrl = url.toString();

  const query = Object.fromEntries(url.searchParams);

  // Metadata enrichment, in order of identifier specificity:
  // 1) ?url= for type=playlist — scrape OG tags from a known provider host
  // 2) ?mbid= — MusicBrainz lookup (covers album/track/artist)
  // 3) text search via Spotify/iTunes (artist+title)
  let coverArtUrl = null;
  if (query.type === 'playlist' && query.url && template !== 'A') {
    const playlist = await safePlaylist(query);
    if (playlist) {
      if (!query.title && playlist.title) query.title = playlist.title;
      if (!query.description && playlist.description) query.description = playlist.description;
      coverArtUrl = playlist.coverArtUrl;
    }
  }
  if (!coverArtUrl && query.mbid && template !== 'A') {
    const mbidResult = await safeMbid(query);
    if (mbidResult) {
      if (!query.artist && mbidResult.artist) query.artist = mbidResult.artist;
      if (!query.title && mbidResult.title) query.title = mbidResult.title;
      if (!query.album && mbidResult.album) query.album = mbidResult.album;
      coverArtUrl = mbidResult.coverArtUrl;
    }
  }
  if (!coverArtUrl && template !== 'A') {
    coverArtUrl = await safeCoverArt(query, env);
  }

  let html;
  if (template === 'A') {
    html = renderTemplateA({ pathname: url.pathname, deepLink, cta, canonicalUrl });
  } else if (template === 'B') {
    html = renderTemplateB({ pathname: url.pathname, query, deepLink, cta, canonicalUrl, coverArtUrl });
  } else {
    html = renderTemplateC({ pathname: url.pathname, query, deepLink, cta, canonicalUrl, coverArtUrl });
  }

  const cache = template === 'C' && coverArtUrl
    ? 'public, max-age=86400, stale-while-revalidate=604800'
    : 'public, max-age=600, stale-while-revalidate=3600';

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': cache }
  });
}

async function safeMbid(query) {
  try {
    return await resolveMbid({ mbid: query.mbid, type: query.type });
  } catch {
    return null;
  }
}

async function safePlaylist(query) {
  try {
    return await resolvePlaylistFromUrl({ url: query.url });
  } catch {
    return null;
  }
}

async function safeCoverArt(query, env) {
  try {
    return await resolveCoverArt({ artist: query.artist, title: query.title, mbid: query.mbid, env });
  } catch {
    return null;
  }
}

async function passthrough(request, env) {
  const origin = env.GH_PAGES_ORIGIN || 'https://parachord.github.io';
  const url = new URL(request.url);
  const upstream = new URL(url.pathname + url.search, origin);
  // Forwards Host: parachord.com intentionally — GH Pages routes on Host for
  // the custom-domain CNAME. Do not strip.
  const upstreamReq = new Request(upstream.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual'
  });
  return fetch(upstreamReq);
}
