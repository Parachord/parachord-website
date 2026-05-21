import { handleAssetLinks, handleAasa } from './well-known.js';
import { classifyPath } from './dispatch.js';
import { reconstructDeepLink } from './reconstruct.js';
import { storeCtaForUserAgent } from './ua.js';
import { renderTemplateA } from './templates/templateA.js';
import { renderTemplateB } from './templates/templateB.js';
import { renderTemplateC } from './templates/templateC.js';
import { resolveCoverArt } from './enrich.js';

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

    // Universal-link verb routes
    const template = classifyPath(url.pathname);
    if (template !== 'passthrough') {
      return renderVerbPage(template, url, request, env);
    }

    // Everything else → GH Pages origin
    return passthrough(request, env);
  }
};

async function renderVerbPage(template, url, request, env) {
  const deepLink = reconstructDeepLink(url);
  const ua = request.headers.get('user-agent') || '';
  const cta = storeCtaForUserAgent(ua, deepLink);
  const canonicalUrl = url.toString();

  const query = Object.fromEntries(url.searchParams);
  const coverArtUrl = template === 'A' ? null : await safeCoverArt(query, env);

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
  const upstreamReq = new Request(upstream.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual'
  });
  return fetch(upstreamReq);
}
