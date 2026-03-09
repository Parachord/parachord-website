---
layout: post
title: "Parachord 0.9.0-beta.1: Dark Mode, Concerts, and a Whole Lot of Polish"
date: 2026-03-09
author: "J Herskowitz"
category: "Announcement"
---

This is a big one. Parachord 0.9.0-beta.1 brings three headline features -- dark mode, live concert discovery, and a much more reliable Fresh Drops experience -- along with performance work, API resilience, and a pile of UI refinements across the board.

## Dark Mode & Theming

Parachord now has full dark mode support, and it's not just an inverted color scheme slapped on top. Over 365 hardcoded color values have been replaced with a proper design token system using CSS custom properties -- dedicated tokens for surfaces, text, borders, and accents. Every component, every focus ring, every tooltip respects the active theme.

You can choose between Light, Dark, or System (which follows your OS preference) in Settings. And because nobody wants a blinding white flash at 2am while their OS is set to dark mode, Parachord pre-applies the dark class before the window even renders. No flash. Just dark.

## Concerts -- Live Music Discovery

There's a brand new Concerts page that aggregates upcoming shows from Bandsintown, Songkick, SeatGeek, and Ticketmaster into a single view. It uses IP-based geolocation (with multiple fallback services) to show you shows near you, and matches performing artists against your listening history so the most relevant concerts float to the top.

Even better: when you're listening to an artist who's currently on tour, an "On Tour" indicator shows up next to their name in the now-playing bar, linking directly to their nearby shows. Concert data loads in the background so it never slows down the rest of the app, and results are cached for 24 hours to keep things fast.

We've also added four new concert data plugins to the marketplace, so there's a dedicated category for concert sources if you want to customize where your data comes from.

## Fresh Drops, Now Actually Reliable

Fresh Drops -- the feature that surfaces new releases from artists you listen to -- has been overhauled for reliability. Previous versions had a stale cache loop that could cause the feature to quietly stop updating between sessions. That's fixed. Full re-scans now trigger properly after 24 hours, with `lastFullScan` tracked separately from regular cache timestamps. Artist sources are shuffled on each cycle so you get genuine discovery variety rather than the same sources dominating.

On the visual side, the filter dropdown has been replaced with pill-style buttons that are color-coded by release type: purple for EPs, pink for Singles, blue for Albums.

## Faster Startup

Multiple sequential `store.get()` calls during startup have been consolidated into a single batch IPC roundtrip. This is one of those changes that's invisible but you'll feel it -- cold starts are noticeably snappier, especially on machines with slower disk I/O.

## Spotify API Resilience

Transient server errors (502, 503, 504) from the Spotify API now trigger automatic retries with exponential backoff up to 30 seconds. Token refresh has also been improved to happen proactively during playback, so you won't hit mid-session authentication failures that interrupt what you're listening to.

## Smarter Artist Lookups

MusicBrainz search results are now validated using normalized, punctuation-stripped name comparison instead of blindly trusting confidence scores. When MusicBrainz returns fewer than 3 results, fallback sources -- Spotify, Apple Music, Last.fm, and Discogs -- kick in automatically. The result is fewer wrong-artist matches and better coverage for artists with unusual names or limited MusicBrainz presence.

## Browser Extension & Raycast

The Parachord browser extension is now officially published on both the Chrome Web Store and Firefox Add-ons with proper logos and branding. The Raycast extension has been updated with security fixes and ESLint configuration in preparation for Raycast Store publishing.

## UI Polish

A lot of small things that add up:

- Search tab styling now matches the rest of the sidebar
- Album and playlist columns are sticky, so they scroll independently
- Sidebar no longer shifts layout when friend activity updates come in
- Dark mode tooltips and the queue drawer have better contrast
- Artist header tabs have stronger text shadows for readability
- Focus styling is consistent across filter pills and interactive elements

## Bug Fixes

- Artist suggestions now properly load full discography
- Playlist resolution no longer gets interrupted mid-resolve
- Shimmer animations on loading skeletons render correctly
- Concert cache respects expiration instead of serving stale data
- GeoIP fallback chain works when primary services are down
- Navigation state no longer goes stale after app restart

---

Parachord 0.9.0-beta.1 is available now. [Download it from GitHub](https://github.com/Parachord/parachord/releases) and let us know what you think.
