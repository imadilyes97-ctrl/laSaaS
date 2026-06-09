'use client'

import { useEffect, useRef } from 'react'

const TOTAL_FRAMES = 91
const FPS = 30

const frames = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
  const num = String(i + 1).padStart(3, '0')
  return `/images/ezgif-frame-${num}.jpg`
})

export default function RobotAnimation({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imgs: HTMLImageElement[] = []
    let loaded = 0
    let started = false

    const startAnimation = () => {
      let index = 0
      let direction = 1
      let last = performance.now()
      const interval = 1000 / FPS

      const render = (now: number) => {
        if (now - last >= interval) {
          last = now
          const img = imgs[index]
          if (img?.complete) {
            const parent = canvas.parentElement!
            const rect = parent.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1
            const w = Math.round(rect.width * dpr)
            const h = Math.round(rect.height * dpr)

            if (canvas.width !== w || canvas.height !== h) {
              canvas.width = w
              canvas.height = h
            }

            ctx.clearRect(0, 0, w, h)
            const iw = img.naturalWidth
            const ih = img.naturalHeight
            const scale = Math.max(w / iw, h / ih)
            const dw = iw * scale
            const dh = ih * scale
            ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
          }

          index += direction
          if (index >= imgs.length - 1) { index = imgs.length - 1; direction = -1 }
          else if (index <= 0) { index = 0; direction = 1 }
        }
        rafRef.current = requestAnimationFrame(render)
      }

      rafRef.current = requestAnimationFrame(render)
    }

    frames.forEach((src) => {
      const img = new Image()
      img.src = src
      img.onload = img.onerror = () => {
        loaded++
        if (loaded === TOTAL_FRAMES && !started) {
          started = true
          startAnimation()
        }
      }
      imgs.push(img)
    })

    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div className={className ?? 'absolute inset-0 w-full h-full'}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
