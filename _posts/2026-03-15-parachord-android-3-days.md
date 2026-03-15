---
layout: post
title: "Building Parachord for Android in 3 Days with Claude"
date: 2026-03-15
author: "J Herskowitz"
category: "Technical"
---

Parachord is a cross-platform music player that unifies Spotify, Apple Music, Bandcamp, SoundCloud, YouTube, and local files into a single interface. The desktop app -- built with Electron, React, and Tailwind -- has been in development since January 2026 and has grown into a fairly complex piece of software: a plugin-based resolver system, cascading metadata providers, real-time friend activity, Smartlinks, scrobbling, a DJ tool, and a lot more.

Last week I decided to build an Android version. Not a companion app. Not a remote control. A near-feature-parity native Android app. And I wanted to see how fast it could be done using Claude as a development partner.

The answer: **144 commits across 3 days**.

<iframe width="100%" height="515" src="https://www.youtube.com/embed/qwATG9aKK2E" title="Parachord Android Demo" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## The Stack

Before writing a single line of code, I set up a [CLAUDE.md](https://github.com/Parachord/parachord-android/blob/main/CLAUDE.md) file in the repo root. This is the file that Claude reads at the start of every session to understand the project's architecture, conventions, and constraints. It documents:

- The resolver scoring system (two-tier: user priority + confidence score)
- Metadata provider cascade (MusicBrainz → Last.fm → Spotify)
- Playback routing rules (Spotify App Remote SDK, ExoPlayer for streams, MusicKit WebView for Apple Music)
- The full design system (brand colors, dark/light theme tokens, component patterns)
- Common mistakes to avoid (don't use `sources.firstOrNull()`, don't use blue as accent, don't bypass the resolver pipeline)

The tech stack is native Android: Kotlin, Jetpack Compose, Material 3, ExoPlayer (Media3), Room, Hilt, OkHttp/Retrofit, and Coil. No cross-platform framework. No shared code with the desktop app. A complete rewrite targeting Android-native patterns, but architecturally aligned with the desktop app's approach.

## Day 1: Scaffold to Sound (March 11-12)

The first commit landed at 12:49 PM on March 11. It was a full project scaffold -- Gradle configuration, Hilt dependency injection, a JS bridge layer, ExoPlayer service, Room database, and a Jetpack Compose UI shell. By the end of the day, the app had:

- **Spotify playback** via the App Remote SDK, including device selection logic ported from the desktop app
- **Metadata providers** cascading through MusicBrainz, Last.fm, and Spotify
- **Local media scanning** for on-device music files
- **OAuth integration** for Spotify authentication

Day 2 (March 12) focused on making it feel like Parachord. The desktop app's design system -- every color token, spacing value, and component pattern -- was ported to Compose theming. A left navigation drawer, 5-tab bottom navigation, swipeable tab layouts, and the signature dark mode all came together. By the end of day 2, if you squinted, it looked like Parachord.

## Day 2: Features at Full Speed (March 13)

This was the biggest single day of development. 16 commits covering:

- **Search** with history tracking, fuzzy matching, and multi-source results
- **Artist pages** with full discography, biography (Last.fm + Wikipedia), chronological sorting, and filter tabs
- **Queue management** with persistence across app restarts
- **Last.fm scrobbling** with proper timing rules and request signatures
- **Shuffleupagus** -- Parachord's AI-powered music chat -- integrated with ChatGPT, Claude, and Gemini
- **Dark mode** with system/light/dark toggle following the desktop's exact palette
- **Swipe-to-delete** gestures for playlist management
- **Playback fixes** for audio focus, skip behavior, and resolver verification

The pattern was consistent: I'd describe what a feature does in the desktop app, point Claude at the relevant desktop source files when needed, and it would produce the Android-native equivalent. Not a line-for-line port -- the implementations are genuinely different because the platforms are different -- but functionally equivalent.

## Day 3: Polish and Platform Features (March 14-15)

The final push brought the app from "it works" to "it's usable":

- **Spotify library sync** -- a full sync engine with diff calculation, bidirectional updates, paginated fetching, and background scheduling via WorkManager
- **Collection management** with filter bars, sort options, and image enrichment
- **Pop of the Tops** charts pulling from Apple Music RSS and Last.fm
- **Fresh Drops** new release tracking with caching and stale-while-revalidate
- **Home page** with cards for friend activity, recent loves, charts, and recommendations
- **Spinoff radio mode** with queue dimming and context banners
- **Apple Music playback** via a MusicKit JS WebView bridge with Widevine DRM
- **Playlist import** supporting Spotify, Apple Music, and XSPF URLs via deep links
- **Friend activity** with listen-along status, context menus, and pin/unpin
- **Home screen widget** for mini player controls
- **Foreground service** to keep playback alive when the screen is off
- **Edge swipe gestures** for navigation
- **GitHub Actions CI** for automated APK builds

## How the Process Actually Worked

This wasn't "type a prompt and get an app." It was a tight feedback loop:

1. **I drove the architecture.** Every major decision -- using App Remote SDK vs. Web API for Spotify, WebView bridge vs. native SDK for Apple Music, Room vs. DataStore for different data types -- was mine. Claude doesn't know what trade-offs matter for your specific app.

2. **CLAUDE.md was critical.** Without it, every session would start with Claude making wrong assumptions about the resolver pipeline, the color scheme, or how metadata providers should cascade. The file is essentially a contract: "here's how this app works, don't deviate."

3. **Claude wrote most of the code.** I'd describe a feature, sometimes paste a snippet from the desktop app for reference, and Claude would produce the Kotlin/Compose implementation. I'd review, test on device, and course-correct. The ratio was probably 90/10 in terms of lines written.

4. **Debugging was collaborative.** When Apple Music playback silently failed, when Hilt dependency cycles appeared, when the Spotify token refresh race condition surfaced -- these were problems we solved together, but I was the one who could actually run the app and see what was happening.

5. **The desktop app was the spec.** Having a working reference implementation made everything faster. Instead of writing requirements documents, I could say "make it work like the desktop's artist page" and Claude could look at the React component and produce the Compose equivalent.

## What Surprised Me

**The speed was real.** 144 commits in 3 days isn't a gimmick. The app has real Spotify and Apple Music playback, library sync, scrobbling, friend activity, search, artist pages, playlists, queue management, charts, recommendations, an AI chat feature, a home screen widget, and deep link handling. These are real features that work.

**Platform-native code matters.** Claude didn't try to force web patterns onto Android. The Compose UI code is idiomatic. The Room database schema is well-structured. The Hilt dependency graph makes sense. It's code I'd be comfortable maintaining.

**The bottleneck was me.** Claude can generate code faster than I can test it. The actual limiting factor was the build-deploy-test cycle on a physical device, especially for features like Apple Music DRM, Spotify device handoff, and background playback that can't be tested in an emulator.

## What's Next

The Android app is functional but not yet released. There's still work to do on stability, edge cases, and the features that didn't make the 3-day cut (concerts, browser extension integration, Smartlinks). But the core is there -- and it took 3 days instead of 3 months.

If you want to follow along, the repo is public at [github.com/Parachord/parachord-android](https://github.com/Parachord/parachord-android). The desktop app is available now at [github.com/Parachord/parachord/releases](https://github.com/Parachord/parachord/releases).

---

*Parachord is an open-source, multi-source music player. [Download the desktop app](https://github.com/Parachord/parachord/releases) for macOS, Windows, or Linux.*
