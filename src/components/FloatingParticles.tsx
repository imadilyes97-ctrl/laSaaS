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
  color: string
}

/**
 * Floating particles background v2 — plus vivant.
 * Particules oranges, violettes et blanches qui flottent
 * avec des tailles et vitesses variées.
 */
export default function FloatingParticles({ count = 35 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const colors = [
      'rgba(255, 107, 53,',   // orange
      'rgba(124, 58, 237,',   // violet
      'rgba(247, 37, 133,',   // rose
      'rgba(255, 255, 255,',  // blanc
    ]

    const initParticles = () => {
      const w = canvas!.width = window.innerWidth
      const h = canvas!.height = window.innerHeight
      const arr: Particle[] = []
      for (let i = 0; i < count; i++) {
        arr.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          size: Math.random() * 2.5 + 0.5,
          alpha: Math.random() * 0.4 + 0.1,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.03 + 0.01,
          color: colors[Math.floor(Math.random() * colors.length)],
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

    // Lines between nearby particles
    const drawLines = (ctx: CanvasRenderingContext2D, particles: Particle[], w: number, h: number) => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.08
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(255, 107, 53, ${alpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
    }

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

        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10
        if (p.y > h + 10) p.y = -10

        const alpha = p.alpha * (0.5 + 0.5 * Math.sin(p.pulse))
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = `${p.color} ${alpha})`
        ctx!.fill()
      }

      // Draw connection lines
      drawLines(ctx!, particlesRef.current, w, h)

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
