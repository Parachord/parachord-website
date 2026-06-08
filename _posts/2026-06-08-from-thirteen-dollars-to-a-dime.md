---
layout: post
title: "Battling bots: keeping a hobby music site cheap to run"
date: 2026-06-08
author: "J Herskowitz"
category: "Engineering"
---

Parachord is a one-person hobby project. I build all of it for fun and love: the desktop app, the Android app, the iOS app (I just started) and [Achordion]({% post_url 2026-05-04-introducing-achordion %}), the companion website to it all. All of it is open-source, none of it earns money, and I pay for all of the infrastructure out of my own pocket.

This post is about the part of that infrastructure that surprised me. Parachord apps run on your own device - and call various endpoints and services directly, so they cost me almost nothing to operate. Achordion is different. It is a real website, hosted on Vercel, which is a cloud platform that runs web apps for you and bills you based on how much they get used. Last week, Achordion's Vercel bill quietly climbed to a high of about thirteen dollars a day.

Thirteen dollars a day is roughly four hundred dollars a month. For a side project with no revenue, that is not a rounding error. That is the difference between "a fun thing I happily keep running" and "I cannot justify leaving this on." Yesterday the bill was ten cents. This post is about the week in between, and why the fixes that brought it down turned out to be the exact same work as making the site faster and more reliable for the people who actually use it.

## Why a few dollars a day is a big deal when it is your money

If you work at a company, four hundred dollars a month of cloud spend is invisible. It does not even clear the threshold where anyone asks a question. A hobby project is the opposite. There is no budget, no business model, and no one to expense it to. There is just me, deciding every month whether this is still worth paying for.

That changes how you think about cost. It stops being an optimization you might get to someday and becomes a feature, on the same footing as speed or reliability. A runaway bill is not a line item to trim later. For a hobby project it is an existential risk, because the moment it stops being fun and starts being expensive, it gets turned off. So keeping Achordion cheap is not penny pinching. It is what keeps the lights on.

## A website is a different animal than an app

I have spent most of this year building the Parachord apps, and in all that time, hosting cost and bots were simply never a concern. An app runs on the user's device. It talks out to services, it does its work locally, and when it is done it goes quiet. There is no server with my name on it sitting on the public internet, and nothing for a stranger to come poking at. My "scaling" concerns were things like memory use on a laptop.

Achordion broke that comfortable arrangement, because a website is the opposite of an app in the way that matters here. It is a machine with a public address, sitting there around the clock, answering anyone who asks. And "anyone" turns out to include a lot of things that are not people. This was genuinely new territory for me. Most of what follows is stuff that I hadn't had to think about, and that I had to learn in a hurry the first time my hobby started sending me a real bill.

## Where the money was going

Vercel breaks usage into line items, and three of them were doing the damage: Observability, Fluid Provisioned Memory, and Fluid Active CPU. In plain terms:

- **Observability** was a monitoring add-on that bills for every event it records (and one that Vercel rather sneakily let get enabled without me realizing it). Two thirds of those events were not user traffic at all. They were my own server logging each call it made out to other services.
- **Fluid Provisioned Memory** bills for the memory a function holds while it is alive, including time it spends just waiting on a slow external API.
- **Fluid Active CPU** bills for actual compute, and was the smallest of the three, which was itself a clue: the site was not working hard, it was waiting.

Underneath all three sat the same root cause. Achordion pulls almost everything it shows from MusicBrainz and ListenBrainz, and talking to those services is slow by design.

## The thing underneath all of it: being a good MusicBrainz citizen

MusicBrainz is a free, community run, donation funded music database. It is the kind of open infrastructure the whole project is built to celebrate. In return for being free, it asks consumers to play nice: identify yourself, and keep it to roughly one request per second. That is a completely reasonable ask, and honoring it is non negotiable. You do not get to hammer a nonprofit because your page is slow.

But one request per second has consequences. An artist page might need the artist, their releases, similar artists, top tracks, and a biography. If none of that is cached, those calls line up one second apart, and the page sits there building for several seconds before it can answer. On Vercel's pricing model, "sitting there waiting" is not free. You pay for the memory the whole time. So a slow page is also an expensive page, and a page that waits long enough to hit the platform time limit gets killed as a timeout, which bills for the maximum duration before it dies. About one in six requests was timing out that way.

Here is the part that made the whole thing tractable: respecting MusicBrainz, being fast for users, and being cheap to run are not three competing goals. They are the same goal. The way you stop hammering MusicBrainz is to call it less. The way you call it less is to cache. And caching is also what makes pages fast and what makes them cheap. One fix, three wins.

## Caching, in layers

So caching is the real strategy, and it works as a stack of "do we already have this?" checks, from fastest and cheapest to slowest and most expensive:

1. **Your browser.** Once it has something, it keeps it for the session.
2. **The CDN edge.** Each page and many results are saved as a ready made copy for a set time (six hours for catalog pages). The next visitor gets that copy instantly, with no server work at all.
3. **The framework data cache.** When the server does build a page, the individual pieces it pulled from MusicBrainz get remembered for a while, so the next page that needs the same artist does not re-ask.
4. **Our own database.** The expensive to find things, like which streaming services carry a given song, live for months in Upstash, which is a hosted Redis database (think of Redis as a very fast, simple data store that lives in memory). This cache survives deploys, and Parachord actually helps build it: every time someone plays a track, we learn a little more about where it lives, and that knowledge is shared with everyone.
5. **The live sources.** Only when nothing above has the answer do we make the slow call, and then we save the result back up the stack so we never pay for it twice.

When this stack is working, a popular page almost never touches MusicBrainz. That is good for them, good for the visitor, and good for me.

## Why bots crawl a site nobody has heard of

Here is the surprise I wasn't prepared for as the creator of a little web app that very few people know about... I found the site being crawled by more than three hundred different IP addresses at once, all from Alibaba Cloud, each making just a few requests so no single one tripped a rate limit. A coordinated, distributed crawl. Of a hobby music site.

Why would anyone bother? I should have reminded myself that catalog is King - and people (or bots morelike) are always looking to crawl catalogs. Every artist, every album, every song is its own page, which adds up to an enormous number of clean, structured, interlinked pages. That is exactly what AI training scrapers, dataset builders, and SEO tooling want to vacuum up. They do not care that the site is small. They care that it is deep.

And every one of those crawled pages is a cold page, the worst case: nothing cached, so the server has to build it from scratch through the one request per second MusicBrainz queue. The crawler was effectively forcing the most expensive possible path, thousands of times, around the clock. There is a name for what this can do to a hobby project's wallet, and it is "denial of wallet." A site with no users can still run up a real bill if something is hammering it (just ask me about my parking app experiment that rang me up a $250 Google Maps API bill). 

## Fast for users and cheap to run are the same project

Once I understood that the expensive thing was "functions sitting alive waiting on a slow upstream," the fixes wrote themselves, and almost all of them improved the actual experience too.

The biggest one was deadlines. Every external call now has a hard time limit. If MusicBrainz or ListenBrainz is slow or rate limiting us, the page gives up on that piece quickly and renders what it has, instead of hanging until the platform kills it. For me, that turned expensive maximum duration timeouts into cheap fast responses. For visitors, it turned thirty to sixty second hangs and the occasional error page into a page that always paints quickly and just fills in the slow bits when they arrive. Same change, two wins again.

The rest followed the same shape. Pages paint the header first and stream the rest in behind it. Long lists only load the cover art for the rows actually on screen. The CDN holds catalog pages longer, so repeat visits and crawls get served from the edge instead of waking a function.

## What actually moved the number

Putting it together, here is what took the bill from a thirteen dollar day to a ten cent day:

- **Turned off the observability add-on.** Useful in principle, but two thirds of what it was logging was my own outbound API calls, and I was paying per event to record them. That alone was the single largest line item.
- **Added deadlines everywhere.** No more functions hanging to the time limit, which was the most expensive failure mode there is.
- **Put up a firewall.** A per IP rate limit on catalog pages, an edge block on known datacenter networks (including the Alibaba range that was crawling me), and Vercel's managed bot protection to challenge the distributed crawlers that a simple block cannot catch.
- **Allowlisted Parachord.** This one matters and is easy to get wrong. When you lock the doors against bots, you can lock out your own legit clients too. Parachord talks to Achordion's API as an app, not a browser, so it looks a lot like a bot to a challenge system. I added a narrow rule so Parachord's calls pass while everything else still gets checked. Locking out crawlers should not mean locking out the thing the site exists to serve.

None of these is exotic. Deadlines, caching, and a firewall are standard tools for anyone who runs a website. The only insight was noticing that for this project they all point the same direction.

## The takeaway

For a one-person hobby project, cost is not a back office concern. It is the thing that decides whether the project survives. The encouraging part is that you rarely have to choose between cheap and good. The work that made Achordion affordable to run, calling MusicBrainz less, caching aggressively, failing fast instead of hanging, and keeping crawlers from forcing the worst case, is the same work that made it faster, more reliable, and a better citizen of the open music stack it is part of.

Thirteen dollars a day was the wake up call. A dime a day is the version I can happily keep running. I hope you all enjoy [it](https://achordion.xyz) as much as I have been. 
