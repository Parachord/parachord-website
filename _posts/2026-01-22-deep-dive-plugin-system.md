---
layout: post
title: "Deep Dive: How Parachord's Plugin System Works"
date: 2026-01-22
author: "Parachord Team"
category: "Technical"
---

One of the most powerful features of Parachord is its plugin architecture. Today we're pulling back the curtain on how it all works.

## The Philosophy

We believe you should control your music experience. That means being able to:

- Add new music sources without waiting for us
- Customize how music is resolved and played
- Integrate with services we haven't even thought of yet

## Plugin Categories

Parachord plugins fall into four main categories:

### 1. Streaming Plugins

These connect to music streaming services like Spotify, YouTube, Bandcamp, and Qobuz. They handle authentication, searching, and playback.

### 2. Metadata Plugins

Metadata plugins enrich your library with information from sources like MusicBrainz, Discogs, and Wikipedia. They help ensure accurate matching across services.

### 3. Social Plugins

Connect to scrobbling services like Last.fm and ListenBrainz. Track your listening history and get personalized recommendations.

### 4. AI Plugins

The newest category. These plugins connect to AI services like ChatGPT and Gemini for intelligent playlist generation and music discovery.

## Priority System

Here's where it gets interesting. You can set a priority order for your plugins. When you want to play a song, Parachord will:

1. Look up the song's metadata
2. Query your plugins in priority order
3. Play from the first source that has it available

This means you can always prefer Bandcamp to support artists, fall back to Spotify for convenience, and use YouTube as a last resort for rare content.

## Building Your Own

Our plugin SDK is open source and well-documented. If you know JavaScript, you can build a plugin in an afternoon. We'll be releasing the SDK alongside our early access launch.

Stay tuned for more technical deep dives!
