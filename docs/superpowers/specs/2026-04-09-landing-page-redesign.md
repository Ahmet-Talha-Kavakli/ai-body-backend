# FitAI Landing Page Redesign Spec

**Date:** 2026-04-09  
**Status:** Approved  
**Approach:** Editorial Motion  

---

## Overview

Full redesign of the FitAI marketing landing page (`apps/web/app/page.tsx` and `apps/web/components/landing/`). The goal is a premium, motion-first design that avoids generic AI site patterns (no blob backgrounds, no centered-everything layout, no static card grids). Target audience is general health-conscious users. Dark theme with electric lime accent.

---

## Design Principles

- **Typography dominant** — large, bold, editorial headlines. Mix of left-aligned and centered sections.
- **Scroll-driven motion** — animations triggered by scroll position, not auto-playing loops.
- **No AI clichés** — no gradient blobs as hero backgrounds, no "Revolutionize your..." copy patterns, no uniform 3-column card grids.
- **Component reuse** — leverage existing `components/ui/` library extensively.

---

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#080808` | Page background |
| Primary | `hsl(142, 76%, 48%)` | Accent, CTAs, highlights |
| Foreground | `#ededed` | Body text |
| Muted | `zinc-400` | Secondary text |
| Card surface | `zinc-900` | Card backgrounds |
| Border | `zinc-800` | Subtle dividers |

---

## Sections

### 1. Navigation (`landing-nav.tsx`)

**Behavior:**
- Starts fully transparent on page load
- On scroll > 50px: `backdrop-blur-md` + `border-b border-zinc-800/50` + subtle dark background
- Fade-in from top on initial load (framer-motion, 0.4s)

**Layout:**
- Left: Logo + wordmark
- Center: Nav links (Features, How it Works, Pricing)
- Right: "Sign In" ghost button + "Get Started" `gradient-hover-button`
- Mobile: hamburger-menu component collapses center + right

---

### 2. Hero Section (`hero-section.tsx`)

**Two-layer architecture:**

**Layer 1 — Background:**
- `scroll-expansion-hero` component: a contained box expands to full viewport as user scrolls. Creates depth/cinematic opening.

**Layer 2 — Foreground content:**
- `particle-text-effect` for headline: "Your AI Personal Trainer" — letters form from particles on load
- Subheadline: plain text, zinc-400, max-w-md, left-aligned on desktop
- Two CTAs:
  - Primary: `gradient-hover-button` → "Start Free Trial"
  - Secondary: ghost button → "Watch Demo"
- Social proof badge: small pill with avatar stack + "10,000+ active users"
- Bottom: `scroll-down-indicator` component

**Layout:** Content left-aligned on desktop (not centered), image/mockup right side.

---

### 3. Features Section (`features-section.tsx`)

**NOT a uniform card grid.** Instead:

- Large editorial number (01, 02, 03, 04) in zinc-800, decorative
- Feature title in large bold type
- Short description in zinc-400
- Each feature row alternates left/right layout
- Scroll-triggered: each row slides in from left or right (`framer-motion` `whileInView`)
- One "featured" feature in the center gets a full `spotlight-card` treatment (larger, glowing)
- `background-paths` component at low opacity as section background texture

**Features to highlight:**
1. AI Program Generation
2. Real-time Form Analysis
3. Nutrition Tracking
4. Progress Analytics

---

### 4. How It Works Section (`how-it-works-section.tsx`)

- `container-scroll-animation` wrapper — content reveals as user scrolls
- 3 steps displayed sequentially:
  1. **Onboard** — Answer a few questions, set your goals
  2. **Get Your Program** — AI builds a personalized plan in seconds
  3. **Track & Improve** — Log workouts, meals, and watch your progress
- Each step: large step number + icon + title + 2-line description
- Connecting line/path animates between steps as they reveal

---

### 5. Testimonials Section (`testimonials-section.tsx`)

- `stagger-testimonials` component — cards appear at different scroll speeds, organic masonry-like feel
- Each testimonial card:
  - Quote text
  - Avatar (placeholder initials if no image)
  - Name + role
  - `star-rating` component (5 stars)
- Section header: "Real people. Real results." — left aligned, large

---

### 6. Pricing Section (`pricing-section.tsx`)

**3 tiers:** Free, Pro (highlighted), Elite

**Layout:**
- Pro card: larger scale, `spotlight-card` with green glow, "Most Popular" badge
- Free + Elite: standard `card` component, slightly smaller
- Price numbers: animate in with framer-motion counter on scroll enter
- Each card: feature list with checkmarks, CTA button
- Toggle: monthly/annual billing switch at top

---

### 7. CTA Section (`cta-section.tsx`)

- `warp-background` component as full-section background
- Single powerful headline (1 line max): "Start training smarter today."
- One large CTA button: `gradient-hover-button` → "Get Started Free"
- No fluff, no secondary text clutter

---

### 8. Footer (`landing-footer.tsx`)

- 4 columns: Product, Company, Legal, Connect
- Thin `border-t border-zinc-800` separator
- Logo + copyright left, social icons right
- No animations — clean and static

---

## File Structure

All components go in `apps/web/components/landing/`:

```
landing-nav.tsx          ← rewrite
hero-section.tsx         ← rewrite
features-section.tsx     ← rewrite
how-it-works-section.tsx ← rewrite
testimonials-section.tsx ← rewrite
pricing-section.tsx      ← rewrite
cta-section.tsx          ← rewrite
landing-footer.tsx       ← rewrite
```

`apps/web/app/page.tsx` — no change needed (imports stay same)

---

## Dependencies

All already installed:
- `framer-motion` — scroll animations, stagger, whileInView
- `components/ui/scroll-expansion-hero`
- `components/ui/particle-text-effect`
- `components/ui/gradient-hover-button`
- `components/ui/scroll-down-indicator`
- `components/ui/spotlight-card`
- `components/ui/background-paths`
- `components/ui/container-scroll-animation`
- `components/ui/stagger-testimonials`
- `components/ui/star-rating`
- `components/ui/warp-background`
- `components/ui/hamburger-menu`

---

## Non-Goals

- No new pages created
- No backend/API changes
- No dashboard modifications
- No new npm packages
- No changes to auth flow
