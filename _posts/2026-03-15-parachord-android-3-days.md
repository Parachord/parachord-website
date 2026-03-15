---
layout: post
title: "Building Parachord for Android in 3 Days"
date: 2026-03-15
author: "J Herskowitz"
category: "Technical"
---

So last Tuesday I woke up and thought, "I should start to scaffold out an Android app." By Friday, I had a full app. A real one. With Spotify and Apple Music playback, library sync, scrobbling, friend activity, search, artist pages, playlists, an AI music chat, a home screen widget, and about a hundred other things. 144 commits in 3 days.

Let me explain how that happened.

<iframe width="100%" height="515" src="https://www.youtube.com/embed/qwATG9aKK2E" title="Parachord Android Demo" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## Some Context

For anyone new here -- Parachord is a music player that pulls together all your music sources (Spotify, Apple Music, Bandcamp, SoundCloud, YouTube, local files) into one app. Instead of bouncing between five different players, you get one unified library, one queue, one experience. It's been a desktop app since January, and it's gotten pretty feature-rich: plugins, friend activity, scrobbling, a DJ tool, concert discovery, and more.

The Android version isn't a remote control or a companion app. It's the whole thing, rebuilt natively for Android. And I, like scores of others, built it with [Claude](https://claude.ai) as my coding partner.

## The Secret Weapon: A Really Good Briefing Doc

Before writing any code, I should have written a [CLAUDE.md](https://github.com/Parachord/parachord-android/blob/main/CLAUDE.md) file -- basically a cheat sheet that Claude reads at the start of every session. It covers how the app works, what the design system looks like, what mistakes to avoid, and how all the pieces fit together. Think of it like onboarding a new developer, except the new developer can write code at 3 AM without complaining. I honestly didn't do that until I got frustrated and asked "why aren't you remembering what I'm telling you?!" - and it gave me the answer.

This turned out to be the single most important thing I did. Without it, every conversation would start with me re-explaining how the resolver system works or why the accent color is purple, not blue. With it, Claude could just... start building.

## Day 1: Making Noise (March 11-12)

First commit: 12:49 PM on Tuesday. A full project skeleton -- all the Android boilerplate, the database, the UI shell. By the end of the day, the app could play music from Spotify, pull artist metadata, and scan your phone for local files.

Day 2 was about making it *look* like Parachord. I ported the whole design system over -- colors, spacing, dark mode, the navigation layout. By the end of the day, if you squinted, it was recognizable.

## Day 2: The Big Push (March 13)

This was the day things got exciting. 16 commits in a single day covering:

- Search with history and fuzzy matching
- Full artist pages with discography, bios, and top tracks
- Queue management that survives app restarts
- Last.fm scrobbling
- Shuffleupagus (our AI music chat) with support for ChatGPT, Claude, and Gemini
- Dark mode with a proper system/light/dark toggle
- A pile of playback fixes

The workflow was simple: I'd describe what a feature does in the desktop app, sometimes share the relevant source code, and Claude would write the Android equivalent. Not a copy-paste job -- the implementations are genuinely different because the platforms are different -- but functionally the same.

## Day 3: Making It Real (March 14-15)

The last stretch was about going from "it works on my phone" to "someone else could actually use this":

- Full Spotify library sync -- import your albums, playlists, and saved tracks
- A home page with friend activity, charts, new releases, and recommendations
- Apple Music playback (this one was a journey)
- Playlist import -- paste a Spotify or Apple Music link and it just works
- Listen-along, so you can see what your friends are playing
- A home screen widget
- Background playback that doesn't die when you lock your phone
- Edge swipe gestures

47 commits on Thursday alone. I stopped counting features and just powered through to get an app that would be usable before I leave on vacation tomorrow morning.

## What It Was Actually Like

I want to be honest about what "building with AI" means in practice, because it's not what most "regular" people imagine.

**I was the architect, Claude was the builder.** I decided *what* to build and *how* it should work. Claude wrote all of the actual code - but virtually every design decision, every "should we use X or Y" choice, was mine. AI doesn't know what trade-offs matter for your app. You do.

**The desktop app was the spec.** This is the real cheat code. I have just spent 2 months building a product experience that works *almost* exactly how I want it to. I didn't have to write requirements or draw mockups. I could just say "make it work like the desktop version" and point at the source. Having a reference implementation made everything incredibly fast.

**Debugging was a team sport.** When something broke - Apple Music silently failing, a dependency injection cycle, a token refresh race condition - we figured it out together. But I was the one who could actually run the app and tap around and say "it's doing the wrong thing when I do this."

**The bottleneck was always me.** Claude can obviously write code way faster than I can test it. The real speed limit was the build-deploy-test cycle, especially for things like DRM playback and background services that need a real phone.

## So What Now?

The Android app works - I'm going to put it through it's paces while I explore Costa Rica. It's not released yet - there's still polish to do and a few features that didn't make the 3-day cut (concerts, Smartlinks, etc). But the core is solid, and it honestly surpised me that building it took days instead of months.

The repo is public if you want to poke around: [github.com/Parachord/parachord-android](https://github.com/Parachord/parachord-android). The desktop app is available now at [github.com/Parachord/parachord/releases](https://github.com/Parachord/parachord/releases).

It's a pretty surreal time to be building software... especially for someone that is a self-proclaimed "product guy, not a developer".

---

*Parachord is an open-source, multi-source music player. [Download the desktop app](https://github.com/Parachord/parachord/releases) for macOS, Windows, or Linux.*
