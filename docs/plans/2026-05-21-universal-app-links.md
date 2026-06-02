# Universal / App Links Worker — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a Cloudflare Worker that serves `/.well-known/assetlinks.json`, `/.well-known/apple-app-site-association`, and HTML fallback pages for the universal-link verb routes on `parachord.com`, with everything else passing through to GitHub Pages.

**Architecture:** Single Worker bound to `parachord.com/*`. Top-level router classifies each request into well-known / verb-page / passthrough. Verb pages render server-side with cover-art lookup (Spotify → MusicBrainz/CAA → fallback gradient). GH Pages remains the origin for the marketing site. DNS migration to Cloudflare is a separate prerequisite tracked in the design doc, not this plan.

**Tech Stack:** Cloudflare Workers (not Pages — we need `routes` on an existing domain), `wrangler` v4, `vitest` + `@cloudflare/vitest-pool-workers` for tests. Plain JS modules, no framework — kept lean to match the smart-links repo's style.

**Design doc:** `docs/plans/2026-05-21-universal-app-links-design.md`. Read it before starting.

**Issues:** [parachord-website#78](https://github.com/Parachord/parachord-website/issues/78), [parachord-mobile#123](https://github.com/Parachord/parachord-mobile/issues/123).

---

## Conventions used throughout this plan

- All paths are relative to the repo root (`/Users/jherskowitz/Development/parachord/parachord-website`).
- All Worker code lives under `worker/`. All tests live under `worker/test/`.
- Test runner: `cd worker && npx vitest run <file>`.
- Each task ends with a commit on `feat/universal-app-links`.
- Commit subjects follow the existing repo style: lowercase area prefix, e.g. `worker: add URL reconstruction helper`.
- The `parachord://` URL we generate must be byte-identical to what Android's `parseParachordHttps` (in [parachord-mobile#123](https://github.com/Parachord/parachord-mobile/issues/123)) accepts. When in doubt, copy/paste the AASA `components` list and Android intent-filter paths verbatim and test against both.

---

## Task 1: Scaffold the Worker project

**Files:**
- Create: `worker/wrangler.toml`
- Create: `worker/package.json`
- Create: `worker/vitest.config.js`
- Create: `worker/src/index.js`
- Create: `worker/test/smoke.test.js`
- Create: `worker/.gitignore`

**Step 1: Write the failing smoke test**

`worker/test/smoke.test.js`:

```js
import { describe, it, expect } from 'vitest';
import worker from '../src/index.js';

describe('worker smoke', () => {
  it('responds 200 with body for any GET', async () => {
    const req = new Request('https://parachord.com/');
    const resp = await worker.fetch(req, {}, { waitUntil: () => {}, passThroughOnException: () => {} });
    expect(resp.status).toBe(200);
  });
});
```

**Step 2: Create supporting files**

`worker/package.json`:

```json
{
  "name": "parachord-edge",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest run"
  },
  "devDependencies": {
    "@cloudflare/vitest-pool-workers": "^0.5.0",
    "vitest": "^2.0.0",
    "wrangler": "^4.0.0"
  }
}
```

`worker/wrangler.toml`:

```toml
name = "parachord-edge"
main = "src/index.js"
compatibility_date = "2026-01-01"

# Route is commented out until DNS migration is done. Uncomment in the
# deploy PR that flips the cutover.
# routes = [
#   { pattern = "parachord.com/*", zone_name = "parachord.com" }
# ]

[vars]
# Public, non-secret defaults. Secrets go via `wrangler secret put`.
GH_PAGES_ORIGIN = "https://parachord.github.io"
```

`worker/vitest.config.js`:

```js
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' }
      }
    }
  }
});
```

`worker/.gitignore`:

```
node_modules/
.wrangler/
dist/
```

**Step 3: Minimal Worker that passes the smoke test**

`worker/src/index.js`:

```js
export default {
  async fetch(request, env, ctx) {
    return new Response('parachord-edge', { status: 200 });
  }
};
```

**Step 4: Install + run test**

```bash
cd worker && npm install
npx vitest run test/smoke.test.js
```

Expected: 1 passing test.

**Step 5: Commit**

```bash
git add worker/
git commit -m "worker: scaffold cloudflare worker project"
```

---

## Task 2: URL reconstruction helper (HTTPS → parachord://)

**Files:**
- Create: `worker/src/reconstruct.js`
- Create: `worker/test/reconstruct.test.js`

**Why this first:** It's a pure function with zero deps and we use it from every verb-page handler. Easiest TDD target. The contract must match Android's `parseParachordHttps`.

**Step 1: Write the failing tests**

`worker/test/reconstruct.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { reconstructDeepLink } from '../src/reconstruct.js';

describe('reconstructDeepLink', () => {
  it('strips host and prefixes parachord://', () => {
    const url = new URL('https://parachord.com/play?artist=Radiohead&title=Karma+Police');
    expect(reconstructDeepLink(url)).toBe('parachord://play?artist=Radiohead&title=Karma+Police');
  });

  it('preserves nested path segments', () => {
    const url = new URL('https://parachord.com/artist/radiohead');
    expect(reconstructDeepLink(url)).toBe('parachord://artist/radiohead');
  });

  it('handles paths with no query', () => {
    const url = new URL('https://parachord.com/home');
    expect(reconstructDeepLink(url)).toBe('parachord://home');
  });

  it('preserves multiple query params and special chars', () => {
    const url = new URL('https://parachord.com/chat?prompt=hello%20world&from=share');
    expect(reconstructDeepLink(url)).toBe('parachord://chat?prompt=hello%20world&from=share');
  });

  it('drops leading slash from path', () => {
    const url = new URL('https://parachord.com/play/abc123');
    expect(reconstructDeepLink(url)).toBe('parachord://play/abc123');
  });
});
```

**Step 2: Run, expect failure**

```bash
cd worker && npx vitest run test/reconstruct.test.js
```

Expected: all 5 fail with "reconstructDeepLink not exported".

**Step 3: Implement**

`worker/src/reconstruct.js`:

```js
export function reconstructDeepLink(url) {
  const pathAndQuery = url.pathname.replace(/^\//, '') + url.search;
  return `parachord://${pathAndQuery}`;
}
```

**Step 4: Run, expect pass**

Expected: 5 passing.

**Step 5: Commit**

```bash
git add worker/src/reconstruct.js worker/test/reconstruct.test.js
git commit -m "worker: add HTTPS→parachord:// reconstruction helper"
```

---

## Task 3: assetlinks.json handler

**Files:**
- Create: `worker/src/well-known.js`
- Create: `worker/test/well-known.test.js`

**Step 1: Write the failing tests**

`worker/test/well-known.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { handleAssetLinks } from '../src/well-known.js';

describe('handleAssetLinks', () => {
  it('returns 200 with application/json', async () => {
    const resp = handleAssetLinks();
    expect(resp.status).toBe(200);
    expect(resp.headers.get('content-type')).toMatch(/^application\/json/);
  });

  it('declares both release and debug package names', async () => {
    const resp = handleAssetLinks();
    const body = await resp.json();
    const pkgs = body.map(entry => entry.target.package_name);
    expect(pkgs).toContain('com.parachord.android');
    expect(pkgs).toContain('com.parachord.android.debug');
  });

  it('every entry uses handle_all_urls relation', async () => {
    const resp = handleAssetLinks();
    const body = await resp.json();
    for (const entry of body) {
      expect(entry.relation).toEqual(['delegate_permission/common.handle_all_urls']);
      expect(entry.target.namespace).toBe('android_app');
      expect(Array.isArray(entry.target.sha256_cert_fingerprints)).toBe(true);
      expect(entry.target.sha256_cert_fingerprints.length).toBeGreaterThan(0);
    }
  });

  it('sets a 1-hour cache header', () => {
    const resp = handleAssetLinks();
    expect(resp.headers.get('cache-control')).toBe('public, max-age=3600');
  });
});
```

**Step 2: Run, expect failure**

**Step 3: Implement**

`worker/src/well-known.js`:

```js
// SHA-256 fingerprints are PLACEHOLDERS. Real values come from
// https://github.com/Parachord/parachord-mobile/issues/123.
// They are not secrets — every release APK exposes them — so they live
// in source. Swap inline and redeploy once #123 delivers them.
const ASSETLINKS = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.parachord.android',
      sha256_cert_fingerprints: ['REPLACE_WITH_RELEASE_SHA256_FROM_ISSUE_123']
    }
  },
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.parachord.android.debug',
      sha256_cert_fingerprints: ['REPLACE_WITH_DEBUG_SHA256_FROM_ISSUE_123']
    }
  }
];

export function handleAssetLinks() {
  return new Response(JSON.stringify(ASSETLINKS, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
```

**Step 4: Run, expect pass**

**Step 5: Commit**

```bash
git add worker/src/well-known.js worker/test/well-known.test.js
git commit -m "worker: serve /.well-known/assetlinks.json with placeholder fingerprints"
```

---

## Task 4: apple-app-site-association handler

**Files:**
- Modify: `worker/src/well-known.js`
- Modify: `worker/test/well-known.test.js`

**Step 1: Add failing tests for AASA**

Append to `worker/test/well-known.test.js`:

```js
import { handleAasa } from '../src/well-known.js';

describe('handleAasa', () => {
  it('returns 200 with application/json', async () => {
    const resp = handleAasa();
    expect(resp.status).toBe(200);
    expect(resp.headers.get('content-type')).toMatch(/^application\/json/);
  });

  it('ships with empty appIDs until iOS lands', async () => {
    const resp = handleAasa();
    const body = await resp.json();
    expect(body.applinks.details[0].appIDs).toEqual([]);
  });

  it('declares every verb from issue #78 components list', async () => {
    const resp = handleAasa();
    const body = await resp.json();
    const components = body.applinks.details[0].components;
    const pathsDeclared = components.map(c => c['/']);
    const expectedPaths = [
      '/play', '/play/*', '/listen-along', '/import',
      '/queue/*', '/control/*', '/shuffle/*', '/volume/*',
      '/artist/*', '/album/*', '/playlist/*', '/library*', '/history*',
      '/friend/*', '/recommendations*', '/playlists', '/charts', '/critics-picks',
      '/settings*', '/search', '/chat', '/home'
    ];
    for (const p of expectedPaths) expect(pathsDeclared).toContain(p);
  });

  it('sets cache header', () => {
    const resp = handleAasa();
    expect(resp.headers.get('cache-control')).toBe('public, max-age=3600');
  });
});
```

**Step 2: Run, expect failure**

**Step 3: Implement**

Append to `worker/src/well-known.js`:

```js
const AASA = {
  applinks: {
    details: [
      {
        // appIDs stays empty until parachord-mobile#124 (iOS) lands.
        appIDs: [],
        components: [
          { '/': '/play',           '?': { '*': '*' } },
          { '/': '/play/*' },
          { '/': '/listen-along',   '?': { '*': '*' } },
          { '/': '/import',         '?': { '*': '*' } },
          { '/': '/queue/*' },
          { '/': '/control/*' },
          { '/': '/shuffle/*' },
          { '/': '/volume/*' },
          { '/': '/artist/*' },
          { '/': '/album/*' },
          { '/': '/playlist/*' },
          { '/': '/library*' },
          { '/': '/history*' },
          { '/': '/friend/*' },
          { '/': '/recommendations*' },
          { '/': '/playlists' },
          { '/': '/charts' },
          { '/': '/critics-picks' },
          { '/': '/settings*' },
          { '/': '/search',         '?': { '*': '*' } },
          { '/': '/chat',           '?': { '*': '*' } },
          { '/': '/home' }
        ]
      }
    ]
  }
};

export function handleAasa() {
  return new Response(JSON.stringify(AASA, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
```

**Step 4: Run, expect pass**

**Step 5: Commit**

```bash
git add worker/src/well-known.js worker/test/well-known.test.js
git commit -m "worker: serve /.well-known/apple-app-site-association with empty appIDs"
```

---

## Task 5: Path → template classifier

**Files:**
- Create: `worker/src/dispatch.js`
- Create: `worker/test/dispatch.test.js`

**Why this matters:** Every verb-page request hits this. Wrong classification = wrong template = wrong CTA. Test exhaustively against the full AASA components list.

**Step 1: Write the failing tests**

`worker/test/dispatch.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { classifyPath } from '../src/dispatch.js';

describe('classifyPath', () => {
  // Template A — generic
  it.each([
    '/home', '/library', '/library/saved',
    '/history', '/charts', '/critics-picks',
    '/playlists', '/recommendations', '/settings', '/settings/account',
    '/chat', '/search'
  ])('classifies %s as template A', (p) => {
    expect(classifyPath(p)).toBe('A');
  });

  // Template B — verb-with-query
  it.each([
    '/play', '/listen-along', '/import',
    '/queue/foo', '/control/play', '/shuffle/on', '/volume/50',
    '/friend/jess'
  ])('classifies %s as template B', (p) => {
    expect(classifyPath(p)).toBe('B');
  });

  // Template C — entity
  it.each([
    '/artist/radiohead', '/album/abc', '/playlist/xyz',
    '/play/track-id-123'
  ])('classifies %s as template C', (p) => {
    expect(classifyPath(p)).toBe('C');
  });

  // Passthrough — anything not on the list
  it.each([
    '/', '/blog/2026/05/foo/', '/assets/home.png',
    '/post-that-doesnt-exist'
  ])('classifies %s as passthrough', (p) => {
    expect(classifyPath(p)).toBe('passthrough');
  });
});
```

**Step 2: Run, expect failure**

**Step 3: Implement**

`worker/src/dispatch.js`:

```js
// Order matters: more-specific patterns must come before less-specific ones.
// Each entry: [pattern, template]. Pattern is either an exact string or a RegExp.
const ROUTES = [
  // Template C — entity (with sub-path)
  [/^\/artist\/[^/]+/,    'C'],
  [/^\/album\/[^/]+/,     'C'],
  [/^\/playlist\/[^/]+/,  'C'],
  [/^\/play\/[^/]+/,      'C'],

  // Template B — verb-with-query (with sub-path)
  [/^\/queue\/.+/,        'B'],
  [/^\/control\/.+/,      'B'],
  [/^\/shuffle\/.+/,      'B'],
  [/^\/volume\/.+/,       'B'],
  [/^\/friend\/.+/,       'B'],

  // Template B — bare verbs
  ['/play',               'B'],
  ['/listen-along',       'B'],
  ['/import',             'B'],

  // Template A — generic (with optional sub-path)
  [/^\/library(\/.*)?$/,         'A'],
  [/^\/history(\/.*)?$/,         'A'],
  [/^\/recommendations(\/.*)?$/, 'A'],
  [/^\/settings(\/.*)?$/,        'A'],
  ['/home',                      'A'],
  ['/charts',                    'A'],
  ['/critics-picks',             'A'],
  ['/playlists',                 'A'],
  ['/search',                    'A'],
  ['/chat',                      'A'],
];

export function classifyPath(pathname) {
  for (const [pattern, template] of ROUTES) {
    if (typeof pattern === 'string') {
      if (pathname === pattern) return template;
    } else if (pattern.test(pathname)) {
      return template;
    }
  }
  return 'passthrough';
}
```

**Step 4: Run, expect pass**

**Step 5: Commit**

```bash
git add worker/src/dispatch.js worker/test/dispatch.test.js
git commit -m "worker: classify request paths into template/passthrough buckets"
```

---

## Task 6: User-agent → store CTA helper

**Files:**
- Create: `worker/src/ua.js`
- Create: `worker/test/ua.test.js`

**Step 1: Write the failing tests**

`worker/test/ua.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { storeCtaForUserAgent } from '../src/ua.js';

const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36';
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15';
const DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15';

describe('storeCtaForUserAgent', () => {
  it('routes Android to Play Store with referrer', () => {
    const cta = storeCtaForUserAgent(ANDROID_UA, 'parachord://play?title=X');
    expect(cta.href).toMatch(/^https:\/\/play\.google\.com\/store\/apps\/details/);
    expect(cta.href).toContain('id=com.parachord.android');
    expect(cta.href).toContain('referrer=');
    expect(decodeURIComponent(cta.href.split('referrer=')[1])).toBe('parachord://play?title=X');
    expect(cta.label).toMatch(/Get Parachord/i);
  });

  it('routes iOS to /apps placeholder until App Store URL exists', () => {
    const cta = storeCtaForUserAgent(IOS_UA, 'parachord://play');
    expect(cta.href).toBe('https://parachord.com/apps');
  });

  it('routes desktop to /apps', () => {
    const cta = storeCtaForUserAgent(DESKTOP_UA, 'parachord://play');
    expect(cta.href).toBe('https://parachord.com/apps');
  });

  it('handles missing UA gracefully', () => {
    const cta = storeCtaForUserAgent('', 'parachord://play');
    expect(cta.href).toBe('https://parachord.com/apps');
  });

  it('handles iPad', () => {
    const ipad = 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X)';
    expect(storeCtaForUserAgent(ipad, 'parachord://play').href).toBe('https://parachord.com/apps');
  });
});
```

**Step 2: Run, expect failure**

**Step 3: Implement**

`worker/src/ua.js`:

```js
const PLAY_STORE = 'https://play.google.com/store/apps/details';
const ANDROID_PACKAGE = 'com.parachord.android';
const FALLBACK = 'https://parachord.com/apps';

export function storeCtaForUserAgent(ua, deepLink) {
  if (ua && /Android/i.test(ua)) {
    const referrer = encodeURIComponent(deepLink);
    return {
      href: `${PLAY_STORE}?id=${ANDROID_PACKAGE}&referrer=${referrer}`,
      label: 'Get Parachord on Google Play'
    };
  }
  // iOS, desktop, unknown — all land on /apps until iOS App Store URL exists.
  return { href: FALLBACK, label: 'Get Parachord' };
}
```

**Step 4: Run, expect pass**

**Step 5: Commit**

```bash
git add worker/src/ua.js worker/test/ua.test.js
git commit -m "worker: route store CTA by user-agent with Android referrer"
```

---

## Task 7: Shared render shell (HTML scaffold)

**Files:**
- Create: `worker/src/render.js`
- Create: `worker/test/render.test.js`

**Why a shell first:** Templates A/B/C all need the same `<head>`, OG tags, auto-trigger script, and CTA button. Build the shared scaffold once, then templates fill in title/subtitle/hero.

**Step 1: Write the failing tests**

`worker/test/render.test.js`:

```js
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
```

**Step 2: Run, expect failure**

**Step 3: Implement**

`worker/src/render.js`:

```js
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderShell({ title, subtitle, deepLink, cta, canonicalUrl, ogImage, hero }) {
  const t = escapeHtml(title);
  const s = escapeHtml(subtitle);
  const link = escapeHtml(deepLink);
  const ctaHref = escapeHtml(cta.href);
  const ctaLabel = escapeHtml(cta.label);
  const url = escapeHtml(canonicalUrl);
  const img = escapeHtml(ogImage);
  const heroBlock = hero || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t}</title>
<meta name="description" content="${s}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${s}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${img}">
<link rel="icon" type="image/png" href="/assets/icon128.png">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0a0a0a;color:#f5f5f5;font-family:'DM Sans',-apple-system,sans-serif;
       min-height:100vh;display:flex;align-items:center;justify-content:center}
  .c{text-align:center;max-width:480px;padding:48px 24px}
  .hero{width:240px;height:240px;margin:0 auto 24px;border-radius:16px;
        background:linear-gradient(135deg,#8b5cf6,#ec4899,#f97316);
        display:flex;align-items:center;justify-content:center;overflow:hidden}
  .hero img{width:100%;height:100%;object-fit:cover}
  h1{font-size:24px;font-weight:700;margin-bottom:12px}
  .sub{color:rgba(255,255,255,0.6);font-size:15px;margin-bottom:32px;line-height:1.5}
  .cta{display:inline-block;background:linear-gradient(135deg,#8b5cf6,#ec4899,#f97316);
       color:#fff;font-weight:700;font-size:16px;padding:14px 36px;border-radius:50px;
       text-decoration:none}
  .alt{display:block;margin-top:20px;color:rgba(255,255,255,0.5);font-size:13px;text-decoration:none}
</style>
</head>
<body>
<div class="c">
  ${heroBlock}
  <h1>${t}</h1>
  <p class="sub">${s}</p>
  <a id="open" href="${link}" hidden></a>
  <a href="${ctaHref}" class="cta">${ctaLabel}</a>
  <a href="parachord://" class="alt">Already have Parachord? Open it</a>
</div>
<script>setTimeout(function(){location.href=${JSON.stringify(deepLink)}},50);</script>
</body>
</html>`;
}
```

**Step 4: Run, expect pass**

**Step 5: Commit**

```bash
git add worker/src/render.js worker/test/render.test.js
git commit -m "worker: shared HTML render shell with XSS-safe escaping"
```

---

## Task 8: Template A renderer (generic verbs)

**Files:**
- Create: `worker/src/templates/templateA.js`
- Create: `worker/test/templateA.test.js`

**Step 1: Write the failing tests**

`worker/test/templateA.test.js`:

```js
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
```

**Step 2: Run, expect failure**

**Step 3: Implement**

`worker/src/templates/templateA.js`:

```js
import { renderShell } from '../render.js';

const COPY = {
  '/home':          { title: 'Open Parachord',         subtitle: 'Your home in Parachord.' },
  '/charts':        { title: 'Open the Charts',        subtitle: 'See what\'s trending in Parachord.' },
  '/critics-picks': { title: 'Critics\' Picks',         subtitle: 'Hand-picked albums in Parachord.' },
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
```

**Step 4: Run, expect pass**

**Step 5: Commit**

```bash
git add worker/src/templates/templateA.js worker/test/templateA.test.js
git commit -m "worker: template A — generic verb pages"
```

---

## Task 9: Template B renderer (verb + query)

**Files:**
- Create: `worker/src/templates/templateB.js`
- Create: `worker/test/templateB.test.js`

**Step 1: Write the failing tests**

`worker/test/templateB.test.js`:

```js
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
```

**Step 2: Run, expect failure**

**Step 3: Implement**

`worker/src/templates/templateB.js`:

```js
import { renderShell } from '../render.js';

function copyFor(pathname, query) {
  const t = query.title;
  const a = query.artist;

  if (pathname === '/play') {
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
  const hero = coverArtUrl
    ? `<div class="hero"><img src="${coverArtUrl.replace(/"/g, '&quot;')}" alt=""></div>`
    : `<div class="hero"></div>`;
  return renderShell({
    title, subtitle, deepLink, cta, canonicalUrl,
    ogImage: coverArtUrl || 'https://parachord.com/assets/home.png',
    hero
  });
}
```

**Step 4: Run, expect pass**

**Step 5: Commit**

```bash
git add worker/src/templates/templateB.js worker/test/templateB.test.js
git commit -m "worker: template B — verb-with-query pages"
```

---

## Task 10: Template C renderer (entity pages)

**Files:**
- Create: `worker/src/templates/templateC.js`
- Create: `worker/test/templateC.test.js`

Mirror Task 9's shape. Tests assert:
- `/artist/radiohead` renders with `Radiohead` as the entity name (decoded from path segment).
- `/album/{id}` and `/playlist/{id}` render generic "Album in Parachord" / "Playlist in Parachord" when no name is supplied; if `name` query is present, use it.
- `/play/{trackid}` falls back to generic copy unless `title`+`artist` query are also present.
- Cover art renders when provided.

Implementation: same pattern as Template B but with entity-specific copy strings. Skipped here for brevity — follow Task 9's structure.

**Commit:** `worker: template C — entity pages`

---

## Task 11: Port cover-art enrichment from smart-links

**Files:**
- Create: `worker/src/enrich.js`
- Create: `worker/test/enrich.test.js`

**Source:** `~/Development/parachord/parachord-desktop/smart-links/lib/enrich.js`. Copy, don't symlink — different deploys.

**What to port:**
- `getSpotifyToken(env)` — Client Credentials cache + fetch.
- `searchSpotify(query, token)` — `/v1/search`, returns first track's `album.images[0].url`.
- `searchItunes(query)` — iTunes Search API (no auth).
- `searchMusicBrainz(query)` + Cover Art Archive fallback — if not in smart-links, add per design doc.

**What to add:** a single public `resolveCoverArt({ artist, title, mbid, env })` that runs the lookups in order and returns the first image URL or `null`.

**Step 1: Write failing tests using `vi.mock` for fetch**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveCoverArt } from '../src/enrich.js';

const env = { SPOTIFY_CLIENT_ID: 'id', SPOTIFY_CLIENT_SECRET: 'sec' };

describe('resolveCoverArt', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns null when no metadata provided', async () => {
    expect(await resolveCoverArt({ env })).toBeNull();
  });

  it('returns null when env has no Spotify creds and no other source matches', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
    const r = await resolveCoverArt({ artist: 'X', title: 'Y', env: {} });
    expect(r).toBeNull();
  });

  it('returns Spotify image when available', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (String(url).includes('accounts.spotify.com')) {
        return new Response(JSON.stringify({ access_token: 't', expires_in: 3600 }), { status: 200 });
      }
      if (String(url).includes('api.spotify.com')) {
        return new Response(JSON.stringify({
          tracks: { items: [{ album: { images: [{ url: 'https://i.scdn.co/abc.jpg' }] } }] }
        }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    }));
    const r = await resolveCoverArt({ artist: 'X', title: 'Y', env });
    expect(r).toBe('https://i.scdn.co/abc.jpg');
  });

  it('falls back to iTunes when Spotify yields nothing', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (String(url).includes('accounts.spotify.com')) {
        return new Response(JSON.stringify({ access_token: 't', expires_in: 3600 }), { status: 200 });
      }
      if (String(url).includes('api.spotify.com')) {
        return new Response(JSON.stringify({ tracks: { items: [] } }), { status: 200 });
      }
      if (String(url).includes('itunes.apple.com')) {
        return new Response(JSON.stringify({
          results: [{ artworkUrl100: 'https://is1-ssl.mzstatic.com/abc/100x100bb.jpg' }]
        }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    }));
    const r = await resolveCoverArt({ artist: 'X', title: 'Y', env });
    // Upgrade 100x100 → 600x600 if your port does that; otherwise compare to 100x100
    expect(r).toContain('mzstatic.com');
  });
});
```

**Step 2-4: Run, port code, pass.**

The full port is large. Start by copying `smart-links/lib/enrich.js` verbatim, then refactor exports to expose only `resolveCoverArt`. Strip enrichment of fields you don't need here (this Worker only needs the cover image URL, not full service-URL maps).

**Step 5: Commit**

```bash
git add worker/src/enrich.js worker/test/enrich.test.js
git commit -m "worker: port cover-art resolver from smart-links"
```

---

## Task 12: Top-level router + integration with handlers

**Files:**
- Modify: `worker/src/index.js`
- Create: `worker/test/router.test.js`

**Step 1: Write the failing integration tests**

```js
import { describe, it, expect } from 'vitest';
import worker from '../src/index.js';

const ctx = { waitUntil: () => {}, passThroughOnException: () => {} };
const env = { GH_PAGES_ORIGIN: 'https://parachord.github.io' };

async function get(url, headers = {}) {
  return worker.fetch(new Request(url, { headers }), env, ctx);
}

describe('router', () => {
  it('serves assetlinks.json with application/json', async () => {
    const r = await get('https://parachord.com/.well-known/assetlinks.json');
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toMatch(/^application\/json/);
    const body = await r.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('serves apple-app-site-association at extensionless path', async () => {
    const r = await get('https://parachord.com/.well-known/apple-app-site-association');
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toMatch(/^application\/json/);
  });

  it('serves template A for /home', async () => {
    const r = await get('https://parachord.com/home', { 'user-agent': 'Mozilla/5.0' });
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toMatch(/^text\/html/);
    const body = await r.text();
    expect(body).toContain('parachord://home');
  });

  it('serves template B for /play with query', async () => {
    const r = await get('https://parachord.com/play?artist=Radiohead&title=Karma+Police');
    expect(r.status).toBe(200);
    const body = await r.text();
    expect(body).toContain('Radiohead');
    expect(body).toContain('Karma Police');
  });

  it('passes /blog/foo through to GH Pages origin', async () => {
    // Mock the origin fetch
    const original = globalThis.fetch;
    globalThis.fetch = async (req) => {
      if (String(req.url || req).startsWith('https://parachord.github.io')) {
        return new Response('<html>blog</html>', { status: 200, headers: { 'content-type': 'text/html' } });
      }
      return original(req);
    };
    try {
      const r = await get('https://parachord.com/blog/foo');
      expect(r.status).toBe(200);
      expect(await r.text()).toContain('blog');
    } finally {
      globalThis.fetch = original;
    }
  });
});
```

**Step 2: Run, expect failure**

**Step 3: Implement the router**

`worker/src/index.js`:

```js
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
  const coverArtUrl = await safeCoverArt(query, env);

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
```

**Step 4: Run, expect pass**

**Step 5: Commit**

```bash
git add worker/src/index.js worker/test/router.test.js
git commit -m "worker: top-level router with template dispatch and origin passthrough"
```

---

## Task 13: Wire deploy + local-dev verification

**Files:**
- Create: `.github/workflows/worker-deploy.yml`
- Modify: `worker/wrangler.toml` (still keep `routes` commented)

**Step 1: GitHub Action**

`.github/workflows/worker-deploy.yml`:

```yaml
name: Deploy Worker
on:
  push:
    branches: [main]
    paths: ['worker/**']
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - working-directory: worker
        run: npm ci
      - working-directory: worker
        run: npx vitest run
      - working-directory: worker
        run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**Step 2: Local smoke test**

```bash
cd worker
npx wrangler dev
# In another shell:
curl -sI http://localhost:8787/.well-known/assetlinks.json
curl -sI http://localhost:8787/.well-known/apple-app-site-association
curl -s 'http://localhost:8787/play?artist=Radiohead&title=Karma+Police' | grep -E 'og:image|parachord://'
curl -s 'http://localhost:8787/home' | grep -E 'parachord://home'
```

Expected: both well-known files return 200 with `content-type: application/json`. Verb pages contain the expected deep link.

**Step 3: Commit**

```bash
git add .github/workflows/worker-deploy.yml
git commit -m "worker: github action to deploy on push to main"
```

---

## Task 14: PR + coordination

- Push `feat/universal-app-links`.
- Open PR against `main` with title: `Add Universal/App Links Worker (issue #78)`.
- Body cites #78, the design doc path, and the open coordination items from the design doc.
- Request review.
- After merge:
  - DNS migration (separate PR coordination).
  - Uncomment `routes` in `wrangler.toml`, deploy.
  - Run Google's Digital Asset Links verifier against `https://parachord.com`.
  - Comment on parachord-mobile#123 with the live URL.

---

## Out of scope (deferred)

- Edge analytics for verb pages.
- Catch-all install pitch for unknown paths.
- Spotify enrichment for verbs without `artist`+`title` query (e.g. `/control/play`).
- iOS App Store CTA — needs the App Store URL once iOS ships.

These are all called out in the design doc and #78's "out of scope" section. Do not slip them into this PR.
