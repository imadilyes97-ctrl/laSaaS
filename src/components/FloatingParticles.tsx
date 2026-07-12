'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  pulse: number
  pulseSpeed: number
}

/**
 * Floating particles background — ambiance cosmique premium.
 * Optimisé : arrêt automatique quand le composant est hors écran.
 */
export default function FloatingParticles({ count = 30 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const initParticles = () => {
      const w = canvas!.width = window.innerWidth
      const h = canvas!.height = window.innerHeight
      const arr: Particle[] = []
      for (let i = 0; i < count; i++) {
        arr.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2 + 0.5,
          alpha: Math.random() * 0.4 + 0.1,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.02 + 0.01,
        })
      }
      particlesRef.current = arr
    }

    initParticles()

    const resize = () => {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    window.addEventListener('resize', resize)

    let last = performance.now()

    const animate = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 3)
      last = now
      const w = canvas!.width
      const h = canvas!.height

      ctx!.clearRect(0, 0, w, h)

      for (const p of particlesRef.current) {
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.pulse += p.pulseSpeed * dt

        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0

        const alpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse))
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(255, 107, 53, ${alpha})`
        ctx!.fill()
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [count])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[1]"
      style={{ width: '100%', height: '100%' }}
    />
  )
}
