---
layout: post
title: "Almost Sunk on Sync"
date: 2026-06-25
author: "J Herskowitz"
category: "Technical"
---

After a long history of promises, last week I basically got the Parachord iOS app to feature parity with the Android and desktop apps. Multi-servcie content resoltuion, playback engine(s), catalog, scrobbling, the chat DJ, the social stuff, the Achordion integration and more. All of it working on my iPad (I don't own an iPhone). I probably could have shipped it but there was one part of Parachord I kept circling back to and quietly dreading, because I knew my first version of it was too simple to survive contact with real people: playlist sync.

When I first wired sync up, I did the obvious thing. Pick one service as the source of truth, read the playlist from there, and copy it out to the others. That works beautifully in a demo - and even in most of my day-to-day use cases, but it falls apart the moment you do the thing everyone actually does, which is edit a playlist wherever you happen to be standing.

And the stakes went up when Achordion, via ListenBrainz integration, became the default way Parachord shares playlists. If sharing a playlist is going to be a first-class thing people do, then the playlist behind that share has to actually stay correct. So before iOS goes out, I went back to fix the foundation. This is the story of that, including why it has taken days of work and more design rewrites than I want to admit.

## What I actually want sync to do

Here is the plain version... I want to edit a playlist on any surface and have it stay right everywhere. Add three songs in the Spotify app on my laptop. Reorder it in Apple Music on my phone. Drop a track from inside Parachord. Whichever one I touched, the others should quietly catch up, and nobody's edit should silently stomp on anyone else's.

That "any surface" part is the whole game. It is not "one source copy and a bunch of dumb mirrors." Every copy can be the one you just edited. I have been calling this N-way sync, which is a pseudo-techie way of saying there is no single boss copy. They are all equal, and they all have to agree in the end.

My old approach could not do this. If Spotify was the boss and you edited the Apple Music copy, your edit was wrong by definition and got wiped on the next sync. That is fine for "import my Spotify playlists into the app." It is useless for "this is my playlist and I edit it from wherever."

Once you have real N-way sync, a door opens that I am genuinely excited about. Collaborative playlists that work across services. You live in Spotify, your friend lives in Apple Music, and you are both adding to the same list. Today that is impossible unless you both happen to use the same app. If the syncing underneath is solid, the service each person uses stops mattering. The playlist becomes the shared thing, and the app you open it in is just a window. That is the future I am building toward, and ListenBrainz is the neutral ground in the middle that makes it possible.

![The Parachord iOS Playlists screen on an iPad. Each playlist row shows a small chip for every streaming service it is mirrored to: Spotify in green, Apple Music in red, ListenBrainz in orange.](/assets/ios-playlists.png){:style="display: block; max-width: 420px; width: 100%; margin: 1.5rem auto; border-radius: 8px;"}

*The Playlists tab on my iPad. The little chips under each playlist show every service that copy is mirrored to, so you can tell at a glance where a list lives. Daily Brew, the self-rewriting playlist I get into below, is sitting right there in the middle.*
{:style="display: block; max-width: 100%; margin: 0 auto 1.5rem; text-align: center; font-size: 0.875rem; color: #6b7280;"}

## Why this is so much harder than it sounds

The first wrong assumption I had to throw away was "a playlist is a list of songs." It is not. It is a list of songs on Spotify, and a different list of identifiers on Apple Music, and yet another set on ListenBrainz. The same song usually has a different code on each service. So before the engine can even ask "did anything change," it has to first figure out that Spotify's track over here, Apple Music's track over there, and ListenBrainz's recording in the corner are all the same song.

We do that by matching on the industry song code first (the ISRC for you fellow metadata nerds), falling back to a MusicBrainz identifier when there is no ISRC, and falling back one more time to a cleaned-up comparison of the title and artist. Get that matching wrong in either direction and you are sunk. Miss a match and sync thinks a song was deleted and re-added when nothing happened. Make a false match and it merges two different songs. A surprising amount of this project was just getting "are these the same song" reliably right across three services that each name things their own way.

I have been pairing with Claude Opus 4.8 at its highest effort setting for the better part of a week on this, and I have rewritten the core design several times. Not because the code was wrong, but because each rewrite taught me the model of the problem I started with was too naive.

## The surprises that ate the most time

Three problems I did not see coming, all of which showed up only with real playlists and real services.

**Playlists that rewrite themselves.** Some playlists change every day on their own. Spotify's algorithimic playlists may rotate dozens of songs a day. A radio station rewind playlist (like the ones I created at https://achordion.xyz/radio/rewind) swaps its entire contents every night. The first time I mirrored one of those into Apple Music, whose API can add songs but cannot remove them, the playlist just grew and grew. A forty-song playlist climbed past five hundred, because every day's dropped songs had nowhere to go and nothing was allowed to take them out. The fix was teaching the engine that a source playlist is allowed to shrink, and the mirrors have to honor that, instead of treating every song that ever appeared as something to preserve forever.

**Mirrors coming back from the dead.** I deleted some duplicate playlists by hand, including off the services themselves, and the very next sync politely recreated them. The engine saw a playlist it had a record of, did not find it on the service, and "helpfully" remade it as a fresh duplicate. So my own deletions were fighting the sync engine, and the sync engine was winning. The fix was to actually check whether a playlist is really gone before reacting, and if it genuinely is gone, to quietly stop syncing it rather than resurrect it. You delete it once on your phone, and the other copies take the hint instead of stubbornly rebuilding it.

**A bad network moment deleting your library.** This is the one that kept us spinning. If a service hiccups and hands back only half your playlists, a naive engine reads the missing half as "deleted" and removes them. One flaky Wi-Fi moment and your collection gets quietly culled. So the rule now is that nothing is deleted unless we can positively confirm it is actually gone, by asking the service directly about that one playlist. And if a suspiciously large number of playlists vanish at once, we assume the service is just having a bad moment and we do nothing at all. Under-reacting is always safer than deleting someone's playlists.

## How I worked on something this risky

Every one of those fixes started as a written spec, not as code. When the cost of a bug is "we deleted your playlists," you do not get to wing it. I write the design down, argue with it on paper, and only then build it test-first. The decision logic that decides whether a song is really gone is a small pile of pure functions with their own tests, separate from all the database and network plumbing, so I can prove it behaves before it ever touches your data.

Then comes a step I have leaned on more and more. I run an adversarial review, where a set of agents goes through the change specifically trying to poke holes in it, each from a different angle: safety, behavior changes, edge cases, weak tests. On this last batch it surfaced one real bug (we were writing a setting before deleting a record, which could have stranded a leftover in a crash), flagged four tests I was missing, and raised two alarms that turned out to be false but were worth proving false with a new test. That review loop has caught things I would have shipped, more than once.

## The two outside constraints that make this genuinely unfair

Some of this difficulty is self-inflicted. Some of it is just the hand the services deal you.

**Spotify's rate limits, on a key you share across devices.** Spotify recently moved to allowing one active app key per user - and Parachord is built on a "bring your own key" model. The practical effect is that Parachord on your laptop and Parachord on your phone are drinking from the same straw. A burst of requests from either one can get your whole account temporarily throttled, and worse, Spotify's throttle for that situation lasts far longer than it tells you it will. I have watched it stay angry for twelve hours after a quiet night. So the engine has to be deeply polite: back off, space requests out, and when it does get throttled, get more patient each time instead of poking the bear again the moment the timer is up. That restraint is shared between desktop and mobile, because they are sharing the consequences.

**Apple Music has no delete.** This one is just a wall. Apple Music's playlist API lets you add songs to a playlist. It does not let you remove a song, it does not let you delete a playlist, and it does not let you rename one. Those endpoints simply do not exist for third-party apps. So Apple Music can only ever be a one-way street: songs flow in, nothing comes out. We work around it as gracefully as we can, but there is no clever trick that conjures an endpoint Apple has not built. So, sincerely: Apple, if anyone over there ever reads this, please add the ability to remove songs and delete playlists through your API. It would immediately make cross-service playlists better for everyone, not just us.

## The engine doesn't actually know what Spotify is

Here is the part of the rebuild I am proudest of, and it came straight out of the Apple Music headache above. When one service can do something and another cannot, you have two choices. You can litter the engine with "if this is Apple Music, skip the remove step" checks, which rots fast and turns every new service into open-heart surgery. Or you can make the engine stop caring which service it is talking to at all.

I went with the second one. Each service is a small adapter that just declares what it is capable of: can it import a playlist, can it add songs, can it remove a song, and if so does it remove by the song's address (the way Spotify does) or by its position in the list (the way ListenBrainz does), can it reorder, can it delete. The engine never asks "is this Spotify." It asks "can this thing remove a song," and routes accordingly. Apple Music's add-only nature is not a special case buried in the logic anymore. It is one honest line in the Apple Music adapter that says "removing is not supported," and the engine does the safe thing on its own.

The reason that matters to you, and not just to me, is what it unlocks next. Today Parachord syncs Spotify, Apple Music, and ListenBrainz. But Tidal, Qobuz, and Amazon Music are all services people keep asking me about. The day any of them exposes APIs that lets us resolve, play, add, remove, and manage tracks properly, adding full Parachord support is mostly writing one new adapter that answers those same few questions, then registering it. The hard part - the song matching, the safety rules, the convergence logic, the rate-limit manners - is already built, already tested, and shared across every service at once. I do not have to reopen the engine. Each new service makes the "edit it anywhere" promise reach a little further, and the cost of getting there keeps going down instead of up.

The honest caveat is that the services have to meet us partway. Several of them either have no public playlist write access today or keep it locked behind a commercial partnership. I cannot will those endpoints into existence any more than I can talk Apple into a delete button. But the plumbing on our side is ready, so the moment a service opens the door, Parachord can walk through it without a rewrite.

## Four moving targets at once

Here is the part that compounds everything. This same problem has to be solved four times, in four places, and they all have to agree.

There is the desktop app, there is iOS and Android, and there is Achordion - which all have to read and display whatever the apps wrote.

The one piece of real leverage I have is that iOS and Android share a single sync engine. That is the whole reason I moved Parachord's guts to shared Kotlin code last month, and it paid off exactly here. I did not write this engine twice. I wrote it once, and both platforms run the same logic, the same identity matching, the same safety rules. A fix I made today for an iPad bug is already live on Android, because it is literally the same code.

Desktop is the odd one out, because it is a different language, so the same design has to be ported by hand over there. The way I keep the two from drifting apart is by treating the test cases as the contract. The exact scenarios the mobile engine is proven against become the scenarios the desktop engine has to pass too. When I land a design change on mobile, I write it up as a specific delta for the desktop port, with the reasoning, so the desktop version converges on the same behavior instead of quietly inventing its own. That is the discipline that keeps "the same playlist" actually meaning the same thing no matter which app you opened.

## It's probably still not right

I want to be honest about where this stands. I have a model now that I believe in, that is tested pretty hard, and that fixes the concrete failures I have been able to reproduce so far. But sync is the kind of problem where the bugs live in the situations you did not think to test. The weird playlist. The flaky connection at exactly the wrong second. The combination of three services behaving in three ways on the same edit.

I cannot find those alone. So the real ask of this post is simple: use it, and when a playlist does something that surprises you, tell me. A song that should have moved and didn't. A copy that drifted. A duplicate that came back. Every report points me at a case I could not dream up at my desk, and this is the kind of thing that only gets truly solved out in the world.

## What works where today

A quick honest map of what each service can and cannot do as a sync target right now. ListenBrainz is the open, community-owned home for this data, and Achordion is Parachord's web layer that sits on top of ListenBrainz, so when you share a playlist to ListenBrainz it shows up with a real page on Achordion.

| What you can do | Spotify | Apple Music | ListenBrainz (shown on Achordion) |
| --- | :---: | :---: | :---: |
| Import a playlist into Parachord | Yes | Yes | Yes |
| Mirror a Parachord playlist out to it | Yes | Yes, add-only | Yes |
| Add songs | Yes | Yes | Yes |
| Remove songs | Yes | No, no API | Yes |
| Reorder or rename | Yes | No, no API | Yes |
| Delete the playlist from the app | Yes | No, no API | Yes |

The Apple Music column is not me being lazy. Every "No" there is an endpoint Apple has chosen not to offer. The ListenBrainz column is full of "Yes" because the open stack was built by people who actually wanted this to work, and that is a big part of why it is becoming the default place Parachord shares your music.

If you want to follow the gory details, the mobile work is public at [github.com/Parachord/parachord-mobile](https://github.com/Parachord/parachord-mobile), and the design write-ups live in the `docs/` folder. I went deep on the cross-platform reasoning back in [the re-architecture post]({% post_url 2026-04-12-why-were-re-architecting-before-shipping-android %}), and on why the open music stack matters in [the Achordion posts]({% post_url 2026-05-18-achordion-the-community-layer %}).

Thanks for reading, and thanks in advance to everyone who reports the weird ones once you get your hands on the mobile apps.

J
_(I'm @jherskowitz pretty much everywhere - except X)_

---

*Parachord is an open-source, multi-source music player. [Download the desktop app](https://github.com/Parachord/parachord/releases) for macOS, Windows, or Linux.*
