---
layout: post
title: "Introducing Achordion: The Missing Online Community of the Open Music Stack"
date: 2026-05-04
author: "J Herskowitz"
category: "Announcement"
---

For a while now, when I've talked about Parachord, I've described it as one half of something. The other half just shipped: it's called **Achordion**, it lives at [achordion.xyz](https://achordion.xyz), and it's the user experience I've wanted on top of ListenBrainz data since the first time I logged in.

Music discovery felt a lot more meaningful (and fun) when we weren't all trapped in our own algorithmic bubbles — locked away inside corporate silos. Achordion is part of an open community, powered by ListenBrainz, that puts listeners first — no matter how or where they listen. Connect with like-minded listeners across the globe to discover music that transcends services, platforms, and programming.

<p style="max-width: 240px; margin: 1rem auto; text-align: center;"><img src="/assets/achordion-origin-story.png" alt='A three-post Threads thread by jherskowitz: "I wish someone would build a nicer front-end for ListenBrainz so that I don''t start thinking about doing it." → "I feel like 2 whole generations are missing out on a music-source-agnostic community that gets them quantified self insights (e.g. Wrapped), recommendations, curators, discussions with anyone regardless of the only listen to Bandcamp downloads, stream from YouTube, Spotify, Tidal, Apple or anyone else. The silos have broken the promise of the social web when it comes to music fandom." → "Dammit, now I''m building it...."' style="width: 100%; display: block;"><br><em style="font-size: 0.875rem; color: #6b7280;">The Achordion origin story, captured a few days before I caved.</em></p>


## TL;DR

- **Achordion is live at [achordion.xyz](https://achordion.xyz).** Sign in with a MusicBrainz account.
- It's a modern web-based community built on MusicBrainz + ListenBrainz — listens, stats, charts, recommendations, Year in Music, friends, the whole thing.
- Every Play button hands a tracklist off to **Parachord** via `parachord://`. One click, plays from whichever service ranks highest in your priority order.
- No Achordion-side profile of you. Your listens, follows, and playlists live in your ListenBrainz account, queried live on every page view.
- It's a major step towards what I always wanted Last.fm to become, rebuilt for the streaming era on open data and no corporate overlords.
- It is also open source: [github.com/jherskowitz/achordion](https://github.com/jherskowitz/achordion).

The rest of the post is the why, the what, and how the pieces fit together.

## A Quick Bit of History

Pretty much everything I build lately has a common origin story - and this one for Achordion is no different. Twenty-five years ago, [**Last.fm**](https://last.fm) more or less invented a new sort of data-driven social music experience — a personal listening history that builds up automatically as you play — surfaced as charts, recommendations and personalized streaming radio stations - woven into a social graph of listeners with overlapping taste. It worked because the *playback* layer was wherever you were already listening: iTunes, Winamp, Foobar, plus an Audioscrobbler plugin you'd installed in whatever client. Nobody else was paying attention to that data, because pre-streaming the data lived inside everyone's local library and stayed there. Nobody was tending to it.

[**MyStrands**](https://en.wikipedia.org/wiki/MyStrands) — where I spent a stretch in the late 2000s — was a direct competitor with a very similar feature set: a scrobbler, a personal listening history, charts, recommendations, similar-listener discovery, the works. There were a few others working the same shape. The whole cohort was operating on a real insight: the listening data was important, and someone needed to tend to it.

Then, in 2007 — almost twenty years ago now — Last.fm was acquired by CBS. They've kept the lights on, more or less, but the experience has barely moved since. Streaming arrived, the locus of listening shifted from local libraries into platform silos, the social-graph layer of music got swallowed inside Spotify, and Last.fm just... stayed.

ListenBrainz exists in the open-source world as a healthy modern successor for the *data* layer — it's where my listens go, and it's where Achordion reads from — but the *experience* layer on top of that data never really felt consumer-grade IMHO (no shade intended). That's the gap I'm trying to fill.

## The Frame

The proprietary streaming services bundle three different things together: a **community** (the social graph, the activity feed, what your friends are playing), a **data layer** (your listening history, recommendations, charts, year-end summaries), and a **player** (the thing that actually pushes audio at your speakers). Spotify owns all three. Apple Music owns all three. Tidal does, Bandcamp does, on and on. They're walled gardens partly because that bundling makes leaving expensive — you don't just lose a subscription, you lose your data, your identity, and the social context you built up over a decade.

The open-source counterpoint takes those three layers and pulls them apart:

- **Identity and metadata**: [MusicBrainz](https://musicbrainz.org). The canonical, community-edited database that tells us "this recording is the same as that recording" across every release and re-release.
- **Community and listening data**: [ListenBrainz](https://listenbrainz.org). Run by the MetaBrainz Foundation, free, open, holds your scrobbles forever and gives you back stats, recommendations, similar listeners, fresh-release alerts.
- **Playback**: this is where Parachord comes in. A cross-platform player that resolves any track against whatever services you've authorized — Spotify, Apple Music, SoundCloud, YouTube, Bandcamp, your local FLAC library, all of it — and plays from whichever ranks highest in your priority order. You don't need Parachord to enjoy Achordion — any scrobbler that builds your profile with your listening data unlocks a lot of fun — but Parachord certainly makes the playback a hell of a lot easier.

The thing that's been missing — the gap that made me build Achordion — is the *front-end* web experience and community. ListenBrainz has the data. Their own UI is honest and functional, but it hasn't had the design love its data deserves. There was a real gap between "I see something I like on a friend's profile" and "I'm playing it" — multiple clicks across multiple sites, each one making you think.

Achordion fills that gap.

## What Achordion Is

The short version: **Achordion is the independent music community and data layer.** A modern, dense, browse-friendly UI on top of MusicBrainz and ListenBrainz, with every Play button on every page deep-linked to Parachord.

The longer version, in four pillars:

**1. One community across every streaming service.** Spotify users, Apple Music users, Tidal users, Bandcamp die-hards, the people on a NAS full of FLACs — none of them can see what the others are listening to. That wall comes down here. Every listener's scrobbles flow into the same feed regardless of where the music came from. You can see what your friend is playing this week even if she's on Apple Music and you're on Spotify.

**2. One click plays it, anywhere.** Every track row, every album cover, every chart entry, every "now playing" pin in a friend's feed has a `parachord://` deep link. Click it, Parachord wakes (if it isn't running), resolves the tracklist against your authorized services, and plays. No "open in Spotify" / "open in Apple Music" forks, no service-specific fallbacks, no library mutation. The same hand-off works for tracks, albums, playlists, and full ListenBrainz Radio stations.

**3. Your data stays yours.** Achordion doesn't store your listening data. There's no Achordion-side profile of you, no record of what you've played, no record of who you follow — all of that lives in your ListenBrainz account and is queried live on each page view. The only Achordion-side state is operational: a Redis cache that memoizes public ListenBrainz API responses (so we're polite to MetaBrainz's servers) and Vercel's privacy-focused Web Analytics for aggregate page-view counts. Neither one builds a profile of you, and neither one stores anything you'd consider yours. Sign-in is OAuth against MusicBrainz. If Achordion disappeared tomorrow, none of *your* data would go with it — you'd point a different ListenBrainz client at the same account and pick up where you left off.

**4. Build the open web of music.** Every "+ Add sources" tile, every breadcrumb deep-linked back to MusicBrainz, every chart entry that points users into the canonical entity page is a small nudge toward editing MB. The more people who can find a missing relationship and fix it in one click, the better the open data gets — and the better Achordion *and every other MB client* gets for free.

## How It Talks to Parachord

This is the bit that took the longest to get right, so it's worth a closer look.

Achordion never plays audio. It never has access to your Spotify session or your Apple Music account. What it has is text — track titles, artist names, MusicBrainz IDs, ISRCs, MBIDs of release-groups. When you click Play on a track row, Achordion builds a `parachord://play/track?artist=...&title=...` URL and hands it to the browser. Your OS recognizes the scheme, wakes Parachord (if it isn't running), and Parachord does the rest:

1. It looks at the symbolic description — artist, title, album.
2. It runs the resolver against every authorized source.
3. It picks the best match using your priority order plus a confidence floor.
4. It plays through that source — Spotify Connect, MusicKit JS, Bandcamp's stream URL, ExoPlayer for local files, etc.

Same protocol surface as the [`parachord://` deep links](/blog/2026/02/19/parachord-protocol-for-music-websites/) any other site can adopt. Same XSPF [import flow](/blog/2026/04/22/spinbin-is-back/) when you want to subscribe to a playlist that updates over time. The contract between Achordion and Parachord is the *exact* contract between Spinbin and Parachord, between any third-party music site and Parachord. Achordion is just a really, really comprehensive consumer of that contract.

The reason this matters: there's nothing Achordion-specific about the play hand-off. If you'd rather use a different client for browsing ListenBrainz and you click a `parachord://` link there, it'll work identically. The pieces are decoupled by design.

## What's Actually There

Concretely, what's in Achordion today:

- **Listens.** Your full ListenBrainz history with friendlier user experience and richer per-track context.
- **Stats.** Charts, heatmaps, top-X breakdowns. Always-available, not just once a year on a single proprietary platform's schedule.
- **Charts.** Sitewide ListenBrainz top albums and tracks. Apple Music charts by country. College radio album charts for US and Canadian campuses.
- **Recommendations.** Weekly Jams, Weekly Explorations, Recommended artists, Recommended tracks, Critical Darlings — with a Familiarity slider that lets you bias toward what you know vs. what you don't.
- **Passive Discovery.** Fresh releases from artists you listen to, filtered by Albums / EPs. Similar listeners. ListenBrainz Radio stations from any artist or seed.
- **Pages for every entity.** Artist, album, track, release, label, tag — each with cover art, external links to official sites and services, top listeners, popularity, and a Play button on every playable thing. Multi-artist credits get split into individual links.
- **Search typeahead.** Live results from MB across artists, albums, tracks, and ListenBrainz users — with `artist:`, `album:`, `song:`, and `user:` power filters.
- **Year in Music.** Available all year round, not as a once-a-year proprietary marketing moment.
- **An artist value proposition.** If you're an artist, go look at your own artist pages and you will find individual fans (that listen to you from any number of sources) that you didn't know you had and learn more about what else they like.
And on the playback side, every one of those pages plays into Parachord with a single click.

## What It's Built On

Modern Next.js 16 / React 19 / Turbopack stack on Vercel. OAuth via MusicBrainz (the same MB account ListenBrainz uses, so existing ListenBrainz users sign in with credentials they already have). Cover art from the Cover Art Archive. Artist photos from Wikidata + Wikimedia Commons. Public editorial feeds for charts.

None of this infrastructure is mine. The MetaBrainz Foundation runs MusicBrainz and ListenBrainz on donations and a small team. If Achordion or Parachord provide you value from the MusicBrainz / ListenBrainz data — please [support them](https://metabrainz.org/donate).

## A Note on Bots

Achordion blocks AI training crawlers — GPTBot, ClaudeBot, CCBot, PerplexityBot, Applebot-Extended, Google-Extended, and friends — from walking our catalog routes. Partly to keep the site healthy under crawler load, partly because piping community-contributed listening data into a training set without attribution isn't the spirit this project was built on. Datacenter and proxy ASNs are blocked at the edge, per-IP rate limits cap any one client at a few requests per second, and our [`robots.ts`](https://github.com/jherskowitz/achordion/blob/main/app/robots.ts) + [`middleware.ts`](https://github.com/jherskowitz/achordion/blob/main/middleware.ts) are auditable in the public repo.

## What's Next

The shipped feature set is meant to feel like an almost-feature-complete ListenBrainz web experience on day one — every page that listenbrainz.org offers, mirrored with a fresh visual language and tighter information architecture. From here, the work is mostly making even tigher integrations with Parachord (and other scrobblers & players).



## Try It

[**achordion.xyz**](https://achordion.xyz). Sign in with your MusicBrainz account. If you've already got Parachord installed, every Play button just works. If you don't, the welcome wizard ends with a step that takes you to [parachord.com](https://parachord.com) for the install.

The whole thing is open source: [github.com/jherskowitz/achordion](https://github.com/jherskowitz/achordion). Issues, PRs, ideas all welcome. The architecture document in `AGENTS.md` is the fastest way to get oriented if you want to poke at the code.

Achordion isn't trying to replace ListenBrainz or compete with it — but instead trying to bring more people to the party. Achordion is the front-door. Parachord is the player. ListenBrainz is the ledger. MusicBrainz is the encyclopedia.

Four independent, open-source, non-corporate, layers. One coherent experience. That's the bet.
