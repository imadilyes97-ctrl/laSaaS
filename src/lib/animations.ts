'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ─── Emil Kowalski easing curves ───
export const EASE = {
  out: 'cubic-bezier(0.23, 1, 0.32, 1)',
  inOut: 'cubic-bezier(0.77, 0, 0.175, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
}

/**
 * Count-up animation when element enters viewport
 */
export function useCountUp(ref: React.RefObject<HTMLElement | null>, end: number, duration = 2) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.fromTo(
            el,
            { textContent: 0 },
            {
              textContent: end,
              duration,
              ease: EASE.out,
              snap: { textContent: 1 },
              onUpdate: () => {
                el!.textContent = Math.round(Number(el!.textContent)).toLocaleString()
              },
            }
          )
        },
      })
    })

    return () => ctx.revert()
  }, [ref, end, duration])
}

/**
 * Hook: GSAP stagger reveal for a selector
 */
export function useRevealStagger(
  selector: string,
  options?: { stagger?: number; y?: number; duration?: number; start?: string }
) {
  const { stagger = 0.08, y = 30, duration = 0.7, start = 'top 85%' } = options || {}

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        selector,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          ease: EASE.out,
          scrollTrigger: {
            trigger: selector,
            start,
            once: true,
          },
        }
      )
    })

    return () => ctx.revert()
  }, [selector, stagger, y, duration, start])
}

/**
 * Animate a word-by-word text reveal (Awwwards-style)
 */
export function animateTextReveal(element: HTMLElement | null, tl: gsap.core.Timeline) {
  if (!element) return tl

  const text = element.innerText
  element.innerHTML = ''
  element.style.visibility = 'visible'

  // Split into words wrapped in spans
  const words = text.split(' ').map((word) => {
    const span = document.createElement('span')
    span.textContent = word + ' '
    span.style.display = 'inline-block'
    span.style.opacity = '0'
    span.style.transform = 'translateY(1.5rem)'
    element.appendChild(span)
    return span
  })

  // Animate each word with stagger
  tl.to(words, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    stagger: 0.035,
    ease: EASE.out,
  })

  return tl
}
