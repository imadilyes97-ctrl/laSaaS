'use client'

import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * Adds GSAP entrance animations to dashboard pages.
 * Mount once in the dashboard layout.
 */
export default function DashboardAnimations() {
  const initedRef = useRef(false)

  useEffect(() => {
    if (initedRef.current) return
    initedRef.current = true

    const ctx = gsap.context(() => {
      // Stats cards stagger entrance
      gsap.fromTo(
        '.stat-card',
        { opacity: 0, y: 24, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.06,
          ease: 'cubic-bezier(0.23, 1, 0.32, 1)',
        }
      )

      // Charts fade-up
      gsap.fromTo(
        '.chart-container',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'cubic-bezier(0.23, 1, 0.32, 1)',
          delay: 0.2,
        }
      )

      // Table rows stagger
      gsap.fromTo(
        '.table-premium tbody tr',
        { opacity: 0, x: -8 },
        {
          opacity: 1,
          x: 0,
          duration: 0.35,
          stagger: 0.03,
          ease: 'cubic-bezier(0.23, 1, 0.32, 1)',
          delay: 0.3,
        }
      )
    })

    return () => ctx.revert()
  }, [])

  return null
}
