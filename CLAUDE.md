# Parachord website — context for Claude

Marketing site (Jekyll on GitHub Pages, served from `main`) + a Cloudflare Worker (`worker/`) that fronts `parachord.com` for the well-known files and Universal/App Link verb routes.

## Universal/App Link URL conventions

The Worker reconstructs `parachord://` URLs from incoming HTTPS URLs by stripping the host and prefixing the scheme — same path, same query, byte-identical. So everything below works in **both** the HTTPS form (Worker renders a fallback landing page on the web) and the `parachord://` form (OS hands directly to the installed app).

### `/play/playlist?url=<third-party-url>`

Pass a third-party playlist URL via `?url=`. The Worker scrapes OG tags (or, for Achordion, calls a dedicated metadata API) to render the fallback page with title/description/cover.

**Allowlisted provider hosts** (defined in [worker/src/enrich.js](worker/src/enrich.js) `PLAYLIST_HOST_ALLOWLIST`):

| Host | Resolver |
|---|---|
| `achordion.xyz` | dedicated `/api/playlist/<mbid>/meta` endpoint (page itself is Vercel-challenge-blocked) |
| `open.spotify.com` | OG scrape |
| `music.apple.com` | OG scrape |
| `soundcloud.com` | OG scrape |
| `on.soundcloud.com` | OG scrape after redirect-follow to canonical |

**Examples** (HTTPS share URL / `parachord://` deep link the app receives):

```
https://parachord.com/play/playlist?url=https%3A%2F%2Fachordion.xyz%2Fplaylist%2F<mbid>
   → parachord://play/playlist?url=https%3A%2F%2Fachordion.xyz%2Fplaylist%2F<mbid>

https://parachord.com/play/playlist?url=https%3A%2F%2Fopen.spotify.com%2Fplaylist%2F<id>
   → parachord://play/playlist?url=https%3A%2F%2Fopen.spotify.com%2Fplaylist%2F<id>

https://parachord.com/play/playlist?url=https%3A%2F%2Fmusic.apple.com%2Fus%2Fplaylist%2F<slug>%2F<id>
   → parachord://play/playlist?url=https%3A%2F%2Fmusic.apple.com%2Fus%2Fplaylist%2F<slug>%2F<id>

https://parachord.com/play/playlist?url=https%3A%2F%2Fsoundcloud.com%2F<user>%2Fsets%2F<slug>
   → parachord://play/playlist?url=https%3A%2F%2Fsoundcloud.com%2F<user>%2Fsets%2F<slug>

https://parachord.com/play/playlist?url=https%3A%2F%2Fon.soundcloud.com%2F<short-id>
   → parachord://play/playlist?url=https%3A%2F%2Fon.soundcloud.com%2F<short-id>
```

`?url=` is single-encoded — the app gets the literal URL after one `decodeURIComponent`. `on.soundcloud.com` short links arrive at the app unresolved (the Worker only follows the redirect for *its own* metadata scrape); the app should follow the redirect itself if it needs the canonical URL.

**Adding a new provider:** add the hostname to `PLAYLIST_HOST_ALLOWLIST` and add a unit test in [worker/test/enrich.test.js](worker/test/enrich.test.js) using a mock OG-tag-shaped HTML response. Spot-check the live host first with `curl -s -A 'parachord-edge/0.1 (+https://parachord.com)' <URL> | grep -ioE '<meta[^>]+og:(title|image)[^>]*>'` — if no OG tags come back from a CF-edge-shaped request, the provider needs a custom resolver (see Achordion) or its own follow-up issue.

### `/play/<type>?mbid=<MusicBrainz-id>`

Pass a MusicBrainz ID for direct album/track/artist metadata + Cover Art Archive lookups. Bypasses Spotify/iTunes text search.

```
https://parachord.com/play/album?mbid=<release-group-mbid>
   → parachord://play/album?mbid=<release-group-mbid>

https://parachord.com/play/track?mbid=<recording-mbid>
   → parachord://play/track?mbid=<recording-mbid>

https://parachord.com/play/artist?mbid=<artist-mbid>
   → parachord://play/artist?mbid=<artist-mbid>
```

`type=album` maps to MusicBrainz's `release-group` (the abstract album concept, not a specific edition). Achordion generates release-group MBIDs when sharing an album.

### `/play?title=X&artist=Y`

Text-search fallback when no MBID is available. Spotify Client Credentials lookup, iTunes fallback. Implementation in [worker/src/enrich.js](worker/src/enrich.js) `resolveCoverArt`.

```
https://parachord.com/play?artist=Radiohead&title=Karma+Police
   → parachord://play?artist=Radiohead&title=Karma+Police
```

## The full verb / template catalog

Path classifier ([worker/src/dispatch.js](worker/src/dispatch.js)) routes incoming paths to one of three templates. AASA components match this 1:1 ([worker/src/well-known.js](worker/src/well-known.js)).

| Template | Verbs | Behavior |
|---|---|---|
| **A — generic** | `/home`, `/library*`, `/history*`, `/charts`, `/critics-picks`, `/playlists`, `/recommendations*`, `/settings*`, `/chat`, `/search` | Wordmark + "Open Parachord" hero, no cover-art lookup |
| **B — verb-with-query** | `/play`, `/listen-along`, `/import`, `/queue/*`, `/control/*`, `/shuffle/*`, `/volume/*`, `/friend/*` | Reads query (`artist`, `title`, `mbid`, `url`, `type`), renders context line. Cover art if resolvable. |
| **C — entity** | `/artist/:name`, `/album/:id`, `/playlist/:id`, `/play/:trackid` | Full-bleed cover-art hero, entity title/subtitle, CTA |

For Template B, the URL `/play/<type>?...` (e.g. `/play/album?mbid=X`) normalizes internally to `/play?type=<type>&...` — both shapes render identically.

## Worker repo layout

```
worker/
├── wrangler.toml      # routes are explicit per-verb (NOT `parachord.com/*` wildcard;
│                      # CF Workers can't override Host on outbound fetch on free tier
│                      # — wildcard would break passthrough to GH Pages).
├── src/
│   ├── index.js       # router: well-known | verbs | passthrough
│   ├── dispatch.js    # path → template (A/B/C/passthrough)
│   ├── reconstruct.js # HTTPS → parachord:// (pure)
│   ├── ua.js          # user-agent → store CTA URL
│   ├── well-known.js  # assetlinks.json + AASA (inline JSON)
│   ├── enrich.js      # cover-art + metadata resolution (Spotify/iTunes/MusicBrainz/CAA + per-provider playlist resolvers)
│   ├── render.js      # shared HTML shell with XSS-safe escaping
│   └── templates/{templateA,templateB,templateC}.js
└── test/              # vitest with @cloudflare/vitest-pool-workers
```

**Test runner:** `cd worker && npx vitest run`. **Deploy:** push to `main` triggers `.github/workflows/worker-deploy.yml` (Node 22, wrangler v4).

**Production verification pattern** (not browser-previewable — these are server-rendered HTML responses from the Worker, not Jekyll pages):

```bash
curl -s 'https://parachord.com/play?artist=X&title=Y' | grep -E '<title>|og:image|parachord://'
```

## Marketing site

Standard Jekyll on GitHub Pages, served via the Worker's passthrough for any path not matched by the well-known files or universal-link verb routes. Custom domain via CNAME file in repo root. DNS on Cloudflare (zone migrated in [#82](https://github.com/Parachord/parachord-website/issues/82)).

**Important:** the Worker route on `parachord.com` requires the apex A records to be **Proxied (orange cloud)** in Cloudflare DNS, not DNS-only. Without orange cloud, traffic resolves directly to GH Pages IPs and never traverses the CF edge — Worker routes silently don't fire.
