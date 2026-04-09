# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform FitAI landing page into a premium, animated experience with dynamic backgrounds, parallax scrolling, word-by-word text reveals, and custom wave interactions.

**Architecture:** Build modular animation components (background aurora, text reveal, wave effect) that work independently, then integrate them into existing landing sections with minimal changes. Use GSAP + ScrollTrigger for scroll orchestration, ensuring 60fps performance.

**Tech Stack:** GSAP 3.12+, React 19, Tailwind CSS, SVG (background blobs), ScrollTrigger plugin

---

## File Structure Overview

**New files to create:**
```
apps/web/components/landing/
  ├── background-aurora.tsx          # Dynamic gradient + animated SVG blobs
  ├── section-animations.tsx         # GSAP ScrollTrigger wrapper HOC
  └── text-reveal.tsx                # Word-by-word reveal component

apps/web/components/ui/
  └── wave-container.tsx             # Reusable wave effect wrapper

apps/web/lib/animations/
  ├── wave-effect.ts                 # Wave animation logic
  ├── parallax.ts                    # Parallax helpers
  └── gsap-setup.ts                  # GSAP initialization + ScrollTrigger config

apps/web/styles/
  └── animations.css                 # Keyframes + animation variables
```

**Files to modify:**
```
apps/web/app/page.tsx                # Wrap main with BackgroundAurora, integrate animations
apps/web/app/globals.css             # Add animation variables and keyframes
apps/web/components/landing/hero-section.tsx          # Add TextReveal wrapper
apps/web/components/landing/features-section.tsx      # Add SectionAnimations wrapper
apps/web/components/landing/how-it-works-section.tsx  # Add SectionAnimations wrapper
apps/web/components/landing/testimonials-section.tsx  # Add SectionAnimations wrapper
apps/web/components/landing/pricing-section.tsx       # Add SectionAnimations wrapper
apps/web/components/landing/cta-section.tsx           # Add SectionAnimations wrapper
```

---

## Chunk 1: Animation Foundation & Wave Effect System

### Task 1: Create Wave Effect Utility

**Files:**
- Create: `apps/web/lib/animations/wave-effect.ts`

- [ ] **Step 1: Write the wave effect logic**

```typescript
// apps/web/lib/animations/wave-effect.ts

export interface WaveConfig {
  color?: string
  maxRadius?: number
  duration?: number
  easing?: string
}

export const createWaveEffect = (
  event: React.MouseEvent<HTMLElement>,
  config: WaveConfig = {}
) => {
  const {
    color = 'rgba(99, 102, 241, 0.3)',
    maxRadius = 150,
    duration = 600,
    easing = 'power2.out',
  } = config

  const element = event.currentTarget
  const rect = element.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const wave = document.createElement('span')
  wave.style.position = 'absolute'
  wave.style.left = `${x}px`
  wave.style.top = `${y}px`
  wave.style.width = '0px'
  wave.style.height = '0px'
  wave.style.borderRadius = '50%'
  wave.style.backgroundColor = color
  wave.style.pointerEvents = 'none'
  wave.style.transform = 'translate(-50%, -50%)'

  element.style.position = 'relative'
  element.style.overflow = 'hidden'
  element.appendChild(wave)

  // Use GSAP for animation
  gsap.to(wave, {
    width: maxRadius * 2,
    height: maxRadius * 2,
    duration: duration / 1000,
    ease: easing,
    opacity: 0,
    onComplete: () => {
      wave.remove()
    },
  })
}

export const addWaveListener = (
  element: HTMLElement | null,
  config?: WaveConfig
) => {
  if (!element) return

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    createWaveEffect(e, config)
  }

  element.addEventListener('mousedown', (e) => {
    createWaveEffect(e as any, config)
  })
}
```

- [ ] **Step 2: Create GSAP setup utility**

Create: `apps/web/lib/animations/gsap-setup.ts`

```typescript
// apps/web/lib/animations/gsap-setup.ts

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export const initGSAP = () => {
  gsap.registerPlugin(ScrollTrigger)
  
  // Set default easing
  gsap.defaults({
    ease: 'power2.out',
    duration: 0.6,
  })
}

export const createScrollTrigger = (
  target: string | HTMLElement,
  animation: gsap.core.Timeline | gsap.core.Tween,
  options: ScrollTrigger.Vars = {}
) => {
  return ScrollTrigger.create({
    trigger: target,
    animation,
    toggleActions: 'play none none reverse',
    ...options,
  })
}
```

- [ ] **Step 3: Create parallax helper**

Create: `apps/web/lib/animations/parallax.ts`

```typescript
// apps/web/lib/animations/parallax.ts

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export const createParallaxAnimation = (
  element: HTMLElement,
  speed: number = 0.3 // 0.3x = slower parallax
) => {
  if (!element) return

  gsap.to(element, {
    y: `${window.innerHeight * speed}`,
    ease: 'none',
    scrollTrigger: {
      trigger: element,
      scrub: 0.5, // smooth scroll
      markers: false,
    },
  })
}

export const createSectionScaleAnimation = (
  element: HTMLElement,
  delay: number = 0
) => {
  const tl = gsap.timeline()

  tl.to(
    element,
    {
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: 'back.out',
    },
    delay
  )

  return tl
}

export const staggerChildren = (
  parent: HTMLElement,
  selector: string,
  delay: number = 0.05
) => {
  const children = parent.querySelectorAll(selector)
  const tl = gsap.timeline()

  gsap.set(children, { opacity: 0, y: 20 })

  children.forEach((child, index) => {
    tl.to(
      child,
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
      },
      index * delay
    )
  })

  return tl
}
```

- [ ] **Step 4: Commit foundation utilities**

```bash
git add apps/web/lib/animations/wave-effect.ts apps/web/lib/animations/gsap-setup.ts apps/web/lib/animations/parallax.ts
git commit -m "feat: add wave effect and parallax animation utilities"
```

---

### Task 2: Create Animation CSS Variables & Keyframes

**Files:**
- Create: `apps/web/styles/animations.css`

- [ ] **Step 1: Write animation variables and keyframes**

```css
/* apps/web/styles/animations.css */

:root {
  /* Animation timing */
  --animation-duration-short: 300ms;
  --animation-duration-medium: 600ms;
  --animation-duration-long: 800ms;
  --animation-duration-xlarge: 1200ms;

  /* Easing functions */
  --easing-in-out-cubic: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
  --easing-out-quad: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --easing-out-expo: cubic-bezier(0.19, 1, 0.22, 1);

  /* Wave animation */
  --wave-max-radius: 150px;
  --wave-color: rgba(99, 102, 241, 0.3);
}

/* Text reveal keyframes */
@keyframes wordRevealIn {
  from {
    opacity: 0;
    transform: translateY(10px);
    letterSpacing: 0.05em;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    letterSpacing: 0;
  }
}

/* Section scale animation */
@keyframes sectionScaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Parallax background drift */
@keyframes auroraShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Glow pulse */
@keyframes glowPulse {
  0%,
  100% {
    box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
  }
}

/* Apply utilities */
.animate-word-reveal {
  animation: wordRevealIn var(--animation-duration-medium) var(--easing-out-quad);
}

.animate-section-scale {
  animation: sectionScaleIn var(--animation-duration-long) var(--easing-out-back);
}

.animate-aurora-shift {
  animation: auroraShift 30s ease-in-out infinite;
  background-size: 200% 200%;
}

.animate-glow-pulse {
  animation: glowPulse 2s ease-in-out infinite;
}
```

- [ ] **Step 2: Import animations.css into globals.css**

Modify: `apps/web/app/globals.css` (add at top after @tailwind imports)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import '@/styles/animations.css';

/* rest of globals.css continues... */
```

- [ ] **Step 3: Commit animation styles**

```bash
git add apps/web/styles/animations.css apps/web/app/globals.css
git commit -m "feat: add animation keyframes and CSS variables"
```

---

## Chunk 2: Background Aurora Component

### Task 3: Create Dynamic Aurora Background

**Files:**
- Create: `apps/web/components/landing/background-aurora.tsx`

- [ ] **Step 1: Write BackgroundAurora component**

```typescript
// apps/web/components/landing/background-aurora.tsx

'use client'

import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface BackgroundAuroraProps {
  children: React.ReactNode
}

export const BackgroundAurora: React.FC<BackgroundAuroraProps> = ({
  children,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const blobsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    if (!canvasRef.current) return

    // Initialize animated blobs
    const blobs = canvasRef.current.querySelectorAll('.blob')
    blobsRef.current = Array.from(blobs) as HTMLDivElement[]

    // Animate each blob at different speeds
    blobsRef.current.forEach((blob, index) => {
      const duration = 15 + index * 5 // 15s, 20s, 25s, etc.
      const speed = 0.3 - index * 0.1 // 0.3, 0.2, 0.1

      gsap.to(blob, {
        x: `${Math.sin(index) * 100}px`,
        y: `${Math.cos(index) * 100}px`,
        duration,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      // Parallax effect
      gsap.to(
        blob,
        {
          y: window.innerHeight * speed,
          ease: 'none',
          scrollTrigger: {
            trigger: document.body,
            scrub: 1,
            markers: false,
          },
        }
      )
    })

    return () => {
      blobsRef.current.forEach((blob) => {
        gsap.killTweensOf(blob)
      })
    }
  }, [])

  return (
    <div ref={canvasRef} className="relative min-h-screen bg-[#080808]">
      {/* Aurora gradient background */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-b from-indigo-950 via-slate-900 to-blue-950 animate-aurora-shift" />

      {/* Animated blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Blob 1 */}
        <div
          className="blob absolute w-96 h-96 rounded-full opacity-20"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.4), transparent)',
            filter: 'blur(60px)',
            top: '10%',
            left: '5%',
          }}
        />

        {/* Blob 2 */}
        <div
          className="blob absolute w-80 h-80 rounded-full opacity-15"
          style={{
            background:
              'radial-gradient(circle at 70% 70%, rgba(26, 26, 46, 0.3), transparent)',
            filter: 'blur(50px)',
            top: '50%',
            right: '10%',
          }}
        />

        {/* Blob 3 */}
        <div
          className="blob absolute w-72 h-72 rounded-full opacity-10"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(15, 52, 96, 0.2), transparent)',
            filter: 'blur(70px)',
            bottom: '10%',
            left: '30%',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-0">{children}</div>
    </div>
  )
}
```

- [ ] **Step 2: Update page.tsx to use BackgroundAurora**

Modify: `apps/web/app/page.tsx`

```typescript
// apps/web/app/page.tsx

import { BackgroundAurora } from '@/components/landing/background-aurora'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { HowItWorksSection } from '@/components/landing/how-it-works-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { CtaSection } from '@/components/landing/cta-section'
import { LandingFooter } from '@/components/landing/landing-footer'
import { SectionTransition } from '@/components/landing/section-transition'

export default function HomePage() {
  return (
    <BackgroundAurora>
      <main>
        <HeroSection />

        <SectionTransition divider="gradient">
          <FeaturesSection />
        </SectionTransition>

        <SectionTransition divider="glow" delay={0.05}>
          <HowItWorksSection />
        </SectionTransition>

        <SectionTransition divider="gradient" delay={0.05}>
          <TestimonialsSection />
        </SectionTransition>

        <SectionTransition divider="glow" delay={0.05}>
          <PricingSection />
        </SectionTransition>

        <SectionTransition divider="fade" delay={0.05}>
          <CtaSection />
        </SectionTransition>

        <SectionTransition divider="gradient" delay={0.1}>
          <LandingFooter />
        </SectionTransition>
      </main>
    </BackgroundAurora>
  )
}
```

- [ ] **Step 3: Commit BackgroundAurora component**

```bash
git add apps/web/components/landing/background-aurora.tsx apps/web/app/page.tsx
git commit -m "feat: add dynamic aurora background with animated blobs"
```

---

## Chunk 3: Text Reveal Component

### Task 4: Create Word-by-Word Text Reveal

**Files:**
- Create: `apps/web/components/landing/text-reveal.tsx`

- [ ] **Step 1: Write TextReveal component**

```typescript
// apps/web/components/landing/text-reveal.tsx

'use client'

import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface TextRevealProps {
  text: string
  variant?: 'h1' | 'h2' | 'h3' | 'body'
  accentWords?: string[]
  className?: string
}

gsap.registerPlugin(ScrollTrigger)

export const TextReveal: React.FC<TextRevealProps> = ({
  text,
  variant = 'h1',
  accentWords = [],
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const words = text.split(' ')
    const wordElements: HTMLSpanElement[] = []

    // Clear and rebuild with word spans
    containerRef.current.innerHTML = ''

    words.forEach((word) => {
      const span = document.createElement('span')
      span.textContent = word
      span.className = 'inline-block'
      span.style.opacity = '0'
      span.style.display = 'inline-block'
      span.style.marginRight = '0.25em'

      // Check if word should be accented
      if (
        accentWords.some((accent) =>
          word.toLowerCase().includes(accent.toLowerCase())
        )
      ) {
        span.className += ' text-indigo-500'
      }

      containerRef.current!.appendChild(span)
      wordElements.push(span)
    })

    // Create timeline for word-by-word reveal
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    })

    wordElements.forEach((word, index) => {
      tl.to(
        word,
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: 'power2.out',
        },
        index * 0.08 // 80ms between words
      )
    })

    return () => {
      tl.kill()
    }
  }, [text, accentWords])

  const baseClasses = {
    h1: 'text-5xl md:text-6xl font-bold tracking-tight',
    h2: 'text-4xl md:text-5xl font-bold tracking-tight',
    h3: 'text-3xl md:text-4xl font-bold tracking-tight',
    body: 'text-lg leading-relaxed',
  }

  return (
    <div
      ref={containerRef}
      className={`${baseClasses[variant]} ${className}`}
      style={{ perspective: '1000px' }}
    />
  )
}
```

- [ ] **Step 2: Update HeroSection to use TextReveal**

Modify: `apps/web/components/landing/hero-section.tsx`

```typescript
// Add to imports
import { TextReveal } from '@/components/landing/text-reveal'

// Find the h1 element and replace with:
// Instead of:
// <h1 className="text-5xl md:text-6xl font-bold">FitAI — Your AI Personal Trainer</h1>

// Use:
<TextReveal
  text="FitAI — Your AI Personal Trainer"
  variant="h1"
  accentWords={['AI', 'Personal']}
/>
```

- [ ] **Step 3: Commit TextReveal component**

```bash
git add apps/web/components/landing/text-reveal.tsx
git commit -m "feat: add word-by-word text reveal component"
```

---

## Chunk 4: Section Animation Wrapper

### Task 5: Create Section Animation HOC

**Files:**
- Create: `apps/web/components/landing/section-animations.tsx`

- [ ] **Step 1: Write SectionAnimations wrapper**

```typescript
// apps/web/components/landing/section-animations.tsx

'use client'

import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface SectionAnimationsProps {
  children: React.ReactNode
  enableParallax?: boolean
  enableScale?: boolean
  staggerChildren?: boolean
  className?: string
}

export const SectionAnimations: React.FC<SectionAnimationsProps> = ({
  children,
  enableParallax = true,
  enableScale = true,
  staggerChildren = true,
  className = '',
}) => {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return

    // Parallax animation for section
    if (enableParallax) {
      gsap.to(sectionRef.current, {
        y: window.innerHeight * 0.3,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          scrub: 0.5,
          markers: false,
        },
      })
    }

    // Scale animation
    if (enableScale) {
      gsap.set(sectionRef.current, { scale: 0.95, opacity: 0 })

      gsap.to(sectionRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.8,
        ease: 'back.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })
    }

    // Stagger children
    if (staggerChildren) {
      const children = sectionRef.current.querySelectorAll(
        '[data-animate="true"]'
      )
      if (children.length > 0) {
        gsap.set(children, { opacity: 0, y: 20 })

        gsap.to(children, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.05,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
        })
      }
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [enableParallax, enableScale, staggerChildren])

  return (
    <div ref={sectionRef} className={className}>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Update section components to use SectionAnimations**

Modify: `apps/web/components/landing/features-section.tsx` (example)

```typescript
// Add to imports
import { SectionAnimations } from '@/components/landing/section-animations'

// Wrap the section content:
export const FeaturesSection = () => {
  return (
    <SectionAnimations enableParallax enableScale staggerChildren>
      {/* existing content */}
      {/* Add data-animate="true" to cards/items for stagger effect */}
      <div data-animate="true">Feature 1</div>
      <div data-animate="true">Feature 2</div>
      {/* etc */}
    </SectionAnimations>
  )
}
```

Apply same pattern to:
- `how-it-works-section.tsx`
- `testimonials-section.tsx`
- `pricing-section.tsx`
- `cta-section.tsx`

- [ ] **Step 3: Commit SectionAnimations wrapper**

```bash
git add apps/web/components/landing/section-animations.tsx
git commit -m "feat: add section animation wrapper with parallax and scale"
```

---

## Chunk 5: Wave Effect Integration

### Task 6: Create Wave Container & Integrate to Buttons

**Files:**
- Create: `apps/web/components/ui/wave-container.tsx`

- [ ] **Step 1: Write WaveContainer component**

```typescript
// apps/web/components/ui/wave-container.tsx

'use client'

import React, { useRef } from 'react'
import { createWaveEffect } from '@/lib/animations/wave-effect'

interface WaveContainerProps {
  children: React.ReactNode
  className?: string
  waveColor?: string
}

export const WaveContainer: React.FC<WaveContainerProps> = ({
  children,
  className = '',
  waveColor = 'rgba(99, 102, 241, 0.3)',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      createWaveEffect(e as any, {
        color: waveColor,
        maxRadius: 150,
        duration: 600,
      })
    }
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className={`relative ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Update Button component to use WaveContainer**

Modify: `apps/web/components/ui/button.tsx`

```typescript
// Add import
import { WaveContainer } from '@/components/ui/wave-container'

// Wrap button content with WaveContainer
// Find the existing button component and wrap its content:

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={buttonVariants({ className })}
      {...props}
    >
      <WaveContainer>{props.children}</WaveContainer>
    </button>
  )
)
```

- [ ] **Step 3: Commit WaveContainer component**

```bash
git add apps/web/components/ui/wave-container.tsx
git commit -m "feat: add wave effect container for interactive elements"
```

---

## Chunk 6: Final Integration & Optimization

### Task 7: Initialize GSAP on App Load

**Files:**
- Modify: `apps/web/components/shared/providers.tsx`

- [ ] **Step 1: Add GSAP initialization to Providers**

```typescript
// apps/web/components/shared/providers.tsx

'use client'

import React, { useEffect } from 'react'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { initGSAP } from '@/lib/animations/gsap-setup'

interface ProvidersProps {
  children: React.ReactNode
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  useEffect(() => {
    // Initialize GSAP on client mount
    initGSAP()

    // Refresh ScrollTrigger on window resize
    const handleResize = () => {
      window.dispatchEvent(new Event('gsap-refresh'))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <ThemeProvider>{children}</ThemeProvider>
}
```

- [ ] **Step 2: Commit GSAP initialization**

```bash
git add apps/web/components/shared/providers.tsx
git commit -m "feat: initialize GSAP on app load"
```

---

### Task 8: Performance Testing & Mobile Optimization

- [ ] **Step 1: Test on desktop (Chrome DevTools Performance)**

Run: `npm run dev` and open landing page in Chrome
- Open DevTools → Performance tab
- Record page load and scroll
- Check FPS (should be ≥55fps consistently)
- Expected: 60fps during scroll, <3s page load

- [ ] **Step 2: Test mobile responsiveness**

Check viewport breakpoints:
- Mobile (320px): Animations should be subtle, reduced parallax
- Tablet (768px): Full animations
- Desktop (1024px+): Full animations with 60fps

Add mobile optimization to `BackgroundAurora`:

```typescript
// Reduce parallax on mobile
const isMobile = window.innerWidth < 768
const parallaxSpeed = isMobile ? 0.1 : 0.3
```

- [ ] **Step 3: Test prefers-reduced-motion**

Add to `apps/web/styles/animations.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Commit performance optimizations**

```bash
git add apps/web/styles/animations.css
git commit -m "feat: add mobile optimization and prefers-reduced-motion support"
```

---

### Task 9: Final Polish & Testing

- [ ] **Step 1: Test all sections animate correctly**

Scroll through entire landing page:
- ✅ Hero section: text reveals word-by-word
- ✅ Features section: cards scale in + parallax
- ✅ HowItWorks: parallax + stagger
- ✅ Testimonials: parallax + stagger
- ✅ Pricing: parallax + stagger
- ✅ CTA: parallax + wave effect on button
- ✅ Footer: smooth animations

- [ ] **Step 2: Test wave effect on buttons**

Click buttons across landing:
- Wave should originate from cursor
- Should expand smoothly
- Should fade out after animation

- [ ] **Step 3: Test no reduced-motion respects preferences**

Open DevTools → More tools → Rendering → Emulate CSS media feature prefers-reduced-motion
- All animations should pause/minimize
- Content should still be readable

- [ ] **Step 4: Final commit & prepare for review**

```bash
git status # Should be clean
git log --oneline -10 # Verify commits are present
```

---

## Summary of Changes

**New Components:**
- ✅ BackgroundAurora (dynamic animated background)
- ✅ TextReveal (word-by-word text animation)
- ✅ SectionAnimations (parallax + scale wrapper)
- ✅ WaveContainer (wave effect on hover)

**New Utilities:**
- ✅ wave-effect.ts (wave animation logic)
- ✅ gsap-setup.ts (GSAP initialization)
- ✅ parallax.ts (parallax helpers)
- ✅ animations.css (keyframes + variables)

**Modified Components:**
- ✅ page.tsx (wrap with BackgroundAurora)
- ✅ hero-section.tsx (add TextReveal)
- ✅ features-section.tsx (add SectionAnimations)
- ✅ how-it-works-section.tsx (add SectionAnimations)
- ✅ testimonials-section.tsx (add SectionAnimations)
- ✅ pricing-section.tsx (add SectionAnimations)
- ✅ cta-section.tsx (add SectionAnimations)
- ✅ button.tsx (add WaveContainer)
- ✅ providers.tsx (initialize GSAP)
- ✅ globals.css (import animations.css)

---

**Plan Status:** Ready for Implementation

**Next Step:** Execute using superpowers:subagent-driven-development or superpowers:executing-plans
