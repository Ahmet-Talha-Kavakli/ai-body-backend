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
