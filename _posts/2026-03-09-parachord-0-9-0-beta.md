---
layout: post
title: "Parachord 0.9.0-beta.1: Turn Down the House Lights and Let's Start the Show "
date: 2026-03-09
author: "J Herskowitz"
category: "Announcement"
---

This is a big one. Parachord 0.9.0-beta.1 brings three headline features -- dark mode, live concert discovery, and a much more reliable Fresh Drops experience -- along with performance work, bug fixes, API resilience, and a pile of UI refinements across the board.

## Concerts -- Live Music Discovery

There's a brand new Concerts page that aggregates upcoming shows from a number of new concert event plug-ins from Bandsintown, Songkick, SeatGeek, and Ticketmaster into a single view. It uses IP-based geolocation (with multiple fallback services) to show you shows near you, and matches performing artists against your listening history and collection so the most relevant concerts float to the top.

Even better: when you're listening to an artist who's currently on tour, an "On Tour" indicator shows up next to their name in the now-playing bar, linking directly to their nearby shows. Concert data loads in the background so it never slows down the rest of the app, and results are cached for 24 hours to keep things fast.

If an artist has upcoming concerts, then their artist page will also get a new 4th tab, On Tour, that will display them all - independent of your current location.

![On Tour](/assets/ontour-artist-page.png)

## Dark Mode & Theming

I joked that I wondered when I first made Parachord public how long it would take someone to request dark mode - and as expected it was one of the first feature requests that came it. Well, as I was cleaning up some UI inconsistencies I just went ahead and added full dark mode support. Over 365 hardcoded color values have been replaced with a proper design token system using CSS custom properties -- dedicated tokens for surfaces, text, borders, and accents. Every component, every focus ring, every tooltip respects the active theme.

You can now choose between Light, Dark, or System (which follows your OS preference) in Settings. 

![Dark Mode](/assets/ontour-now-playing.png)

## Fresh Drops, Now Actually Reliable

Fresh Drops -- the feature that surfaces new releases from artists you listen to -- has been overhauled for reliability. Previous versions had a stale cache loop that could cause the feature to quietly stop updating between sessions. That's fixed. Full re-scans now trigger properly after 24 hours and will build over time.

On the visual side, the filter dropdown has been replaced with pill-style buttons that are color-coded by release type: purple for EPs, pink for Singles, blue for Albums.

![Fresh Drops](/assets/fresh-drops.png)

## Faster Startup

Multiple sequential calls during startup have been consolidated into a single batch calls. This is one of those changes that's invisible but you'll feel it -- cold starts are noticeably snappier, especially on machines with slower disk I/O. I also fixed a nasty bug where Mac users on Apple silicon were getting auto-updated to the Intel builds - which you would feel instantly and get lots of visits from the dreaded pinwheel on almost every interaction. Sorry about that!

## Spotify API Resilience

Transient server errors (502, 503, 504) from the Spotify API now trigger automatic retries with exponential backoff. Token refresh has also been improved to happen proactively during playback, so you won't hit mid-session authentication failures that interrupt what you're listening to or syncing in the background.

## Smarter Artist Lookups

MusicBrainz search results are now validated using normalized, punctuation-stripped name comparison instead of blindly trusting confidence scores. When MusicBrainz returns fewer than 3 results, fallback sources -- Spotify, Apple Music, Last.fm, and Discogs -- kick in automatically. The result is fewer wrong-artist matches and better coverage for smaller artists or those with unusual names or limited MusicBrainz presence.

## Browser Extension & Raycast

The Parachord browser extension is now officially published on both the [Chrome Web Store](https://chromewebstore.google.com/detail/parachord/gibkgapadebfoillbakpgmgpnppjlnie) and [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/parachord/). The Raycast extension has been updated with security fixes and documentation - so you will soon be able to more easily install it from the Raycast store.

![Parachord Browser Extension](/assets/applemusic-import.png)

## UI Polish & Bug Fixes

A lot of small things that add up:

- Search tab styling now matches the rest of the sidebar
- Album and playlist columns are sticky, so they scroll independently
- Sidebar no longer shifts layout when friend activity updates come in
- Dark mode tooltips and the queue drawer have better contrast
- Artist header tabs have stronger text shadows for readability
- Focus styling is consistent across filter pills and interactive elements
- Artist suggestions now properly load full discography
- Playlist resolution no longer gets interrupted mid-resolve
- Shimmer animations on loading skeletons render correctly
- Concert cache respects expiration instead of serving stale data
- GeoIP fallback chain works when primary services are down
- Navigation state no longer goes stale after app restart

If you are having issues - particularly with Spotify syncing or Apple Music authentication - please file a [bug](https://github.com/Parachord/parachord/issues) and attach a console log. It will be much appreciated and incredibly helpful as I'm basically working blind on some of these issues and platforms (I'm looking at you Windows and Linux).

---

Parachord 0.9.0-beta.1 is available now. [Download it from GitHub](https://github.com/Parachord/parachord/releases) and let us know what you think.
