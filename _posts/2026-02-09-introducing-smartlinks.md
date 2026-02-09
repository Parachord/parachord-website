---
layout: post
title: "Smartlinks: Share Music That Just Works"
date: 2026-02-09
author: "Parachord Team"
category: "Features"
---

You found an incredible album. You want to share it with a friend. But they're on Spotify and you found it on Bandcamp. Or maybe you're texting a group chat where half the people use YouTube and the other half have Apple Music. So you either send a service-specific link that only works for some of them, or you just say "check out this album" and hope for the best.

Smartlinks fix this.

## What Are Smartlinks?

A Parachord smartlink is a single, shareable URL that represents a song, album, or playlist -- independent of any particular streaming service. When someone opens it, they get a clean, universal link page that shows what the music is and lets them open it in whichever streaming service they use:

<iframe src="https://go.parachord.com/ebc91109/embed" width="400" height="152" frameborder="0" style="border-radius: 8px;" allow="encrypted-media"></iframe>


No account required. No app to install. Just a link that works in any browser, on any device, with direct links to Spotify, Apple Music, YouTube, Bandcamp, and more.

You can embed smartlinks in blogs, social posts, newsletters, or anywhere else you share music. They look good, they work everywhere, and they let the listener choose their preferred service.

## The Magic: It Just Plays

Here's where it gets interesting. If the person clicking your smartlink has Parachord running on their machine, something different happens. Instead of just showing the link page, the music **starts playing in Parachord itself** -- resolved through their own configured sources, at their preferred quality, with their own plugin priorities.

No extra steps. No "open in app" button to click. It just plays.

### How Does That Work?

When Parachord is running, it registers as a handler for `go.parachord.com` links. When you click a smartlink (or it's detected in your browser via the extension), Parachord intercepts the request and extracts the track metadata encoded in the link -- artist, album, track name.

From there, it's the same [resolution pipeline](/blog/2026/02/03/how-content-resolution-works/) that powers all of Parachord's playback:

1. **Metadata extraction** -- The smartlink carries enough information to identify the track unambiguously
2. **Resolver fan-out** -- Parachord queries all your configured plugins in parallel: local files, Spotify, Bandcamp, YouTube, Qobuz, whatever you have set up
3. **Confidence scoring** -- Each result gets scored using fuzzy string matching (track name weighted 5x, artist 4x, album 1x)
4. **Priority ranking** -- Results are ranked by confidence, source weight, and availability
5. **Playback** -- The best match starts playing through the unified transport layer

If you have the track in your local FLAC library, that's what plays. If you prefer Bandcamp, Parachord picks Bandcamp. If only YouTube has it, YouTube it is. The smartlink doesn't care where the music comes from -- it just describes *what* the music is and lets your Parachord installation figure out the rest.

And because the resolution pipeline caches results, the second time you play that same smartlink it's essentially instant.

## For Everyone Else

Not everyone has Parachord (yet). That's fine. When someone without Parachord opens a smartlink, they get the universal link page -- a clean, good-looking landing page that identifies the song and gives them direct links to open it on Spotify, Apple Music, YouTube, Bandcamp, Tidal, and other services.

The same link works for everyone. Parachord users get the full integrated experience. Everyone else gets a one-click path to their preferred service. Nobody gets a broken link.

## Creating Smartlinks

Creating a smartlink is simple. In Parachord, right-click any track, album, or playlist and choose **Share as Smartlink**. You get a `go.parachord.com` URL that you can paste anywhere.

## Why This Matters

Music sharing has been broken for years. Every streaming service has its own link format, its own walled garden. Sending someone a Spotify link when they don't have Spotify is like faxing someone who doesn't have a fax machine.

Smartlinks take the Parachord philosophy -- your music is everywhere, now you don't have to be -- and extend it to sharing. One link, every listener, every service. The way sharing music should have always worked.

---

Smartlinks are available now. [Sign up for early access](https://parachord.com/#signup) to start sharing music that just works.
