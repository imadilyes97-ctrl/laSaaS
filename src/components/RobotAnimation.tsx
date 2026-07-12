'use client'

/**
 * RobotAnimation v5.1 — DIRECT VIDEO, ZERO CATCH
 *
 * La vidéo est toujours là. Si autoplay marche → ça tourne.
 * Si autoplay ne marche PAS (mobile strict) → la première frame
 * s'affiche quand même car on ne cache JAMAIS l'élément.
 * Un fond radial orange reste en dessous pour garantir
 * qu'il y a TOUJOURS quelque chose de visible.
 */
export default function RobotAnimation({ className }: { className?: string }) {
  return (
    <div className={className ?? 'absolute inset-0 w-full h-full'} style={{ overflow: 'hidden' }}>
      {/* Fond permanent — garanti visible même sans vidéo */}
      <div className="absolute inset-0 z-[1]" style={{
        background: `
          radial-gradient(ellipse 100% 60% at 50% 60%, rgba(255,107,53,0.12) 0%, transparent 70%),
          radial-gradient(ellipse 60% 40% at 30% 40%, rgba(124,58,237,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 70% 50%, rgba(255,107,53,0.04) 0%, transparent 60%)
        `,
        pointerEvents: 'none',
      }} />

      {/* Overlay gradient pour lisibilité du texte */}
      <div className="absolute inset-0 z-[3]" style={{
        background: `
          linear-gradient(180deg, rgba(6,3,11,0.05) 0%, rgba(6,3,11,0.2) 30%, rgba(6,3,11,0.5) 60%, rgba(6,3,11,0.85) 100%)
        `,
        pointerEvents: 'none',
      }} />

      {/* Video tag native — ne JAMAIS cacher cette balise */}
      {/* playsinline + muted + autoplay = supporté sur Chrome/Safari mobile depuis 2018 */}
      {/* Si autoplay refuse, la première frame de la vidéo reste affichée */}
      <video
        src="/videos/1780840008912.mp4"
        muted
        playsInline
        autoPlay
        loop
        preload="auto"
        crossOrigin="anonymous"
        className="w-full h-full"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          zIndex: 2,
        }}
      />
    </div>
  )
}
