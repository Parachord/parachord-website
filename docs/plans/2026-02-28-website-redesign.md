# Website Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Use the frontend-design skill for each task that creates HTML/CSS.

**Goal:** Redesign the Parachord website with a bold dark aesthetic, split-hero layout, massive typography, and purple-pink-orange gradient accents matching the app.

**Architecture:** Static HTML/CSS site served by GitHub Pages with Jekyll. Each page is a self-contained HTML file with inline styles. New files created alongside originals (`*-new.html`) so nothing is overwritten.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Google Fonts (Plus Jakarta Sans + DM Sans), Jekyll (for blog/demos Liquid templates)

---

### Task 1: Homepage — `index-new.html`

**Files:**
- Create: `index-new.html`
- Reference: `index.html` (for all content, SVGs, plugin cards, JS logic)

**Step 1: Create `index-new.html` with complete redesigned homepage**

This is the largest file. It must include ALL of these sections with new styling:

**Design system (CSS variables):**
```css
:root {
    --bg: #0a0a0a;
    --bg-elevated: #111111;
    --bg-subtle: #1a1a1a;
    --text: #f5f5f5;
    --text-muted: rgba(255,255,255,0.5);
    --accent: #ec4899;
}
```

**Google Fonts:** Plus Jakarta Sans (600;700;800) + DM Sans (400;500;700)

**Sections to implement (in order):**

1. **Nav** — Fixed top, transparent->blur on scroll. Logo wordmark left. Links: Features | Plugins | Blog | Demos | Download. Hamburger menu on mobile with full-screen overlay. Same JS behavior as current site.

2. **Hero (split layout)** — Two-column flexbox/grid. Left side (~55%): status badge "BETA NOW AVAILABLE" with pulsing green dot animation, massive uppercase headline "YOUR MUSIC IS EVERYWHERE." where "EVERYWHERE." uses `background: linear-gradient(135deg, #8b5cf6, #ec4899, #f97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent;`. Subtitle: "Your music is everywhere... now you don't have to be." Two CTA buttons: primary gradient Download + secondary outlined Documentation. Platform icons (macOS/Windows/Linux SVGs from current site). Right side (~45%): `assets/home.png` screenshot with CSS box-shadow and subtle purple radial glow behind it. Stagger-in animation on load using CSS keyframes + animation-delay.

3. **Press** — "What People Are Saying" label. 3 press cards (same content: Lowpass, Music Ally, PCMag with press-*.png logos, quotes, authors, and links). Dark card styling with `--bg-elevated` bg.

4. **Concept/Vision** — Same content from current `<section class="concept">`. Bold typography treatment.

5. **Gallery** — Same infinite scroll carousel. Same images: content-resolution.png, artist-page.png, friends-2.png, collection.png, critical-darlings.png, home.png, history.png, playlists.png, recommended-artists.png. Duplicate images for seamless loop. Darker cards. Lightbox with prev/next/close/counter. "View Demo Screencasts" CTA linking to YouTube playlist.

6. **Features with Screenshots** — 3 larger feature cards. Each card has: screenshot image on top (marketplace.png for Plugins, friends-2.png for Friends, collection.png for Import/Sync), gradient icon circle, title, description. Same text content from current site. Cards use `--bg-elevated` background.

7. **Plugins Marketplace** — Same filter tabs (All/Streaming/Metadata/Social/AI) and colored tile grid. All 14 plugin cards with their SVGs and brand colors preserved exactly from current site. Same JS filter logic.

8. **Experiences / Why Parachord** — Same 2x3 grid. Same 6 experience cards with SVG icons and text. Dark cards.

9. **Download** — Same OS-detection section. `download-btn` with gradient styling. Same JS that fetches GitHub releases API and detects OS. Same "View all platforms & releases" link behavior.

10. **Footer** — Same links: GitHub (with SVG), Issues, Forum, Slack, Privacy Policy. Same copyright line.

11. **Lightbox** — Same lightbox HTML/JS from current site.

12. **Scroll animations** — IntersectionObserver that adds a `.visible` class to sections as they enter viewport. CSS: sections start with `opacity: 0; transform: translateY(30px)` and transition to `opacity: 1; transform: translateY(0)` when `.visible`.

**All JavaScript from current `index.html` must be preserved:**
- Nav scroll detection
- Hamburger menu toggle
- Plugin filter logic
- Lightbox (open/close/prev/next/keyboard)
- OS detection + GitHub release API download link

**Step 2: Verify in browser**

Open `index-new.html` directly in browser. Check:
- Hero split layout renders correctly
- Gradient text on "EVERYWHERE." works
- Status badge pulses
- Screenshot has glow effect
- All sections present with content
- Plugin filters work
- Lightbox works
- Download button shows OS-specific text
- Mobile hamburger works at narrow widths
- Scroll animations fire

**Step 3: Commit**

```bash
git add index-new.html
git commit -m "feat: add redesigned homepage (index-new.html)"
```

---

### Task 2: Blog Page — `blog/index-new.html`

**Files:**
- Create: `blog/index-new.html`
- Reference: `blog/index.html` (for Jekyll Liquid templates, post card structure)

**Step 1: Create `blog/index-new.html` with redesigned blog listing**

Must include:
- Same Jekyll frontmatter (`layout: null`, title, description)
- New design system CSS (same variables, fonts as homepage)
- Nav with Blog link having `class="active"`. Same 5 links. Hamburger menu.
- Blog header section with bold typography: "News & Updates"
- Same Jekyll `{% for post in site.posts %}` loop generating post cards
- Post cards restyled: dark `--bg-elevated` background, gradient hover border, category badge, title, excerpt, date, read time
- Same empty state ("Coming Soon") with CTA
- Footer matching homepage
- Hamburger JS

**Jekyll Liquid references to preserve exactly:**
- `{{ '/assets/icon128.png' | relative_url }}`
- `{{ '/assets/logo-wordmark.png' | relative_url }}`
- `{{ '/' | relative_url }}#features`
- `{{ '/blog/' | relative_url }}`
- `{{ '/demos/' | relative_url }}`
- `{{ post.url | relative_url }}`
- `{{ post.title }}`
- `{{ post.excerpt | strip_html | truncate: 120 }}`
- `{{ post.date | date: "%b %d, %Y" }}`
- `{% assign words = post.content | number_of_words %}`

**Step 2: Verify**

This requires Jekyll to render. Visually inspect the HTML structure for correctness.

**Step 3: Commit**

```bash
git add blog/index-new.html
git commit -m "feat: add redesigned blog page (blog/index-new.html)"
```

---

### Task 3: Demos Page — `demos/index-new.html`

**Files:**
- Create: `demos/index-new.html`
- Reference: `demos/index.html` (for all demo sections, code blocks, protocol links)

**Step 1: Create `demos/index-new.html` with redesigned demos page**

This is a large file. Must include:
- Same Jekyll frontmatter
- New design system CSS + code block styling (JetBrains Mono for code)
- Nav with Demos link `class="active"`. Hamburger menu.
- Demos header: "Protocol Demos" with bold typography
- Link to blog post about protocol
- TOC pills: Protocol Links | Inline Review Links | Action Buttons | Playback Controls | AI Chat Prompts | Embeddable Button | JavaScript API | Smartlink Embed
- All 8 demo sections preserved exactly from current site with:
  - Live preview areas
  - Code blocks with syntax highlighting spans (same class names: .tag, .attr, .str, .comment, .kw, .fn, .prop, .url)
  - Copy buttons
  - Demo notes/callouts
- All protocol link hrefs preserved exactly (parachord:// URLs)
- Smartlink iframe embed preserved
- `button.js` script tag preserved
- Footer matching homepage
- Hamburger JS + copyCode JS

**Step 2: Verify**

Open in browser. Check code blocks render, copy buttons work, TOC links scroll correctly.

**Step 3: Commit**

```bash
git add demos/index-new.html
git commit -m "feat: add redesigned demos page (demos/index-new.html)"
```

---

### Task 4: Default Layout — `_layouts/default-new.html`

**Files:**
- Create: `_layouts/default-new.html`
- Reference: `_layouts/default.html`

**Step 1: Create `_layouts/default-new.html`**

Must include:
- New design system CSS
- Nav with active state detection: `{% if page.url contains '/blog' %}class="active"{% endif %}`
- Hamburger menu
- `{{ content }}` placeholder for page content
- `{{ content_for_layout_styles }}` placeholder for additional page styles
- Footer
- Hamburger JS
- RSS feed alternate link

**Step 2: Commit**

```bash
git add _layouts/default-new.html
git commit -m "feat: add redesigned default layout (_layouts/default-new.html)"
```

---

### Task 5: Post Layout — `_layouts/post-new.html`

**Files:**
- Create: `_layouts/post-new.html`
- Reference: `_layouts/post.html`

**Step 1: Create `_layouts/post-new.html`**

Must include:
- New design system CSS
- Nav with Blog link `class="active"`. Hamburger menu.
- Post header: category badge, title, meta (date, author, read time)
- Post content area with rich typography styles (h2, h3, p, a, ul, ol, blockquote, img, code, pre)
- Post footer: back to blog link + share links (Twitter/X, LinkedIn)
- Footer
- Hamburger JS

**Jekyll Liquid to preserve:**
- `{{ page.title }}`
- `{{ page.category }}`
- `{{ page.date | date: "%B %d, %Y" }}`
- `{{ page.author | default: "Parachord Team" }}`
- `{{ content | number_of_words }}`
- `{{ content }}`
- `{{ page.url | absolute_url | uri_escape }}`
- OG/Twitter meta tags with page variables

**Step 2: Commit**

```bash
git add _layouts/post-new.html
git commit -m "feat: add redesigned post layout (_layouts/post-new.html)"
```

---

### Task 6: Final Review & Polish

**Step 1: Open all 5 files and cross-check**

- Verify CSS variables are consistent across all 5 files
- Verify nav links are identical across all files
- Verify footer links are identical across all files
- Verify all Google Font imports match
- Check mobile responsiveness at 700px breakpoint in all files

**Step 2: Commit any fixes**

```bash
git add -A
git commit -m "fix: polish and consistency pass across redesigned pages"
```
