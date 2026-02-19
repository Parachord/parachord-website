---
layout: post
title: "The parachord:// Protocol: A New Primitive for Music on the Web"
date: 2026-02-19
author: "J Herskowitz"
category: "Technical"
---

Here's a scenario. You're reading a glowing album review on your favorite music blog. The writer is describing a track as "the best shoegaze opener since Loveless." You want to hear it. Right now. So you open a new tab, search for it on whatever streaming service you use, hope you spelled it right, find the track, and hit play. By the time the music starts, you've lost the thread of the review entirely.

This is the broken loop at the center of every music website on the internet. Words about music live in one place. The music itself lives in another. And you -- the reader, the listener -- are the middleware stitching them together manually, every single time.

The `parachord://` protocol handler is our attempt to close that loop.

## What Is It?

Parachord registers a custom URL scheme -- `parachord://` -- that lets any website, application, or script send commands directly to a running Parachord instance. It's the same mechanism that lets `mailto:` links open your email client or `slack://` links jump you into a channel. But instead of email or chat, this one controls music.

The protocol covers the full surface area of the app:

- **Play a track**: `parachord://play?artist=Big%20Thief&title=Vampire%20Empire`
- **Open an artist page**: `parachord://artist/Radiohead/biography`
- **Open an album**: `parachord://album/Bjork/Post`
- **Add to queue**: `parachord://queue/add?artist=Bjork&title=Hyperballad`
- **Search**: `parachord://search?q=artist:Radiohead%20track:Karma%20Police`
- **Import a playlist**: `parachord://import?title=Best%20of%202025&tracks=...`
- **Talk to the AI DJ**: `parachord://chat?prompt=recommend%20albums%20like%20OK%20Computer`

When a user clicks one of these links on a web page and has Parachord running, it just works. The track plays through their own configured sources -- local files, Spotify, Bandcamp, YouTube, whatever they have set up -- resolved through the same [pipeline](/blog/2026/02/03/how-content-resolution-works/) that powers all of Parachord's playback.

The website doesn't need to know which service the listener uses. It doesn't need API keys for Spotify or YouTube. It describes *what* to play, and Parachord figures out *how*.

## Why This Matters for Music Websites

If you build websites about music -- review sites, blogs, recommendation engines, discovery platforms, editorial publications -- you've always faced a fundamental problem: you can write about music, but you can't *play* music. Not really. The best you can do is embed a Spotify widget or a YouTube player and hope your reader has the right account.

The protocol handler changes this in a few concrete ways.

### Music Reviews That Play

Imagine a review site where every album and track mention is a live link. Not a link to Spotify. Not a link to YouTube. A link that plays the music in whatever player the reader has configured:

```html
<p>
  The album's centerpiece is
  <a href="parachord://play?artist=Big%20Thief&title=Vampire%20Empire">Vampire Empire</a>,
  a sprawling seven-minute track that builds from whispered acoustic
  guitar to a full-band crescendo.
</p>
```

A reader clicks "Vampire Empire" and it starts playing. If they have a local FLAC library, that's what plays. If they use Bandcamp, Parachord picks Bandcamp. The review site doesn't care -- it just names the song. Parachord does the rest.

This is useful for the reader, but it's also a philosophical shift for the writer. A review is no longer just *about* music; it becomes a guided listening experience. The critic can structure their argument around specific moments and trust that the reader can hear them in context.

### Recommendation Engines That Actually Deliver

Recommendation engines have an awkward last mile. They can suggest great music, but getting that music to the listener is still a multi-step manual process. Most recommendation sites dump you onto a page full of album covers and service-specific links.

With the protocol handler, a recommendation engine can offer direct actions:

```html
<button onclick="location.href='parachord://play?artist=Arooj%20Aftab&title=Mohabbat'">
  Play Now
</button>
<button onclick="location.href='parachord://queue/add?artist=Arooj%20Aftab&title=Mohabbat'">
  Add to Queue
</button>
<button onclick="location.href='parachord://artist/Arooj%20Aftab'">
  Explore Artist
</button>
```

"Play Now" starts the track immediately. "Add to Queue" slots it after whatever's currently playing -- so the listener can keep browsing recommendations without interrupting their music. "Explore Artist" opens the artist's page in Parachord where they can dig into discography, biography, and related artists.

This turns a recommendation from a suggestion into an action. The listener doesn't leave the recommendation page, doesn't open a new app, doesn't search for anything. They click and the music arrives.

### Curated Playlists as First-Class Web Content

Music publications, blogs, and tastemakers frequently publish curated playlists -- "Best Ambient of 2025," "Essential Post-Punk," "Songs for a Late Night Drive." Today, these exist as either Spotify playlists (excluding everyone who doesn't use Spotify) or plain text lists (requiring manual effort from the reader).

The `parachord://import` command lets any website deliver a complete playlist directly into the reader's library:

```html
<div class="parachord-button"
     data-title="Late Night Drive"
     data-creator="The Music Blog"
     data-tracks='[
       {"title":"Teardrop","artist":"Massive Attack","album":"Mezzanine"},
       {"title":"Roads","artist":"Portishead","album":"Dummy"},
       {"title":"Only Shallow","artist":"My Bloody Valentine","album":"Loveless"},
       {"title":"Sour Times","artist":"Portishead","album":"Dummy"},
       {"title":"Unfinished Sympathy","artist":"Massive Attack","album":"Blue Lines"}
     ]'>
</div>
<script src="https://parachord.com/button.js"></script>
```

That's it. A reader clicks the button, the playlist lands in their Parachord, and every track gets resolved through their own sources. The blog doesn't host any audio. It doesn't need streaming rights. It just publishes metadata -- artist, title, album -- and Parachord handles the rest.

For publications that maintain XSPF playlist files, it's even simpler:

```html
<div class="parachord-button"
     data-xspf-url="https://musicblog.com/playlists/best-of-2025.xspf">
</div>
```

### AI-Powered Discovery Prompts

This one is less obvious but potentially powerful. The protocol supports opening Parachord's AI DJ ([Shuffleupagus](/blog/2026/02/05/parachord-mcp-server/)) with a pre-filled prompt:

```
parachord://chat?prompt=find%20me%20something%20that%20sounds%20like%20this%20album%20but%20more%20experimental
```

A review site could place a "Discover More Like This" button at the end of every review that launches an AI-guided exploration session seeded with the context of what the reader just read about. A discovery platform could let users refine recommendations conversationally: "I liked these three suggestions but want something with more electronic production."

The website provides the starting point. The AI DJ takes it from there, with full access to the listener's library and preferences.

## The Embeddable Button

We've packaged the most common integration pattern -- sending a playlist to Parachord -- into a drop-in JavaScript widget. Include one script tag, add a `div` with data attributes, and you get a styled button that handles everything: detecting whether Parachord is running, sending the playlist via WebSocket if it is, falling back to the `parachord://import` protocol URL if it isn't.

For sites that want more control, the JavaScript API is available:

```javascript
// Send a playlist directly
Parachord.sendPlaylist({
  title: "Staff Picks - February 2026",
  creator: "Indie Music Review",
  tracks: [
    { title: "Karma Police", artist: "Radiohead", album: "OK Computer" },
    { title: "Hyperballad", artist: "Bjork", album: "Post" },
    { title: "Two Headed Boy", artist: "Neutral Milk Hotel", album: "In the Aeroplane Over the Sea" }
  ]
});

// Programmatically create a button and insert it
const btn = Parachord.createButton({
  title: "My Playlist",
  tracks: myTrackArray
}, { label: "Open in Parachord" });

document.querySelector('.playlist-actions').appendChild(btn);
```

This means recommendation engines can dynamically generate playlists based on user input and deliver them with a single function call. A site that surfaces "listeners who liked X also liked Y" results can package those results into a playable playlist on the fly.

## What This Looks Like in Practice

Let's trace through a few concrete scenarios to make this tangible.

**The album review blog.** A writer publishes a review of a new album. Every track title in the review is a `parachord://play` link. At the bottom, a "Listen to the Full Album" button uses `parachord://import` to send all the tracks at once. Readers can sample individual tracks as they read, or import the whole thing and come back to the review later while listening.

**The weekly recommendation newsletter.** A curator sends out ten picks every Friday. Each pick includes a "Play" button (`parachord://play`) and an "Explore" button (`parachord://artist/{name}`). At the top of the newsletter, a "Send All to Parachord" button imports all ten picks as a playlist. Subscribers click once, then have a curated listening session ready to go.

**The genre discovery site.** A platform built around exploring genres and subgenres. Each genre page has a "Starter Playlist" that can be imported via the embeddable button. Individual artist pages link to `parachord://artist/{name}/related` to let users explore connections. Search results use `parachord://search?q={query}` to hand off to Parachord for deeper exploration across the listener's own sources.

**The social listening platform.** A community site where users share and discuss music. Shared tracks are `parachord://play` links. Shared playlists use the import mechanism. User profiles link to `parachord://friend/{id}` for those who have connected their Parachord social features. The site becomes a front-end for music conversation; Parachord handles the playback.

## The Broader Idea

The web is full of music metadata. Reviews, recommendations, charts, discussions, databases -- there's no shortage of structured information about what music exists and why it matters. What's been missing is a clean, service-agnostic way to turn that metadata into playback.

The `parachord://` protocol is a bridge between the web's music metadata and the listener's actual music setup. It doesn't require everyone to use the same streaming service. It doesn't require websites to negotiate licensing deals. It doesn't require embedded players or iframes from specific platforms. It just says: here is a song, here is an artist, here is a playlist. The listener's own software handles the rest.

For people who build music websites, this is a new primitive. Not "link to Spotify" or "embed a YouTube video," but "play this music" -- as a verb that works regardless of where the listener's music comes from.

The full protocol schema is documented on [GitHub](https://github.com/Parachord/parachord/blob/main/docs/protocol-schema.md). If you build something with it, we'd love to hear about it in the [forum](https://github.com/Parachord/parachord/discussions).

---

The `parachord://` protocol is available in all current releases. [Download Parachord](https://github.com/Parachord/parachord/releases) to start using it, or include the [embeddable button](https://github.com/Parachord/parachord/blob/main/docs/protocol-schema.md#embeddable-send-to-parachord-button) on your site today.
