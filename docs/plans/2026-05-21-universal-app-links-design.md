# Universal Links / App Links — Website-Side Design

**Issue:** [Parachord/parachord-website#78](https://github.com/Parachord/parachord-website/issues/78)
**Date:** 2026-05-21
**Status:** Design approved; implementation pending

## Summary

Serve the three deliverables in #78 — `assetlinks.json`, `apple-app-site-association`, and HTML fallback pages for the universal-link verb paths — from a Cloudflare Worker that fronts `parachord.com`. GitHub Pages keeps serving the marketing site; the Worker intercepts only the well-known files and the verb routes and passes everything else through.

## Architecture

A single Cloudflare Worker bound to `parachord.com/*`:

1. Matches `/.well-known/assetlinks.json` and `/.well-known/apple-app-site-association` → serves inline JSON with correct content-type.
2. Matches the universal-link verb paths from #78's AASA `components` → renders an install-pitch HTML page server-side, with cover-art resolution and OS-routed CTAs.
3. Everything else → `fetch()` passthrough to `parachord.github.io` (the GH Pages origin). Marketing site, blog, assets all served unchanged.

**Prerequisite, separate change:** move `parachord.com` zone from Namecheap nameservers to Cloudflare. Required for the Worker route to attach. Park GH Pages A records identically before flipping.

## Repo layout

New top-level `worker/` directory inside `parachord-website`:

```
parachord-website/
└── worker/
    ├── wrangler.toml         # name=parachord-edge, routes=parachord.com/*
    ├── src/
    │   ├── index.js          # router: well-known | verbs | passthrough
    │   ├── well-known.js     # serves assetlinks.json + AASA inline
    │   ├── fallback.js       # dynamic verb pages
    │   ├── enrich.js         # cover-art resolution (port from smart-links)
    │   └── ua.js             # user-agent → store URL routing
    ├── static/
    └── package.json
```

Deploys via `wrangler` GitHub Action on push to `main`.

## Deliverable 1 — `assetlinks.json`

Inline JS module constant. Two entries (release + debug package names) with placeholder SHA-256 fingerprints until [Parachord/parachord-android#123](https://github.com/Parachord/parachord-android/issues/123) delivers real values. Top-of-file comment captures provenance.

Response headers:

```
Content-Type: application/json
Cache-Control: public, max-age=3600
```

200, no redirect, no auth. Verified via the Google Digital Asset Links API.

## Deliverable 2 — `apple-app-site-association`

Inline. The Worker matches the path string `/.well-known/apple-app-site-association` exactly — no file-extension routing. Apple is strict about this.

Ships with `appIDs: []` and the full `components` array from #78. Populate `appIDs` once [Parachord/parachord-android#124](https://github.com/Parachord/parachord-android/issues/124) provides `<TEAM_ID>.com.parachord.ios`.

Response headers:

```
Content-Type: application/json
Cache-Control: public, max-age=3600
```

200, no redirect. Note: Apple's CDN caches ~24h after first fetch; plan AASA edits accordingly.

## Deliverable 3 — Fallback verb pages

### Dispatch table

| Template | Verbs | Behavior |
|---|---|---|
| A — generic | `/home`, `/library*`, `/history*`, `/charts`, `/critics-picks`, `/playlists`, `/recommendations*`, `/settings*`, `/chat`, `/search` | Wordmark + "Open Parachord" hero, no cover art lookup |
| B — verb-with-query | `/play`, `/listen-along`, `/import`, `/queue/*`, `/control/*`, `/shuffle/*`, `/volume/*`, `/friend/*` | Reads query (`artist`, `title`, `mbid`, `url`), renders context line. Cover art if resolvable. |
| C — entity | `/artist/:name`, `/album/:id`, `/playlist/:id`, `/play/:trackid` | Full-bleed cover art hero, entity title/subtitle, CTA |

Paths match #78's AASA `components` list one-to-one.

### Cover-art resolution

Ported from `smart-links/lib/enrich.js`:

1. Direct lookup if `mbid` or Spotify ID present in path/query.
2. Spotify search via Client Credentials (env: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`).
3. MusicBrainz → Cover Art Archive.
4. Fallback gradient + wordmark.

Server-side fetch in the Worker; result inlined in HTML. `waitUntil` for any background cache writes. Failures degrade silently to the gradient.

### CTA routing by user-agent

- `Android` → `https://play.google.com/store/apps/details?id=com.parachord.android&referrer=<urlencoded parachord:// URL>`. Coordinate with #123 that `DeepLinkHandler` consumes the `referrer` param on first install.
- `iPhone|iPad|iPod` → `https://parachord.com/apps` (placeholder until iOS App Store URL exists).
- else → `https://parachord.com/apps`.

### `parachord://` auto-trigger

Each page emits `<a id="open" href="parachord://<reconstructed>" hidden>` plus a `setTimeout(() => location.href = '...', 50)` script. Catches the installed-but-OS-skipped-the-route edge case. Non-installed users see the visible install pitch (already rendered).

### URL reconstruction

Same shape on both sides. `https://parachord.com/<verb>[/<sub>]?<query>` → `parachord://<verb>[/<sub>]?<query>`. No transformation. Mirrors Android's `parseParachordHttps` from #123.

### Caching

- Templates A and B: `public, max-age=600, stale-while-revalidate=3600`.
- Template C with resolved cover art: `public, max-age=86400, stale-while-revalidate=604800`. Cache key includes full query string.

## Rollout

1. Land Worker code in a branch under `parachord-website/worker/`. Deploy to `*.workers.dev` preview — no route claimed.
2. Verify preview: curl well-known URLs, snapshot a few verb pages, manually JSON-parse the Digital Asset Links file.
3. DNS migration (separate PR coordination): move `parachord.com` to Cloudflare nameservers. Park GH Pages A records. Confirm marketing site still serves.
4. Add Worker route `parachord.com/*`. Re-run Google's verifier against the live domain.
5. Comment on #123 with the live `assetlinks.json` URL so Android can flip `autoVerify="true"`.

## Verification

```bash
curl -sI https://parachord.com/.well-known/assetlinks.json
curl -sI https://parachord.com/.well-known/apple-app-site-association
curl -s 'https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://parachord.com&relation=delegate_permission/common.handle_all_urls'
curl -s 'https://parachord.com/play?artist=Radiohead&title=Karma+Police' | grep -E 'og:image|parachord://'
```

Plus manual: tap a `https://parachord.com/play?...` link from Gmail on an Android phone with the app installed → app opens directly.

## Coordination items

- **#123 Android — SHA-256 fingerprints.** Ship with placeholders + TODO; swap inline once delivered.
- **#124 iOS — team-prefixed bundle ID.** AASA `appIDs` stays `[]` until then.
- **`referrer` consumption on first install.** Confirm `DeepLinkHandler` reads the Play Store `referrer` param. If not, file as Android follow-up.
- **DNS migration.** Separate work item, must precede route attachment. Lower TTL 48h prior to cutover.

## Out of scope (YAGNI)

- Edge analytics / view counting on verb pages.
- Catch-all `/[...]` install pitch for unknown paths — only listed verbs get fallback pages; unknown paths pass through to GH Pages.
- Spotify enrichment for verbs without artist/title metadata (e.g. `/control/play`).
