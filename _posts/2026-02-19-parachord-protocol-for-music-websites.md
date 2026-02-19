---
layout: post
title: "The parachord:// Protocol: A New Primitive for Music on the Web"
date: 2026-02-19
author: "J Herskowitz"
category: "Technical"
---

Here's a scenario. You're reading a glowing album review on your favorite music blog. The writer is describing a track as "the best indie rock album opener since Geese's 'Trinidad'." You want to hear it. Right now. So you open a new tab, search for it on whatever streaming service you use, hope you spelled it right, find the track, and hit play. By the time the music starts, you've lost the thread of the review entirely.

This is the broken loop at the center of every music website on the internet. Words about music live in one place. The music itself lives in another. And you -- the reader, the listener -- are the middleware stitching them together manually, every single time.

Nobody has solved this, because the pieces haven't existed. You'd need a player that works across services, a protocol that any website can speak, and enough people using both to make the integration worthwhile. It's a chicken-and-egg problem, and we know it. But we think the right approach is to build the protocol first and make it good -- then see what people do with it.

The `parachord://` protocol handler is our attempt to close that loop. Here's what it makes possible.

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

When a user clicks one of these links on a web page and has Parachord running, the track plays through their own configured sources -- local files, Spotify, Bandcamp, YouTube, whatever they have set up -- resolved through the same [pipeline](/blog/2026/02/03/how-content-resolution-works/) that powers all of Parachord's playback.

The website doesn't need to know which service the listener uses. It doesn't need API keys for Spotify or YouTube. It describes *what* to play, and Parachord figures out *how*.

## The Vision for Music Websites

If you build websites about music -- review sites, blogs, recommendation engines, discovery platforms, editorial publications -- you've always faced a fundamental problem: you can write about music, but you can't *play* music. Not really. The best you can do is embed a Spotify widget or a YouTube player and hope your reader has the right account.

We're not pretending that millions of people are going to install Parachord tomorrow. But we wanted to think through what a protocol like this *enables* -- the kinds of experiences that become possible when a music website can say "play this" without caring which service the listener uses. Even if the audience starts small, the patterns are worth exploring.

### Music Reviews That Play

Picture a review site where every album and track mention is a live link. Not a link to Spotify. Not a link to YouTube. A link that plays the music in whatever player the reader has configured:

```html
<p>
  The album's centerpiece is
  <a href="parachord://play?artist=Big%20Thief&title=Vampire%20Empire">Vampire Empire</a>,
  a sprawling seven-minute track that builds from whispered acoustic
  guitar to a full-band crescendo.
</p>
```

A reader with Parachord clicks "Vampire Empire" and it starts playing. If they have a local FLAC library, that's what plays. If they use Bandcamp, Parachord picks Bandcamp. The review site doesn't care -- it just names the song. Parachord does the rest. For readers without Parachord, it's just a regular link that doesn't do anything unexpected.

This is the kind of thing that gets more interesting as adoption grows. A review is no longer just *about* music; it becomes a guided listening experience. The critic can structure their argument around specific moments and trust that the reader can hear them in context. Today, that experience works for a handful of early adopters. But the markup is trivial, the cost of adding it is zero, and it degrades gracefully.

### Recommendation Engines That Actually Deliver

Recommendation engines have an awkward last mile. They can suggest great music, but getting that music to the listener is still a multi-step manual process. Most recommendation sites dump you onto a page full of album covers and service-specific links.

The protocol handler opens up a more direct path. A recommendation engine could offer:

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

This turns a recommendation from a suggestion into an action. No leaving the page, no opening another app, no searching for anything. The music just arrives.

Obviously this only works for listeners who have Parachord. But that's also true of every "Open in Spotify" button on the web today -- those only work for Spotify subscribers. The difference is that a Parachord link works regardless of which underlying service the listener uses. As the user base grows, a single integration covers more listeners than any service-specific button.

### Curated Playlists as First-Class Web Content

Music publications, blogs, and tastemakers frequently publish curated playlists -- "Best Ambient of 2025," "Essential Post-Punk," "Songs for a Late Night Drive." Today, these exist as either Spotify playlists (excluding everyone who doesn't use Spotify) or plain text lists (requiring manual effort from the reader).

The `parachord://import` command could let any website deliver a complete playlist directly into the reader's library:

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

A reader clicks the button, the playlist lands in their Parachord, and every track gets resolved through their own sources. The blog doesn't host any audio. It doesn't need streaming rights. It just publishes metadata -- artist, title, album -- and Parachord handles the rest.

For publications that maintain XSPF playlist files, it's even simpler:

```html
<div class="parachord-button"
     data-xspf-url="https://musicblog.com/playlists/best-of-2025.xspf">
</div>
```

What's appealing about this pattern is that the playlist data is just JSON -- artist names and track titles. It's the same information the blog is already publishing as text. Wrapping it in a structured format and connecting it to Parachord is a small step that creates a much richer experience for the readers who can use it.

### AI-Powered Discovery Prompts

This one is more speculative but potentially powerful. The protocol supports opening Parachord's AI DJ ([Shuffleupagus](/blog/2026/02/05/parachord-mcp-server/)) with a pre-filled prompt:

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

This means recommendation engines could dynamically generate playlists based on user input and deliver them with a single function call. A site that surfaces "listeners who liked X also liked Y" results could package those results into a playable playlist on the fly.

## What Could This Look Like?

Let's imagine a few scenarios where this protocol gets real use. These aren't things that work at scale today -- they're the kinds of experiences we're building toward.

**The album review blog.** A writer publishes a review of a new album. Every track title in the review is a `parachord://play` link. At the bottom, a "Listen to the Full Album" button uses `parachord://import` to send all the tracks at once. Readers who have Parachord can sample individual tracks as they read, or import the whole thing and come back to the review later while listening. Readers who don't have it just see normal text -- nothing breaks.

**The weekly recommendation newsletter.** A curator sends out ten picks every Friday. Each pick includes a "Play" button (`parachord://play`) and an "Explore" button (`parachord://artist/{name}`). At the top of the newsletter, a "Send All to Parachord" button imports all ten picks as a playlist. Even if only a fraction of subscribers use Parachord, the curator adds these links once and they keep working as adoption grows.

**The genre discovery site.** A platform built around exploring genres and subgenres. Each genre page has a "Starter Playlist" that can be imported via the embeddable button. Individual artist pages link to `parachord://artist/{name}/related` to let users explore connections. The site could start by offering Parachord links alongside traditional Spotify/YouTube/Apple Music links, and let usage data tell them which integrations matter.

**The social listening platform.** A community site where users share and discuss music. Shared tracks are `parachord://play` links. Shared playlists use the import mechanism. User profiles link to `parachord://friend/{id}` for those who have connected their Parachord social features. The site becomes a front-end for music conversation; Parachord handles the playback.

## Building the Infrastructure First

We're realistic about where things stand. Parachord is new. The number of people who will click a `parachord://` link today is small. Websites aren't going to rebuild their music integrations around a protocol that reaches a tiny audience.

But that's how protocols work. `mailto:` links weren't useful until people had email clients. RSS wasn't useful until people had feed readers. The protocol comes first, then the adoption, then the ecosystem. You have to build the thing before anyone can use it.

What we can do now is make the protocol comprehensive, well-documented, and easy to integrate. The embeddable button is a few lines of HTML. A `parachord://play` link is just an anchor tag. The cost of adding these alongside existing Spotify and YouTube integrations is near-zero, and they degrade gracefully -- if the user doesn't have Parachord, nothing bad happens.

Our bet is that if the protocol is good enough and the player is good enough, the chicken-and-egg problem eventually resolves itself. A few early adopters add buttons to their sites. A few music nerds install the app. The integration starts to feel useful. More sites add it. More people install it. And gradually, "play this music" becomes a verb that works on the web without being tied to any single service.

We're not there yet. But we think it's worth building toward.

The full protocol schema is documented on [GitHub](https://github.com/Parachord/parachord/blob/main/docs/protocol-schema.md). If you're interested in experimenting with it -- even for a small audience -- we'd love to hear about it in the [forum](https://github.com/Parachord/parachord/discussions).

---

The `parachord://` protocol is available in all current releases. [Download Parachord](https://github.com/Parachord/parachord/releases) to start using it, or explore the [embeddable button docs](https://github.com/Parachord/parachord/blob/main/docs/protocol-schema.md#embeddable-send-to-parachord-button) to see how it could work on your site.
