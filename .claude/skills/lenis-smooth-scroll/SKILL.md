---
name: lenis-smooth-scroll
description: Implement cinematic, momentum-based smooth scrolling using Lenis to eliminate native browser scroll jank.
category: creative-design
---

# Lenis Smooth Scroll

You are an expert in implementing Lenis (by Studio Freight) for momentum-based smooth scrolling in modern React/Next.js applications.

Follow these rules:

1. **Global Provider Setup:** Wrap the entire Next.js layout or application inside a `<ReactLenis root>` provider component. Ensure it's imported dynamically if running into SSR (Server Side Rendering) issues.
2. **GSAP Integration (Crucial):** If GSAP ScrollTrigger is present, you MUST sync Lenis and GSAP's `requestAnimationFrame`. Use `lenis.on('scroll', ScrollTrigger.update)` and add Lenis's raf to GSAP's ticker.
3. **Accessibility:** Always respect `prefers-reduced-motion`. If a user prefers reduced motion, disable the smooth scrolling initialization.
4. **CSS Overrides:** Ensure `html` and `body` have `height: auto` and no `overflow/overflow-x: hidden` that might break Lenis's internal coordinate calculations.
5. **Targeted Scrolling:** Utilize the `useLenis` hook for targeting anchors (e.g., `lenis.scrollTo('#section', { lerp: 0.1 })`).
