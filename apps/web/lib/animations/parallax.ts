// apps/web/lib/animations/parallax.ts

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

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
