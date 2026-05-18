---
layout: post
title: "Achordion grows up: identity, feeds, and a tighter Parachord knot"
date: 2026-05-18
author: "J Herskowitz"
category: "Update"
---

Two weeks ago I [introduced Achordion]({% post_url 2026-05-04-introducing-achordion %}) — the web-and-community front door to the open music stack. A week later, the [follow-up post]({% post_url 2026-05-11-the-question-that-woke-me-up %}) was about how Parachord is quietly building a community-owned table of multi-service streaming links every time you play something.

This post is about the social layer that's filled in between then and now — and how the seams between Achordion and Parachord have tightened up around it.

## TL;DR

- **A real identity at the top of every profile**: an auto-written one-sentence bio of what you're spinning right now, plus personality chips, lifetime milestones, and a colorful listener fingerprint glyph derived from your top artists.
- **Cross-platform handshakes**: link your Bluesky once, and your Achordion profile picks up your bsky avatar, bio, and a "Find your Bluesky friends on Achordion" section. Your followers see the linkage as a feed event.
- **A real activity feed** — pins, loves, recommendations, follows, plus four new Achordion-side event types: `loved_recording`, `bsky_friend_linked`, `mention` (when someone `@you` in a pin's blurb), `listen_along` (someone tuned into your stream in Parachord), and `playlist_published` (when a friend flips a playlist public). Unread-count badge in the nav, opt-in browser notifications when there's something new.
- **Playlists got a second life**: a real browsable tab on every profile with filter, sort, lazy cover mosaics, Load-more pagination, an owner-side Public / Private filter pill, an inline visibility toggle on every card, and Delete from the overflow menu.
- **The Parachord knot tightened**: playlist mirror-links that Parachord submits show up as favicon tiles inline with the playlist's action row. The Listen-along pill records a synthetic event everywhere it renders. 

The rest of the post is a tour of the surfaces.

## Identity, not just statistics

ListenBrainz holds your listening data. Achordion's job is to turn that into something that reads as a *person* at a glance — not as a leaderboard or a heatmap.

Three layers stacked on every profile header today:

**The auto-bio**, a single live sentence in the user's voice: *"Currently spinning The Replacements, Quarantine Angst, and Bon Iver."* No one writes it, no one maintains it, the artists link to their pages, and the names rotate as the user's listening shifts. If the profile owner has linked Bluesky, their bsky bio shows here instead — so the two surfaces stay coherent without making anyone write copy twice.

**Archetype chips** — 0–3 personality tags computed from listening patterns. "Night owl" / "Morning listener" from time-of-day peaks. "Same-thing-on-repeat" / "Broad listener" from track concentration. "Discoverer" / "Habitual listener" from how much of this month's top artists are freshly added. Hover any chip and you get a plain-English explanation of why it landed.

**Milestone chips** alongside them — quantitative siblings. Total plays. Exact distinct-artist count (we used to cap that at "500+"; now we read LB's exact total). Current listening streak. "Listening since 2018." Together with the archetype chips they wrap as one identity strip under the bio.

**The fingerprint** — a radial-bar SVG glyph on every profile header. Each wedge is one of that user's top 24 artists. Bar height = relative plays. Color = a deterministic hash of the artist's top genre, so any two listeners with heavy jazz overlap have visible color clusters in their fingerprints — at a glance, you can tell people apart by what they listen to. Hover a wedge to highlight it and see the artist + play count; click to open the artist page.

The whole identity strip costs nothing extra — it's stateless, derived live from LB stats endpoints, and cached at the LB-client layer. Nobody writes anything. Nobody maintains anything. Walk onto any profile and there's a person looking back.

![Achordion profile header showing the auto-bio sentence, archetype + milestone chips, the colorful listener fingerprint glyph, and the user's currently-playing track.](/assets/achordion-profile-header.png){:style="display: block; max-width: 100%; margin: 1.5rem auto; border-radius: 8px;"}

*A profile header in practice — auto-bio under the username, archetype + milestone chips wrapping below it, fingerprint glyph on the right, and the user's currently-spinning track inline with a Listen-along pill.*
{:style="display: block; max-width: 100%; margin: 0 auto 1.5rem; text-align: center; font-size: 0.875rem; color: #6b7280;"}

## Cross-platform identity: Bluesky

Bluesky's been the obvious next-door social graph for music people for a while. Achordion now meets it where it is.

Drop your bsky handle into Settings → put your Achordion profile URL anywhere in your Bluesky bio → done. Two-way handshake, no OAuth, no permissions granted. Your Achordion profile renders your bsky avatar, display name, and bio inline; the avatar swaps into the small pip in the top-right of every page; your bsky avatar flows into every user-card surface across the site (Top Listeners on album pages, Followers / Following / Similar Users, the "Find Bluesky Friends" section in Settings). A linked profile reads as the same person everywhere.

The "Find your Bluesky friends on Achordion" section in Settings surfaces people you follow on Bluesky who've also linked their Achordion profile. Click through to their listening. When someone in your Bluesky network newly links their Achordion, that lands in your /feed as a `bsky_friend_linked` synthetic event with their bsky avatar + a direct link to their bsky.app profile.

Pulled live from Bluesky, never copied to Achordion. Edit your bio over there and it updates here within minutes. Single field, deletable any time. Completely optional; profiles that don't link change nothing.

## The activity feed grew up

The /feed is the social ledger. ListenBrainz emits pins, recommendations, follows, reviews, and "thanks" out of the box — Achordion merges those into the same view your followers see, plus three more event types that LB doesn't emit but that the open music community wants:

- **`loved_recording`** — fan-out over your following list pulling each person's recent feedback. LB's native feed doesn't include loves; we splice them in so a love hits the same surface as a pin does.
- **`bsky_friend_linked`** — described above.
- **`mention`** — when anyone writes `@<your-username>` in a pin's blurb on ListenBrainz, you see the pin in your feed. Mentioned users don't have to follow the author. Built on top of existing LB pin data — no extra writes to your scrobbling history, no Achordion-side scratchpad.

Two more landed in the last week:

- **`listen_along`** — when someone (with Parachord running) clicks the Listen along pill on another user's on-air widget, that's recorded. Followers of the actor see "X listened along with Y in Parachord"; the *target* sees "X tuned into your stream in Parachord"; the actor themselves sees "You listened along with X in Parachord" in their own feed alongside their pins and loves. Same first-class event-row treatment as the LB-native events.
- **`playlist_published`** — when a friend you follow flips a playlist from private to public on LB, that lands in your feed with a linked title. There's a privacy gate at render time: if the owner flips it back to private later, the event quietly disappears from the feed so a follower can't click into a now-private playlist.

There's an unread-count badge in the nav for new activity, and you can opt into browser notifications (Settings → Feed notifications) so the badge pings even when an Achordion tab is just sitting in the background. Permissions are never asked unprompted.

@-mentions render as clickable links anywhere a pin blurb shows up — profile pinned-track cards, the activity feed, the autocomplete suggestions in the pin dialog itself. You can tag people without needing to remember their exact username casing.

![Achordion's My Feed view: synthetic "You listened along with kutx in Parachord" event at the top, followed by loves, pins (one with an @mention rendered as a clickable handle), and follow events from accounts the viewer follows on ListenBrainz.](/assets/achordion-feed-screenshot.png){:style="display: block; max-width: 100%; margin: 1.5rem auto; border-radius: 8px;"}

*The feed in practice — `listen_along` synthetic event at the top, an `@phredspin` mention in an older pin rendered as a link, plus the LB-native loves / pins / follows. Five event sources merging into one stream.*
{:style="display: block; max-width: 100%; margin: 0 auto 1.5rem; text-align: center; font-size: 0.875rem; color: #6b7280;"}

## Pinned songs as a social atom

The pin button on every track was always there, but it now updates instantly. Click pin → toast → your profile and Pins tab paint the new pin in place, no manual reload. The Overview pin and the dedicated Pins tab pull from the same cache slot so they no longer drift; whichever surface you land on first shows the same fresh state.

Combined with the `@-mention` flow, this turns pins into a real social atom: pin a track, write *"@friend you have to hear this — chorus at 1:42"*, and the friend gets the pin in their feed (with the unread-count badge and an opt-in browser notification), with the song embedded inline and one click to play in Parachord.

## Playlists, finally

LB's playlists endpoint is one of the richer surfaces in the API, but it had never gotten the UI love it deserves. Today every profile has a full **Playlists** tab that:

- Browses with **filter-as-you-type** (matches title + description).
- **Sorts** by Modified / Created / Title, both directions.
- **Streams in 2×2 cover mosaics** lazily per card as you scroll, so the page paints fast and the LB calls only fire for cards you actually see.
- **Loads more** past the first hundred with the same scroll-into-view UX.
- **On your own profile**, surfaces a Public / Private / All pill so you can scope the list.

Every card on your own profile has an **inline visibility toggle** — flip Public ↔ Private without opening the playlist. The per-playlist overflow menu now has a **Delete playlist** action (with a confirm dialog, since LB has no undelete). Clicking the card navigates to the playlist; clicking the toggle pill flips visibility; the two interactions don't conflict thanks to a stretched-link pattern on the card.

## The Parachord knot tightened

A few smaller pieces that close some loops:

**Playlist mirror-links from Parachord.** Per the [previous post]({% post_url 2026-05-11-the-question-that-woke-me-up %}), Parachord submits the streaming URLs it resolves back to Achordion. For playlists, those mirror links now render as favicon tiles right next to the playlist's overflow menu — same visual pattern as the recording and album pages. 

**Listen-along beacon, anywhere the pill renders.** The Listen along pill exists in three places — profile headers, user cards in lists, and the compact now-playing pill — and all three now fire the same beacon when Parachord is confirmed connected. The shared `<ListenAlongLink>` component is the only thing that knows about the beacon shape, so future surfaces get the integration for free.


## What's behind the curtain

Almost every new event type lives behind a feature flag (`listen-along-events`, `playlist-published-events`, `mentions`, `bsky-link`, etc.) so we can roll them out gradually and have a kill switch when something goes sideways. The flag system is documented in `AGENTS.md` if you want to poke at it.

The synthetic-event pipeline now handles five non-LB event types, all sharing the same `FeedEvent` shape so a single renderer dispatches them. Adding a sixth is a small PR: index helper + reader + renderer branch + flag definition. The architecture is intentionally cheap to extend, because the open-community front-end keeps growing surfaces.


## Try it

If you haven't been back to [achordion.xyz](https://achordion.xyz) since launch — your profile probably has a different identity now than the last time you looked. Pop in and see what the fingerprint glyph and the auto-bio say about you.

If you've got Parachord open already, every Listen along pill on every profile now contributes a real-time event to your feed (and your followers'). Click around. Tune into someone whose taste you trust. See what happens.

And as ever — if there's a missing relationship on an artist or album page, that's a one-click hop into MusicBrainz. Every fix benefits every client running on top of MB, not just Achordion. The whole open stack gets a little better. That's the bet.
