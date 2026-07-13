'use client'

import { useEffect, useRef } from 'react'

/**
 * RobotAnimation v7 — ANIMATION CANVAS TEMPS REEL
 *
 * Plus de vidéo. Une animation generative qui dessine
 * un motif techno/organique en temps réel.
 * Compatible TOUS les navigateurs, TOUS les OS.
 * Zéro fichier externe, zero requete HTTP.
 */
export default function RobotAnimation({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0, h = 0
    let time = 0

    const resize = () => {
      w = canvas!.width = window.innerWidth
      h = canvas!.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      time += 0.008
      ctx!.clearRect(0, 0, w, h)

      // Centrer le motif
      const cx = w / 2
      const cy = h * 0.45

      // ── 1. Lignes orbitales ──
      const layers = 4
      for (let l = 0; l < layers; l++) {
        const radius = 60 + l * 45 + Math.sin(time * 0.3 + l) * 15
        const speed = 0.4 + l * 0.15
        const rotation = time * speed + l * 1.2
        const points = 8 + l * 4
        const alpha = 0.15 + l * 0.04

        ctx!.beginPath()
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2 + rotation
          const r = radius + Math.sin(angle * 2 + time * 2 + l) * 12
          const x = cx + Math.cos(angle) * r
          const y = cy + Math.sin(angle) * r
          if (i === 0) ctx!.moveTo(x, y)
          else ctx!.lineTo(x, y)
        }
        ctx!.strokeStyle = `rgba(255, 107, 53, ${alpha})`
        ctx!.lineWidth = 1.5 - l * 0.2
        ctx!.stroke()
      }

      // ── 2. Cercles pulsants ──
      for (let i = 0; i < 5; i++) {
        const pulse = Math.sin(time * 1.5 + i * 1.8) * 0.5 + 0.5
        const radius = 30 + i * 25 + pulse * 15
        ctx!.beginPath()
        ctx!.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx!.strokeStyle = `rgba(124, 58, 237, ${0.06 + pulse * 0.06})`
        ctx!.lineWidth = 1
        ctx!.stroke()
      }

      // ── 3. Particules orbitantes ──
      for (let i = 0; i < 30; i++) {
        const orbitRadius = 50 + (i % 10) * 35
        const angle = (i / 30) * Math.PI * 2 + time * (0.3 + (i % 5) * 0.05)
        const x = cx + Math.cos(angle) * orbitRadius
        const y = cy + Math.sin(angle) * orbitRadius
        const size = 1 + Math.sin(time * 2 + i) * 0.5
        const alpha = 0.2 + Math.sin(time + i) * 0.15

        ctx!.beginPath()
        ctx!.arc(x, y, size, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(255, 107, 53, ${Math.max(0.05, alpha)})`
        ctx!.fill()
      }

      // ── 4. Éclairs lumineux (flash subtil) ──
      const flash = Math.sin(time * 0.5) * 0.5 + 0.5
      if (flash > 0.85) {
        const gradient = ctx!.createRadialGradient(cx, cy, 0, cx, cy, 200)
        gradient.addColorStop(0, `rgba(255, 107, 53, ${(flash - 0.85) * 0.15})`)
        gradient.addColorStop(1, 'rgba(255, 107, 53, 0)')
        ctx!.fillStyle = gradient
        ctx!.fillRect(0, 0, w, h)
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className={className ?? 'absolute inset-0 w-full h-full'} style={{ overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: 0.8,
        }}
      />
    </div>
  )
}
