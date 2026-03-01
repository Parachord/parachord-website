# Parachord Website Redesign

## Overview

Redesign the Parachord website to a bold, dark, modern aesthetic inspired by a reference image with massive typography, split-hero layout, and gradient accents matching the Parachord app's purple-pink-orange color palette.

## File Strategy

Create new files alongside originals (originals untouched):

| New File | Original | Description |
|----------|----------|-------------|
| `index-new.html` | `index.html` | Redesigned homepage |
| `blog/index-new.html` | `blog/index.html` | Redesigned blog listing |
| `demos/index-new.html` | `demos/index.html` | Redesigned demos page |
| `_layouts/default-new.html` | `_layouts/default.html` | Redesigned shared layout |
| `_layouts/post-new.html` | `_layouts/post.html` | Redesigned blog post layout |

## Design System

### Colors

```css
:root {
    --bg:          #0a0a0a;
    --bg-elevated: #111111;
    --bg-subtle:   #1a1a1a;
    --text:        #f5f5f5;
    --text-muted:  rgba(255,255,255,0.5);
    --gradient:    linear-gradient(135deg, #8b5cf6, #ec4899, #f97316);
    --accent:      #ec4899;
}
```

### Typography

- **Display font:** Plus Jakarta Sans (800/extrabold) or Outfit — bold geometric grotesque from Google Fonts
- **Body font:** DM Sans — clean, modern
- Hero headline: `clamp(3.5rem, 8vw, 7rem)`, uppercase, heavy weight

### Navigation

Preserved from current site:
- Links: Features | Plugins | Blog | Demos | Download
- Fixed top, transparent -> blur on scroll
- Hamburger on mobile with full-screen overlay
- Logo wordmark on left

## Homepage Sections

### 1. Hero (split layout)

- **Left (~55%):** Status badge "BETA NOW AVAILABLE" with pulsing green dot. Massive stacked headline "YOUR MUSIC IS EVERYWHERE." with "EVERYWHERE." in purple-pink-orange gradient. Subtitle text. Two CTAs: primary (gradient bg "Download Beta") + secondary (outlined "Documentation"). Platform icons (macOS/Windows/Linux).
- **Right (~45%):** `home.png` app screenshot, slightly elevated with subtle purple radial glow behind it.
- **Background:** Near-black with subtle radial gradient glow in purple behind screenshot area.

### 2. Press Section

Same 3 press cards (Lowpass, Music Ally, PCMag) with new dark card styling.

### 3. Concept/Vision

Same content, bold new typography. Centered text block.

### 4. Gallery

Same infinite scroll carousel with darker card treatment.

### 5. Features with Screenshots

Each of the 3 feature cards now includes a relevant app screenshot:
- **Plug-Ins for Everything** -> `marketplace.png` (cropped/zoomed)
- **Friends & Listen Along** -> `friends-2.png` (cropped/zoomed)
- **Import & Sync Your Library** -> `collection.png` (cropped/zoomed)

Larger card format to accommodate screenshot + icon + title + description.

### 6. Plugins Marketplace

Same colored tile grid with filter tabs. Restyled pills and cards.

### 7. Why Parachord / Experiences

Same 2x3 grid of experience cards. Dark card treatment.

### 8. Download

Same OS-detection download section (no signup). Restyled.

### 9. Footer

Same links: GitHub, Issues, Forum, Slack, Privacy Policy.

## Blog & Demos Pages

Same content and functionality, restyled:
- New color system and typography
- Matching nav and footer
- Blog: same Jekyll post loop, card grid, empty state
- Demos: same TOC, demo sections, code blocks, live previews

## Post Layout

Same structure (header, content, footer with back/share links), new typography and colors.

## Animations

- Hero text stagger-in on page load (CSS animation-delay)
- Fade-up on scroll for sections (IntersectionObserver)
- Status badge green dot pulse
- Card hover lifts
- Gallery pause on hover

## Key Decisions

- Purple-pink-orange gradient from app (not blue like reference image)
- "EVERYWHERE." gets the gradient treatment in the hero headline
- All existing sections kept and restyled (no sections removed)
- Signup section removed, replaced by download section
- Screenshots added to feature cards for visual richness
- New files created alongside originals for safety
