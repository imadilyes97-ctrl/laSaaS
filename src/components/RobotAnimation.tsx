'use client'

/**
 * RobotAnimation v5.2 — DIRECT VIDEO
 *
 * Approche native. La balise <video> avec muted + playsInline + autoPlay + loop
 * est supportée sur Chrome/Safari mobile depuis 2016+.
 * Le fond orange est un fallback si la vidéo met du temps à charger.
 */
export default function RobotAnimation({ className }: { className?: string }) {
  return (
    <div className={className ?? 'absolute inset-0 w-full h-full'} style={{ overflow: 'hidden' }}>
      {/* Vidéo — toujours visible, jamais cachée */}
      <video
        src="/videos/1780840008912.mp4"
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
