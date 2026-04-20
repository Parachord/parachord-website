---
layout: post
title: "Parachord for Android: The First Public Beta Is Here"
date: 2026-04-20
author: "J Herskowitz"
category: "Announcement"
---

It's out. **Parachord for Android v0.4.0-beta.2** is the first public beta of the mobile app, and anyone with an Android phone and a taste for music that lives in too many places at once can now install it.

If you've been following along, this has been a minute in the making. I [built the first working Android app in four days back in March](/blog/2026/03/15/parachord-android-3-days/), then [hit pause before shipping](/blog/2026/04/12/why-were-re-architecting-before-shipping-android/) to re-architect the foundation so Android and a future iOS app could share most of their code. This beta is the first release that sits on top of that new foundation — and it's the first one I'm comfortable putting in anyone else's hands.

<img src="https://github.com/Parachord/parachord-android/raw/main/docs/screenshots/home.png" alt="Home — playlists, recent listens, Discover tiles" width="220">

## What It Is

Parachord for Android is the whole app — not a remote, not a companion, not a cut-down mobile experience. It's a unified music player that pulls Spotify, Apple Music, SoundCloud, Bandcamp, and your local files into a single library and a single queue, and plays whichever source has the best match for whatever you're trying to hear.

<img src="https://github.com/Parachord/parachord-android/raw/main/docs/screenshots/now-playing.png" alt="Now Playing — resolver chip shows the active source" width="220">

A partial list of what's in this build:

- **Unified playback** across Spotify (via Spotify Connect), Apple Music (via MusicKit in a headless WebView), SoundCloud (native ExoPlayer), local files (with artwork extraction), and Bandcamp (browser-based)
- **The resolver pipeline** from desktop, with the same priority-first, confidence-second scoring and the same 60% confidence floor so you don't end up with the wrong track
- **Playlist sync** — Spotify import/export, hosted XSPF playlists with 5-minute polling, and dedup logic that keeps re-syncing from multiplying your playlists
- **Scrobbling** to ListenBrainz, Last.fm, and Libre.fm, with automatic MusicBrainz ID enrichment
- **Shuffleupagus**, the AI DJ chat — bring your own key for ChatGPT, Claude, or Gemini
- **Discovery** — personalized recommendations blending ListenBrainz and Last.fm, Fresh Drops from artists you follow, Critical Darlings with AI-summarized review blurbs, Pop of the Tops global charts, and Weekly Jams / Weekly Exploration pulled from ListenBrainz
- **Friends** — see what your Last.fm and ListenBrainz contacts are listening to right now, right from the sidebar and listen along with them
- **Concerts** via Ticketmaster and SeatGeek, with the same "On Tour" indicator from desktop
- **Smart links** through `go.parachord.com` with per-service listen buttons
- **The .axe plugin system** — the same 19 plugins as desktop, running in a WebView with hot-reload
- **A home screen widget** and background playback that survives screen-off and Doze

<img src="https://github.com/Parachord/parachord-android/raw/main/docs/screenshots/shuffleupagus.png" alt="Shuffleupagus — natural-language DJ chat powered by ChatGPT, Claude, or Gemini" width="220">
<img src="https://github.com/Parachord/parachord-android/raw/main/docs/screenshots/concerts.png" alt="Concerts — Ticketmaster + SeatGeek, library-aware" width="220">
<img src="https://github.com/Parachord/parachord-android/raw/main/docs/screenshots/queue.png" alt="Queue — mixed Spotify + Apple Music rows in one queue" width="220">

## What's Different Under the Hood

If you read the re-architecture post, a lot of that work is already visible in this build. The app is Kotlin Multiplatform-ready: the database is SQLDelight, dependency injection is Koin, Ktor clients are scaffolded in the shared module (Retrofit still handles the app-side calls for now — a cleanup task, not a blocker), and a substantial chunk of the business logic now lives in the shared module. That's the work that makes iOS possible later without rewriting the resolver pipeline, the scrobblers, the AI providers, or any of the metadata plumbing.

The platform-specific stuff — ExoPlayer, the MediaSession, the foreground Service, the MusicKit WebView bridge, the widget — stays native, and honestly that's the part that took the most debugging. Background audio on Android is a constant negotiation with the OS, and getting the silent-audio-keep-alive pattern right for Apple Music playback in a backgrounded WebView was the single hardest thing in the whole project. It works now. I've been daily-driving it for weeks.

## Known Limitations

It is a beta, and an early one, so here's what's not in this build or not working the way I want it to yet:

- **Apple Music sync is playback-only** — you can play from Apple Music, but library sync isn't wired up yet
- **YouTube resolver is disabled on mobile** — Chromium's WebView hits Google's consent-redirect wall before the plugin gets a chance to run. May return if that becomes resolvable.
- **Ollama local-LLM provider is disabled** on mobile for now
- **Cross-fade, gapless, and loudness normalization** aren't tuned for mobile yet
- **Some ListenBrainz cover art** loads slowly the first time around while the cache warms up

If you hit something that looks like a bug, please [file an issue](https://github.com/Parachord/parachord-android/issues) — logs are enormously helpful. I'm still the only set of eyes on most of this.

## How to Install

Two options:

1. **Grab the APK directly** from the [latest release](https://github.com/Parachord/parachord-android/releases/latest) and sideload it. Android 8.0+ (API 26) required.
2. **Join the [Parachord-Testers Google Group](https://groups.google.com/g/parachord-testers)** and you'll get automatic updates as new builds go out.

Spotify Premium is required for Spotify playback, and an Apple Music subscription is required for Apple Music playback. AI features and concert plug-ins use your own API keys — Parachord doesn't run a backend.

## What's Next

Lots. The must-haves of the Kotlin Multiplatform migration are done — Ktor, SQLDelight, Koin, and the shared module are all in place, and the business logic that needs to cross platforms already has. What's left is cleanup: moving a few of the remaining platform abstractions into the shared module and tightening the seams. Nothing on the critical path to iOS is still blocking.

The bigger list is fixes the bugs you all are certain to run into - I love to say that music apps are comprised entirely of corner-cases, and how you all listen will be different than how I do. After that I want to further build out sync - both to/from Apple Music as well as more complex use cases across multiple nodes and services.

And at some point in that not too distance future, once the shared module is where it needs to be, iOS. That's still the reason all of this is structured the way it is.

But for today: it's out, it's real, and you can install it. Thanks for sticking with it.

— J
_(I'm @jherskowitz pretty much everywhere - except X)_

---

*Parachord is an open-source, multi-source music player. [Download the Android beta](https://github.com/Parachord/parachord-android/releases/latest), or [grab the desktop app](https://github.com/Parachord/parachord/releases) for macOS, Windows, or Linux.*
