'use client'

import { useEffect } from 'react'
import gsap from 'gsap'

/**
 * Adds GSAP entrance animations to dashboard pages.
 * Just mount this component once anywhere in the dashboard layout.
 */
export default function DashboardAnimations() {
  useEffect(() => {
    // Stats cards — stagger entrance with card flip
    gsap.fromTo(
      '.stat-card-anim',
      { opacity: 0, y: 30, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.08,
        ease: 'cubic-bezier(0.23, 1, 0.32, 1)',
      }
    )

    // Chart area — fade up
    gsap.fromTo(
      '.chart-anim',
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'cubic-bezier(0.23, 1, 0.32, 1)',
        delay: 0.3,
      }
    )

    // Table rows — stagger
    gsap.fromTo(
      '.dashboard-table tbody tr',
      { opacity: 0, x: -10 },
      {
        opacity: 1,
        x: 0,
        duration: 0.4,
        stagger: 0.04,
        ease: 'cubic-bezier(0.23, 1, 0.32, 1)',
        delay: 0.5,
      }
    )
  }, [])

  return null
}
