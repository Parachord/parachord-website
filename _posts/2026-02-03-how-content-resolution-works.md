---
layout: post
title: "Under the Hood: How Parachord's Content Resolution Actually Works"
date: 2026-02-03
author: "J Herskowitz"
category: "Technical"
---

When you hit play on a song in Parachord, a lot happens behind the scenes. Today I want to pull back the curtain on how our content resolution system works—the part that makes playing "the same song" from a dozen different sources feel seamless.

## The Core Problem

Traditional music players are simple: you pick a file, they play it. But Parachord's metadata-first approach creates an interesting challenge. When you click play on "Bohemian Rhapsody," we need to:

1. Figure out which of your configured sources have it
2. Pick the best one based on your preferences
3. Handle authentication, streaming, or local file access
4. Manage playback without things stepping on each other
5. Cache the results so we don't repeat this work constantly

Let's break down each piece.

## The Resolution Pipeline

At the heart of Parachord is what we call the **Resolution Pipeline**. When you request a track, the pipeline orchestrates a coordinated query across all your configured resolvers (plugins).

```
User Request (Artist + Album + Track)
         ↓
    Pipeline Orchestrator
         ↓
   ┌─────┴─────┬─────────┬──────────┐
   ↓           ↓         ↓          ↓
Local      Spotify   Bandcamp   YouTube
Files       (wt:90)   (wt:85)    (wt:50)
(wt:100)
   ↓           ↓         ↓          ↓
   └─────┬─────┴─────────┴──────────┘
         ↓
   Score & Rank Results
         ↓
   Return Best Match
```

Each resolver declares a **weight** (1-100). Higher weight means higher preference when multiple sources have the track. But weight is just one factor—we also consider availability, match quality, and whether the source is currently online.

## Confidence Scoring

Not all matches are created equal. When a resolver returns a potential result, we calculate a **confidence score** using weighted Levenshtein distance:

```
score = (artistSimilarity × 4 + albumSimilarity × 1 + trackSimilarity × 5) / 10
```

Notice the weights: track name matters most (5x), then artist (4x), then album (1x). This reflects real-world matching—a live version of a song might have a different album but should still match.

A track is considered **solved** when we have a result with `score > 0.99` from an online source. Partial matches (lower scores) are still tracked—they're useful as fallbacks and for showing "possible matches" in the UI.

## The Fallback Chain

When your preferred source doesn't have a track, Parachord automatically falls back to alternatives. This happens transparently:

1. Query all resolvers in parallel (with per-resolver timeouts)
2. Collect results as they come in
3. Score and rank them
4. Return the highest-scoring available result

If your top-priority resolver (say, your local library) times out or returns nothing, we don't block—we just use the next best match. Each resolver specifies its own timeout, so a slow YouTube search doesn't hold up your local file lookups.

This is why Parachord feels fast even when individual services are slow. We don't wait for everyone; we race them.

## Background Pre-Resolution & The Scheduler

Here's where it gets clever. When you're looking at a playlist or album, we don't wait for you to click play to start resolving. The **Resolution Scheduler** works ahead of time:

**Viewport Prioritization**: Tracks currently visible on screen get resolved first. As you scroll, we dynamically reprioritize. This means the track you're about to click is almost always pre-resolved.

**Queue Lookahead**: We pre-resolve the next few tracks in your queue so playback never stutters waiting for resolution.

**Background Processing**: Tracks further down the list resolve at lower priority, filling in as resources allow.

This scheduler-based approach was a direct response to a pain point in previous implementations of the concept, where you sometimes had to wait for all tracks above you in a list to resolve before getting to the one you wanted. Now, what's visible gets priority.

## Caching

Resolution results are cached aggressively:

- **In-memory cache**: Recent resolutions for instant replay
- **Database persistence**: Results survive app restarts
- **TTL-based invalidation**: We re-check after a configurable period in case availability changes

The cache stores the full result metadata: source, URL, bitrate, duration, and confidence score. When you play a previously-resolved track, we can often skip the pipeline entirely.

Album art gets its own caching layer with lazy loading—we don't fetch artwork until it's about to be displayed, and once fetched, it's cached locally.

## Managing Play State Across Sources

This is where things get interesting. Parachord can play from wildly different backends:

- **HTML5 Audio API**: For direct audio streams (SoundCloud, some Bandcamp, local files)
- **Embedded players**: Spotify Connect, YouTube embeds
- **External apps**: Native Spotify playback via Connect

The challenge: making sure only one thing plays at a time, and that our transport controls (play/pause/skip) work regardless of what's actually producing audio.

### The Unified Transport Layer

We maintain a **single source of truth** for playback state:

```
PlaybackState = {
  status: 'playing' | 'paused' | 'stopped' | 'loading',
  currentSource: Resolver,
  position: number,
  duration: number
}
```

When you hit play on a new track:

1. We issue a **stop command** to the current audio backend
2. Wait for confirmation (or timeout)
3. Initialize the new backend
4. Begin playback
5. Update the unified state

This prevents the classic "two things playing at once" bug. Even if YouTube is slow to respond to a pause command, we don't start the next track until we've confirmed the previous one stopped.

### External Playback Control

Some sources (like Spotify Connect) actually play audio on *their* infrastructure, not ours. For these, we act as a **remote control**:

- Poll for state changes
- Translate our transport commands to their API
- Handle the latency gracefully

The user doesn't need to know whether audio is coming from an HTML5 element, an embedded player, or a cloud service. They just see consistent play/pause/skip buttons that work.

## The Browser Extension

Our browser extension solves two problems:

### One-Click Imports

When you're browsing Spotify, YouTube, or Bandcamp in your browser, the extension detects music content and offers to import it to Parachord. See a playlist you like? One click adds it to your library.

### YouTube Playback Coordination

YouTube is tricky. When Parachord resolves a track to YouTube, we have options for how to play it:

1. **Embedded player in app**: Works, but uses more resources
2. **Browser tab via extension**: Leverages your existing YouTube session

The extension can detect when Parachord wants to play YouTube content and handle playback in a browser tab while reporting state back to the main app. This means:

- Your existing YouTube Premium subscription works (no ads)
- Lower resource usage in the main app
- The extension acts as a playback proxy, translating Parachord's commands to YouTube's player

Play state sync happens over local messaging between the extension and app. When you pause in Parachord, the extension pauses YouTube. When the YouTube video ends, the extension notifies Parachord to advance the queue.

## Volume Normalization

Different sources have wildly different volume levels. A quiet indie track from Bandcamp followed by a remastered classic rock song from Spotify can be jarring.

We handle this at multiple levels:

**Per-source gain adjustment**: Each source type has a baseline gain offset learned from listening patterns.

**ReplayGain/Loudness metadata**: When available (common in local files), we use embedded loudness data to normalize.

**Dynamic normalization**: For streams without metadata, we analyze the first few seconds and apply gain adjustment.

The goal isn't to make everything identical—it's to prevent you from reaching for the volume knob between tracks.

## Putting It All Together

When you press play, here's the full sequence:

1. **Query** → Pipeline asks all resolvers for the track (with viewport prioritization if pre-resolving)
2. **Score** → Results are confidence-scored using fuzzy string matching
3. **Rank** → Results are ranked by (confidence × weight × availability)
4. **Cache check** → Skip to step 6 if we have a valid cached result
5. **Cache store** → Persist the resolution for future use
6. **State management** → Stop current playback, wait for confirmation
7. **Backend selection** → Choose HTML5, embed, or external based on source
8. **Volume adjustment** → Apply normalization for the source
9. **Play** → Hand off to the appropriate audio backend
10. **Sync** → Keep unified state updated as playback progresses

All of this happens in milliseconds for cached content, or a couple seconds at most for fresh resolutions.

## What's Next

We're continuing to refine the resolution system. Some areas we're exploring:

- **Smarter caching**: Predictively caching based on listening patterns
- **Quality preferences**: Letting users prefer high-bitrate sources when available
- **Blocklisting bad results**: Taking input about bad results (particularly from YouTube, Bandcamp and Soundcloud) that may not actually be the song they are purported to be
- **Resolution explanations**: Showing users *why* a particular source was chosen

The goal is always the same: you think about music, not sources. Parachord handles the rest.

---


