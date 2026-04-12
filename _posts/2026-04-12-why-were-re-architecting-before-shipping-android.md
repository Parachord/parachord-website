---
layout: post
title: "Why We're Re-Architecting Parachord Before Shipping the Android App"
date: 2026-04-12
author: "J Herskowitz"
category: "Technical"
---

A month ago I [wrote about building the Parachord Android app in a few days](/blog/2026/03/15/parachord-android-3-days/). 146 commits, a full native app, Spotify and Apple Music playback, scrobbling, AI chat, the works. I was genuinely surprised it came together that fast.

So why isn't it in your hands yet?

Because I used it every day for three weeks and realized: if I'm going to ship a mobile app — and eventually an iOS app too — I need to get the foundation right first. Not just "make it work on my phone" right, but "this is the architecture we're building on for years" right.

This is the story of that decision, what made Android playback uniquely challenging, and why I'm migrating to Kotlin Multiplatform before releasing anything.

## The Temptation to Just Ship It

The Android app works. I've been using it as my daily driver. Spotify playback, Apple Music, SoundCloud streams, local files, the whole resolver pipeline — it all functions. The scrobbling is accurate. Shuffleupagus gives good recommendations. The home screen widget updates correctly. For a "it's done enough" release, it was honestly there.

But here's the thing: Parachord isn't a single-service music player. It's a multi-source, multi-backend, plugin-driven system that has to coordinate playback across fundamentally different audio architectures, maintain background audio through Android's aggressive battery optimization, keep a WebView alive for Apple Music's DRM, poll Spotify's state at 300ms intervals without janking the UI, and do all of this while scrobbling to three services and letting your friends see what you're playing in real time.

The desktop Electron app handles this through the browser's built-in audio stack and the relative luxury of unlimited background processing. On Android, every one of those assumptions breaks.

## What Makes Android Playback Hard

I want to get specific here, because "mobile is harder" is a handwave that doesn't help anyone.

### Background Audio Is a Constant Negotiation

On desktop, your app runs until you close it. On Android, the OS is actively trying to kill you. The moment the screen turns off, you're on borrowed time. To keep playing music, you need a foreground Service with a persistent notification, a MediaSession that the system recognizes as active audio, and you need to handle Doze mode — Android's battery optimization that periodically suspends network access and defers jobs, even for foreground services.

For a single-source player (just ExoPlayer, just Spotify), this is well-documented territory. For Parachord, where the *next* track in your queue might come from a completely different backend than the current one, the Service needs to stay alive across source transitions and coordinate which audio backend is active without dropping the MediaSession. If the system sees a gap in active audio output — even for a second during a backend switch — it may decide you're done playing and tear down your service.

### The Apple Music WebView Problem

On the desktop, Apple Music playback uses native MusicKit when available (macOS), falling back to MusicKit JS in the Electron renderer for other platforms. On Android, there is no native MusicKit SDK (Apple reserves that for iOS and macOS). So we do something... creative: we run MusicKit JS inside a headless Android WebView.

This mostly works. But WebViews on Android have a critical limitation: when your app goes to the background, Android will throttle or outright suspend the WebView's JavaScript execution. If Apple Music is playing via the WebView and the user locks their screen, the JS polling loop that tracks playback position stops running. Worse, the WebView itself can get destroyed if the system needs memory.

The solution involves playing a silent audio track through ExoPlayer alongside the WebView's DRM audio, purely to keep the foreground Service's audio focus active and the process alive. It's a hack. It works. But it's the kind of thing that makes you think carefully about architectural boundaries, because this silent-audio-keep-alive pattern has to coordinate with the actual playback state machine, the MediaSession metadata, and the notification controls — all without the user ever knowing it's happening.

### Spotify: Two Apps, One Experience

Spotify playback on Android can go through two paths: the Spotify App Remote SDK (which controls the actual Spotify app on the user's phone) or Spotify Connect (cloud-based remote control via the Web API). Both have different latency characteristics, different state reporting mechanisms, and different failure modes.

The App Remote SDK gives you lower latency but requires the Spotify app to be installed and sometimes needs to be "woken up" by broadcasting a media button intent — essentially faking a headphone button press to force Spotify's service to start. If that wake-up fails, you fall back to Connect, which works over the network and adds 1-2 seconds of latency to every command.

On top of this, both paths report playback state through polling (not push notifications), so you're running 300ms poll loops that need to be accurate enough for a seek bar but light enough to not drain the battery. Getting this right — and keeping it right across Android versions, battery modes, and Spotify app updates — took more debugging time than any other single feature.

### The "Two Things Playing at Once" Problem

When your queue contains tracks from different backends — a Spotify track followed by a SoundCloud stream followed by a local file — every track transition is a potential for overlap. You have to:

1. Tell the current backend to stop
2. Wait for confirmation (or timeout if it's unresponsive)
3. Switch audio focus to the new backend
4. Start the new track
5. Update the MediaSession, notification, scrobbler, and widget simultaneously

If step 2 takes too long and you start step 4 anyway, you get the dreaded "two things playing at once." If you wait too long, there's an awkward silence and the system might kill your service. The timing window is tight, and it's different for every backend.

## Why This Led to a Re-Architecture (Instead of Just "Polish")

Here's where the iOS question enters. I'd been daily-driving the Android app and fixing these playback issues one by one. Each fix was local and specific — a timeout adjustment here, a state machine tweak there, a workaround for a Spotify SDK quirk. The app was getting more stable, but the fixes were accumulating in Android-specific code that would have to be reimplemented from scratch for iOS.

And then I looked at the numbers. The Android app is about 51,000 lines of Kotlin across 191 files. Of those, roughly 73% is pure business logic — API clients, the resolver pipeline, repositories, AI services, scrobblers, metadata enrichment, the plugin system. None of it uses Android APIs. It's just Kotlin that happens to live in an Android project.

If I shipped the Android app as-is and then started an iOS port, I'd be maintaining two independent implementations of that 73%. Every new feature — a new scrobbler, a new metadata source, a new AI provider — would need to be built twice. Every bug fix in the resolver scoring algorithm would need to be applied in two places. For a one-person project, that's a death sentence for feature velocity.

## The Cross-Platform Decision

I looked seriously at five approaches: Kotlin Multiplatform (KMP), React Native, Flutter, Capacitor (wrapping the desktop web app), and just maintaining separate native codebases.

**Capacitor was disqualified immediately.** Background audio in WebViews is fundamentally broken on mobile — I'd just spent weeks working around exactly this limitation for Apple Music. Wrapping the entire desktop app in a WebView would mean fighting that battle for *every* audio source, not just one.

**React Native and Flutter** would mean throwing away 51,000 lines of working, tested Kotlin and rewriting everything from scratch. React Native's native module story for multi-backend audio is weak — the community assumes single-source playback. Flutter's platform channel overhead would add serialization cost to every audio command, and the Dart ecosystem has nothing mature for the Spotify SDK or MusicKit integration.

**Separate native codebases** would give the best platform quality, but at the permanent cost of maintaining two implementations of all business logic. For a team, maybe. For one person, no.

**KMP was the clear choice.** It preserves the existing 51K lines of Kotlin. About 73% of the codebase moves into a shared module that compiles for both Android and iOS. The remaining 27% — the deeply platform-specific stuff like ExoPlayer, MediaSession, the MusicKit WebView bridge — stays as native implementations behind clean interfaces. I don't lose any of the Android work. I just restructure where the code lives.

## The .axe Plugin System Changes the Equation

Here's something I didn't fully appreciate until I mapped out the migration: the [.axe plugin system](/blog/2026/01/22/deep-dive-plugin-system/) we built for the desktop app — and ported to Android — is already cross-platform by nature.

On the desktop, plugins run as JavaScript in Electron's renderer. On Android, they run in a headless WebView via `JsBridge`. On iOS, they'd run via JavaScriptCore (which is built into the OS — no WebView needed). The same 19 .axe plugin files, the same `resolver-loader.js`, the same JSON manifests — unchanged across all three platforms.

The Kotlin wrapper around this (`PluginManager`, `PluginSyncService`) already depends on a `JsRuntime` interface, not the concrete Android `JsBridge`. It's effectively KMP-ready today. Which means all the resolver plugins, AI providers, metadata services, and concert aggregators that run through the .axe system would work on iOS on day one of the port — no native reimplementation needed.

This is code sharing that KMP alone couldn't provide, because Kotlin doesn't run in Electron. The plugin system bridges all three platforms: desktop (Electron + JS), Android (WebView + JS), and iOS (JavaScriptCore + JS). New plugins added to the marketplace automatically work everywhere.

## How the Migration Works

The migration is phased and incremental. Android keeps shipping at every step — nothing breaks during the process.

**Phase 1** moves the easy stuff: all the pure data models, serialization classes, enums. About 30 files that have zero Android dependencies. This is a pure refactoring exercise — move files to a `:shared` module, update imports, verify the app still builds.

**Phase 2** replaces Retrofit with Ktor for HTTP. Ktor is Kotlin-native and multiplatform. The API surface is similar enough that each endpoint translates mechanically. Seven API clients (Spotify, Last.fm, MusicBrainz, ListenBrainz, Ticketmaster, SeatGeek, Apple Music) get rewritten as shared Ktor clients.

**Phase 3** is the big one: replacing Room with SQLDelight for the database. Room is Android-only. SQLDelight generates Kotlin from raw SQL and runs on both platforms. The tricky part is migrating existing Android users' databases — they have a Room database at schema version 12 with 8 migrations baked in. SQLDelight needs to open that same database file without losing a single track, playlist, or chat message. Getting the schema exactly right is critical.

**Phase 4** swaps Hilt for Koin (dependency injection). This touches ~110 files but is mostly mechanical — removing annotations, adding module definitions. Tedious but low risk.

**Phases 5-7** move the business logic: 13 repositories, the resolver pipeline, AI services, scrobblers, metadata providers, and platform abstraction layers. By this point, the shared module is the majority of the codebase, and the Android app module is mostly UI and platform plumbing.

The whole thing is designed so I can merge each phase independently. If Phase 3 turns out to be harder than expected, I can ship Phases 1 and 2 without it. Each phase has a rollback path — delete the shared module, revert imports, and the Android app goes back to exactly how it was.

## What Stays Platform-Specific

Some things can't be shared, and shouldn't be. The playback layer — ExoPlayer on Android, AVPlayer on iOS — is fundamentally different per platform and that's fine. The MediaSession integration, the foreground Service, the MusicKit WebView bridge, the home screen widget, Android's MediaStore scanner — all of this stays native.

The key insight is that these platform-specific pieces are *stable plumbing* that rarely changes. I'm not adding new foreground service implementations every week. But I *am* adding new API integrations, new resolver sources, new recommendation algorithms, new metadata providers. That's the stuff that goes in the shared module. The stuff that changes frequently gets written once. The stuff that's stable gets written per-platform.

## The Honest Trade-Off

I could have shipped the Android app a month ago. It would have worked for most people, most of the time. But every new feature I built after that would have been Android-only, and the gap between "Android app exists" and "iOS app exists" would have grown with every commit.

By pausing to re-architect, I'm trading a few weeks of delay for a fundamentally better development velocity going forward. Every feature I build in the shared module works on both platforms. Every bug fix in the resolver pipeline applies everywhere. When iOS does ship, it starts with 73% of the functionality already built and tested.

For a one-person open source project, that's not a luxury — it's a survival strategy.

I'll share more as the migration progresses. The Android repo is public if you want to follow along: [github.com/Parachord/parachord-android](https://github.com/Parachord/parachord-android). The full migration plan and cross-platform strategy docs are in the `docs/` folder.

Thanks for reading,

J
_(I'm @jherskowitz pretty much everywhere - except X)_

---

*Parachord is an open-source, multi-source music player. [Download the desktop app](https://github.com/Parachord/parachord/releases) for macOS, Windows, or Linux.*
