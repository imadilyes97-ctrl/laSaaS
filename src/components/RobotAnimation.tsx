'use client'

import { useEffect, useRef } from 'react'

/**
 * RobotAnimation v3 — BOOMERANG DIRECT
 *
 * Au lieu de capturer des frames dans des canvas (lent), on utilise
 * la vidéo directement et on inverse le playbackDirection en temps réel.
 * Résultat : immédiat, fluide, zéro mémoire supplémentaire.
 *
 * Compatible mobile et desktop, le robot est toujours visible dès
 * le chargement de la page.
 */
export default function RobotAnimation({ className }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const directionRef = useRef(1)
  const rafRef = useRef(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let ready = false
    let started = false

    const startBoomerang = () => {
      if (started) return
      started = true

      const speed = 0.8
      video.playbackRate = speed

      const loop = () => {
        if (!video.paused && !video.ended) {
          const ct = video.currentTime
          const dur = video.duration

          if (directionRef.current > 0) {
            if (ct >= dur - 0.05) {
              directionRef.current = -1
              video.playbackRate = -speed
            }
          } else {
            if (ct <= 0.05) {
              directionRef.current = 1
              video.playbackRate = speed
            }
          }
        }
        rafRef.current = requestAnimationFrame(loop)
      }

      video.play().then(() => {
        rafRef.current = requestAnimationFrame(loop)
      }).catch(() => {
        // Autoplay bloqué — on laisse la vidéo en display none
        video.style.display = 'none'
      })
    }

    const onCanPlay = () => {
      if (!ready) {
        ready = true
        startBoomerang()
      }
    }

    if (video.readyState >= 3) {
      onCanPlay()
    } else {
      video.addEventListener('canplaythrough', onCanPlay, { once: true })
      video.load()
    }

    return () => {
      cancelAnimationFrame(rafRef.current)
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [])

  return (
    <div className={className ?? 'absolute inset-0 w-full h-full'} style={{ overflow: 'hidden' }}>
      <video
        ref={videoRef}
        src="/videos/1780840008912.mp4"
        muted
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        style={{
          position: 'absolute',
          minWidth: '100%',
          minHeight: '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'cover',
          objectPosition: 'center 30%',
        }}
        className="w-full h-full"
      />
    </div>
  )
}
