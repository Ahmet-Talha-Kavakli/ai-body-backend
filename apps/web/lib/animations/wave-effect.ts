// apps/web/lib/animations/wave-effect.ts

import gsap from 'gsap'

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
