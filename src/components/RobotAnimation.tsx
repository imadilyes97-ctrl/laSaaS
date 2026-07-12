'use client'

import { useEffect, useRef, useCallback } from 'react'

/**
 * RobotAnimation v2 — Ultra-performante
 * Capture les frames d'une vidéo courte sur canvas puis les joue en boomerang.
 * Au lieu de 91 requêtes HTTP individuelles, une seule vidéo est chargée.
 * Résultat : plus rapide, plus fluide, moins de mémoire.
 */
export default function RobotAnimation({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const framesRef = useRef<HTMLCanvasElement[]>([])
  const readyRef = useRef(false)

  const startBoomerang = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
    if (!ctx) return

    const frames = framesRef.current
    if (frames.length === 0) return

    const first = frames[0]
    const dpr = window.devicePixelRatio || 1
    const vw = window.innerWidth
    const vh = window.innerHeight

    canvas.width = vw * dpr
    canvas.height = vh * dpr
    canvas.style.width = `${vw}px`
    canvas.style.height = `${vh}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    let index = 0
    let direction = 1
    let last = performance.now()
    const interval = 1000 / 30

    const render = (now: number) => {
      if (now - last >= interval) {
        last = now
        const frame = frames[index]
        if (frame) {
          const iw = frame.width
          const ih = frame.height
          const vw = window.innerWidth
          const vh = window.innerHeight
          const imgRatio = iw / ih
          const viewRatio = vw / vh

          let sx = 0, sy = 0, sw = iw, sh = ih

          // Mobile — centrer avec léger zoom
          if (vw < 1024) {
            const zoom = 1.1
            if (imgRatio > viewRatio) {
              sw = ih * viewRatio * zoom
              sx = (iw - sw) / 2
            } else {
              sh = iw / viewRatio * zoom
              sx = 0
              sy = (ih - sh) / 3
            }
          }

          // Desktop — zoom sur le visage du robot
          if (vw >= 1024) {
            const scale = 1.4
            const cx = iw / 2
            const cy = ih * 0.38
            sw = iw / scale
            sh = ih / scale
            sx = cx - sw / 2
            sy = cy - sh / 2
            sx = Math.max(0, Math.min(sx, iw - sw))
            sy = Math.max(0, Math.min(sy, ih - sh))
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(frame, sx, sy, sw, sh, 0, 0, vw, vh)
        }

        index += direction
        if (index >= frames.length - 1) { index = frames.length - 1; direction = -1 }
        else if (index <= 0) { index = 0; direction = 1 }
      }
      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
  }, [])

  useEffect(() => {
    if (readyRef.current) return
    readyRef.current = true

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
    if (!ctx) return

    // Create hidden video element
    const video = document.createElement('video')
    videoRef.current = video
    video.src = '/videos/1780840008912.mp4'
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.crossOrigin = 'anonymous'
    video.style.display = 'none'
    document.body.appendChild(video)

    const frames: HTMLCanvasElement[] = []
    const MAX_WIDTH = 640
    let lastTime = -1
    let capturing = true

    const captureFrame = () => {
      if (!capturing || video.readyState < 2) return
      if (video.currentTime === lastTime) return
      lastTime = video.currentTime

      const vw = video.videoWidth
      const vh = video.videoHeight
      if (!vw || !vh) return

      const scale = Math.min(1, MAX_WIDTH / vw)
      const w = Math.round(vw * scale)
      const h = Math.round(vh * scale)

      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const cctx = c.getContext('2d')
      if (!cctx) return
      cctx.drawImage(video, 0, 0, w, h)
      frames.push(c)
    }

    const onEnded = () => {
      capturing = false
      video.remove()
      videoRef.current = null
      framesRef.current = frames
      startBoomerang()
    }

    const onLoaded = () => {
      video.play().catch(() => {})
      const vfc = video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number }
      const loop = () => {
        captureFrame()
        if (capturing) requestAnimationFrame(loop)
      }
      loop()
    }

    video.addEventListener('loadedmetadata', onLoaded)
    video.addEventListener('ended', onEnded)

    if (video.readyState >= 1) onLoaded()

    return () => {
      capturing = false
      cancelAnimationFrame(rafRef.current)
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('ended', onEnded)
      if (videoRef.current) { videoRef.current.remove(); videoRef.current = null }
    }
  }, [startBoomerang])

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
