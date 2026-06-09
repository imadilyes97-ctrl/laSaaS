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
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    const imgs: HTMLImageElement[] = []
    let loaded = 0
    let started = false

    const handleResize = () => {
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

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
            const dpr = window.devicePixelRatio || 1
            const cw = canvas.width / dpr
            const ch = canvas.height / dpr

            const iw = img.naturalWidth
            const ih = img.naturalHeight

            const imgRatio = iw / ih
            const canvasRatio = cw / ch

            let sx = 0, sy = 0, sw = iw, sh = ih

            if (imgRatio > canvasRatio) {
              sw = ih * canvasRatio
              sx = (iw - sw) / 2
            } else {
              sh = iw / canvasRatio
              sy = 0
            }

            if (window.innerWidth >= 1024) {
              const zoomOut = 0.85
              const newSw = sw / zoomOut
              const newSh = sh / zoomOut
              sx = Math.max(0, (iw - newSw) / 2)
              sy = Math.max(0, (ih - newSh) / 8)
              sw = Math.min(newSw, iw - sx)
              sh = Math.min(newSh, ih - sy)
            }

            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch)
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
      img.decoding = 'sync'
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

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', handleResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={className ?? 'absolute inset-0 w-full h-full'} style={{ overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center top',
        }}
      />
    </div>
  )
}
