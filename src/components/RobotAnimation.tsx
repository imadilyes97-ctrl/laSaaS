'use client'

/**
 * RobotAnimation v6 — CLOUDINARY CDN
 *
 * La vidéo est servie depuis Cloudinary CDN (pas de dossier public/)
 * → le middleware Next.js ne peut PAS l'intercepter
 * → fonctionne sur mobile, desktop, partout
 *
 * Cloudinary optimise automatiquement le format et la qualité
 * selon le navigateur et la connexion.
 */
const VIDEO_URL = 'https://res.cloudinary.com/dyhmq2jvq/video/upload/v1783900710/linkflow/dkg2a6i8omck0mspbvu8.mp4'

export default function RobotAnimation({ className }: { className?: string }) {
  return (
    <div className={className ?? 'absolute inset-0 w-full h-full'} style={{ overflow: 'hidden' }}>
      <video
        src={VIDEO_URL}
        muted
        playsInline
        autoPlay
        loop
        preload="auto"
        className="w-full h-full"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 30%',
        }}
      />
    </div>
  )
}
