'use client'

import { useEffect, useRef } from 'react'

/**
 * RobotAnimation v4.1 — CANVAS BOOMERANG FIABLE
 *
 * Solution fiable pour TOUS les navigateurs (mobile/desktop).
 * - Vidéo chargée en mémoire (cachée)
 * - Rendu sur canvas en temps réel
 * - Première frame capturée dès que possible → garantit une image même si autoplay bloqué
 * - Boomerang : playbackRate qui s'inverse à la fin
 */
export default function RobotAnimation({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const initedRef = useRef(false)

  useEffect(() => {
    if (initedRef.current) return
    initedRef.current = true

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let state: 'loading' | 'static' | 'playing' = 'loading'
    let staticFrame: HTMLCanvasElement | null = null
    let iw = 0, ih = 0
    let direction = 1

    const recalc = () => {
      if (!iw) return
      const dpr = window.devicePixelRatio || 1
      const w = window.innerWidth
      const h = window.innerHeight
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      canvas!.style.width = w + 'px'
      canvas!.style.height = h + 'px'
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const getCrop = (fw: number, fh: number) => {
      const w = window.innerWidth
      const h = window.innerHeight
      const imgRatio = fw / fh
      const viewRatio = w / h

      if (w < 768) {
        const zoom = 1.15
        if (imgRatio > viewRatio) {
          const sw = fh * viewRatio * zoom
          return { sx: (fw - sw) / 2, sy: 0, sw, sh: fh }
        } else {
          const sh = fw / viewRatio * zoom
          return { sx: 0, sy: (fh - sh) / 3, sw: fw, sh }
        }
      } else {
        const scale = 1.4
        const cx = fw / 2
        const cy = fh * 0.38
        let sw = fw / scale
        let sh = fh / scale
        let sx = cx - sw / 2
        let sy = cy - sh / 2
        sx = Math.max(0, Math.min(sx, fw - sw))
        sy = Math.max(0, Math.min(sy, fh - sh))
        return { sx, sy, sw, sh }
      }
    }

    const drawScaled = (img: CanvasImageSource) => {
      const dpr = window.devicePixelRatio || 1
      const w = window.innerWidth
      const h = window.innerHeight
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      canvas!.style.width = w + 'px'
      canvas!.style.height = h + 'px'
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      const { sx, sy, sw, sh } = getCrop(iw, ih)
      ctx!.clearRect(0, 0, w, h)
      ctx!.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
    }

    // Vidéo cachée
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.crossOrigin = 'anonymous'
    video.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;z-index:-1'
    document.body.appendChild(video)

    // Quand les métadonnées sont chargées, on a la résolution
    video.addEventListener('loadedmetadata', () => {
      iw = video.videoWidth
      ih = video.videoHeight
      recalc()
    })

    // Quand les premières données sont dispo, capturer une frame statique
    const captureFallback = () => {
      if (!video.videoWidth || staticFrame) return
      iw = video.videoWidth
      ih = video.videoHeight
      recalc()
      // Capturer dans un canvas temporaire
      const tmp = document.createElement('canvas')
      tmp.width = iw
      tmp.height = ih
      const tctx = tmp.getContext('2d')
      if (tctx) {
        tctx.drawImage(video, 0, 0)
        staticFrame = tmp
        if (state === 'loading') {
          state = 'static'
          drawScaled(tmp)
        }
      }
    }

    video.addEventListener('loadeddata', captureFallback, { once: true })
    // Certains navigateurs déclenchent 'canplay' avant 'loadeddata'
    video.addEventListener('canplay', captureFallback, { once: true })

    // Tentative de lecture
    const tryPlay = () => {
      video.play().then(() => {
        if (iw && state === 'loading') {
          state = 'playing'
        } else if (iw) {
          state = 'playing'
        }
      }).catch(() => {
        // Autoplay refusé (mobile) — on garde la frame statique
        if (staticFrame && state !== 'playing') {
          state = 'static'
        }
      })
    }

    video.addEventListener('canplaythrough', tryPlay, { once: true })

    // Fallback timer : si rien ne s'est passé après 3s, on tente quand même
    const fallbackTimer = setTimeout(() => {
      if (state === 'loading') tryPlay()
    }, 3000)

    video.src = '/videos/1780840008912.mp4'
    video.load()

    // Boucle de rendu
    const render = () => {
      if (state === 'playing' && video.videoWidth) {
        // Boomerang live
        const ct = video.currentTime
        const dur = video.duration
        if (direction > 0) {
          video.playbackRate = 1
          if (ct >= dur - 0.1) direction = -1
        } else {
          video.playbackRate = -0.8
          if (ct <= 0.1) direction = 1
        }
        drawScaled(video)
      } else if (state === 'static' && staticFrame) {
        drawScaled(staticFrame)
      }
      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    window.addEventListener('resize', recalc)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', recalc)
      clearTimeout(fallbackTimer)
      video.pause()
      video.removeAttribute('src')
      video.load()
      if (video.parentNode) video.parentNode.removeChild(video)
    }
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
        }}
      />
    </div>
  )
}
