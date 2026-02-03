---
layout: post
title: "New Feature: Purchase and Download Music Directly in Parachord"
date: 2026-02-03
author: "J Herskowitz"
category: "Features"
---

One of the most requested features since we launched has been the ability to actually *buy* the music you discover in Parachord. Today, we're excited to announce **Purchase Download**—a new capability in our plugin architecture that lets you buy tracks and albums directly from within the app.

## Why This Matters

Parachord has always been about giving you control over your music experience. Our plugin system lets you stream from Spotify, YouTube, Bandcamp, and more—all in one unified interface. But streaming isn't always the answer.

Sometimes you want to:

- **Own** your music, not rent it
- **Support artists directly** with a purchase that puts more money in their pockets
- **Keep music forever**, even if a streaming service removes it
- **Get the highest quality** files available (FLAC, WAV, hi-res)
- **Play offline** without worrying about DRM or subscription status

Purchase Download makes all of this possible without leaving Parachord.

## How It Works

### The Buy Button

When you're viewing a track or album, you'll now see a **Buy** button alongside the usual play controls—but only when a purchase option is available. Here's the logic:

```
Track/Album View
       ↓
  Query Purchase-Enabled Plugins
       ↓
  ┌────┴────┬────────────┐
  ↓         ↓            ↓
Bandcamp  Qobuz     7digital
  ↓         ↓            ↓
  └────┬────┴────────────┘
       ↓
  Aggregate Pricing & Formats
       ↓
  Display Buy Button (if available)
```

Clicking the Buy button opens a purchase panel showing all available options: which stores have it, what formats they offer, and at what price. You pick the one you want, complete the purchase through the store's secure checkout, and Parachord handles the rest.

### Seamless Download Integration

After purchase, the downloaded files automatically appear in your local library. No hunting through your Downloads folder, no manual importing. Parachord:

1. Detects the completed purchase
2. Downloads the files to your configured music directory
3. Applies proper metadata and album art
4. Updates your library index
5. Sets the local file as the **highest priority** resolver for that track

That last point is key. Once you own a track, Parachord will always prefer your local copy over streaming versions. You get the best quality and you're never dependent on a streaming service's catalog.

## Benefits for Users

### One-Click Comparison Shopping

No more opening multiple tabs to compare prices. Parachord aggregates purchase options from all your configured plugins so you can see at a glance where the best deal is—or which store offers the format you want.

### Unified Library

Purchased music integrates seamlessly with your existing library. Whether a track came from Bandcamp, Qobuz, or your old CD collection, it all lives together in the same playlists and shows up in the same searches.

### Future-Proof Your Collection

Streaming catalogs change constantly. Songs get removed, licensing deals expire, artists pull their music. When you purchase through Parachord, you own the files. They're on your computer, backed up however you like, and playable forever.

### Quality You Control

Streaming services decide what quality to deliver based on your subscription tier and network conditions. Purchased downloads give you exactly what you pay for—lossless FLAC, hi-res 24-bit, whatever the store offers.

## Benefits for Artists

This is where we get excited. **Artists make significantly more money from purchases than streams.**

The math is stark:

| Revenue Model | Artist Earnings (approximate) |
|--------------|-------------------------------|
| Stream | $0.003 - $0.005 per play |
| Album Purchase | $5 - $8 per sale |
| Bandcamp Purchase | ~$7 per $10 sale (after fees) |

A single album purchase on Bandcamp can equal **1,500+ streams** in artist revenue.

### Direct Support

When you buy through Bandcamp, Qobuz, or similar artist-friendly platforms, more of your money goes directly to the people who made the music. Parachord makes it trivially easy to do the right thing.

### Discovery to Purchase Pipeline

Here's the real power: Parachord helps you discover music through AI playlists, friend recommendations, and chart exploration. Now that discovery can convert directly to purchases. You hear something new, you love it, you buy it—all in one app.

## Which Plugins Support Purchase Download?

At launch, the following plugins have purchase capabilities:

- **Bandcamp** — The gold standard for artist-direct purchases. High-quality downloads, fair revenue split, wide catalog of independent music.

- **Qobuz** — Hi-res audio specialists. Great for audiophiles who want 24-bit/192kHz files.

- **7digital** — Broad major label catalog with competitive pricing.

More purchase-enabled plugins are in development. Our plugin SDK now includes purchase capability APIs, so third-party developers can add support for additional stores.

## How to Enable It

Purchase Download is enabled by default for all plugins that support it. Just make sure you have at least one purchase-capable plugin installed:

1. Open the Plugin Marketplace
2. Look for the "Purchase" tag on plugin tiles
3. Install Bandcamp, Qobuz, or another purchase-enabled plugin
4. Authenticate with your account on that service

That's it. Buy buttons will start appearing wherever purchase options are available.

## Privacy and Security

A few things we want to be clear about:

- **We never see your payment info.** Purchases happen through the store's own secure checkout. Parachord just hands off the transaction.
- **We don't take a cut.** No fees, no commissions. 100% of your payment goes to the store (and then to the artist).
- **Purchase history stays local.** We don't track what you buy. Your library is your business.

## What's Next

We're already working on enhancements:

- **Wishlist integration** — Save tracks you want to buy later and get notified of sales
- **Price alerts** — Set a target price and we'll let you know when it drops
- **Bulk purchasing** — Buy entire playlists worth of tracks in one transaction
- **Gift purchases** — Buy music for friends directly through Parachord

## The Bigger Picture

Parachord has always been about putting you in control of your music experience. Purchase Download extends that philosophy to ownership itself. Stream when it's convenient, buy when you want to own, and know that either way, your music is unified in one place.

We think the best music app is one that makes it *easy* to support artists. Not by guilting you or hiding features behind paywalls, but by removing friction from the purchase process. See something you love? One click shows you where to buy it and what it costs. That's it.

Support the artists who make the music you love. Build a library that's truly yours. That's what Purchase Download is all about.

---

Have questions or feedback? Find us on [GitHub](https://github.com/Parachord) or join the discussion in our community forums.
