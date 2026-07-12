'use client'

import { useEffect, useRef } from 'react'

/**
 * MouseGlow — Un halo lumineux qui suit le curseur.
 * Effet premium type Awwwards. Auto-désactivé si l'utilisateur
 * est sur mobile (pas de souris) ou si prefers-reduced-motion.
 */
export default function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const glow = glowRef.current
    if (!glow) return

    // Désactiver sur mobile ou motion réduite
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches || window.innerWidth < 768) {
      glow.style.display = 'none'
      return
    }

    let rafId = 0
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const update = (e: MouseEvent) => {
      targetX = e.clientX
      targetY = e.clientY
    }

    const animate = () => {
      currentX += (targetX - currentX) * 0.08
      currentY += (targetY - currentY) * 0.08
      glow!.style.transform = `translate(${currentX - 150}px, ${currentY - 150}px)`
      rafId = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', update, { passive: true })
    rafId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', update)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div
      ref={glowRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999]"
      style={{
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 107, 53, 0.06) 0%, rgba(124, 58, 237, 0.03) 40%, transparent 70%)',
        transform: 'translate(-150px, -150px)',
        transition: 'opacity 0.3s',
        willChange: 'transform',
        mixBlendMode: 'screen',
      }}
    />
  )
}
