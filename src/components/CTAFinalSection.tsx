'use client'

import { useEffect, useRef } from 'react'
import { Sparkles, ArrowUpRight, Bot, MessageCircle } from 'lucide-react'

export default function CTAFinalSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    import('gsap').then(({ default: gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger)
        gsap.fromTo(el.querySelectorAll('.cta-element'), {
          opacity: 0, y: 30,
        }, {
          opacity: 1, y: 0,
          duration: 0.7, stagger: 0.12,
          ease: 'cubic-bezier(0.23, 1, 0.32, 1)',
          scrollTrigger: { trigger: el, start: 'top 70%', once: true },
        })
      })
    })
  }, [])

  const PULSE_KEYFRAMES = [
    { boxShadow: '0 0 0 0 rgba(255, 107, 53, 0.4)' },
    { boxShadow: '0 0 0 20px rgba(255, 107, 53, 0)' },
  ] as const

  return (
    <section ref={sectionRef} className="relative w-full py-32 sm:py-40 px-4 sm:px-6 overflow-hidden" style={{ background: '#06030b' }}>
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse 80% 50% at 50% 50%, rgba(255, 107, 53, 0.08) 0%, transparent 70%),
          radial-gradient(ellipse 60% 40% at 30% 80%, rgba(124, 58, 237, 0.05) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 70% 20%, rgba(255, 107, 53, 0.04) 0%, transparent 60%)
        `,
      }} />

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Tag */}
        <div className="cta-element tag mb-6 mx-auto w-fit">
          <Sparkles className="w-3 h-3 text-[#ff6b35]" />
          <span className="text-xs font-semibold tracking-wider">Prêt à commencer ?</span>
        </div>

        {/* Title */}
        <h2 className="cta-element text-[#fcfcfc] text-3xl sm:text-4xl md:text-6xl font-medium mb-6 leading-[0.95]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", letterSpacing: '-0.03em' }}>
          Lance ta boutique <br />
          <span className="text-gradient">avec Yasmine</span>
        </h2>

        <p className="cta-element text-[#9d9db5] text-sm sm:text-base md:text-lg max-w-lg mx-auto mb-10 leading-relaxed">
          Rejoins les centaines de boutiques qui automatisent leurs ventes 24h/24 avec un chatbot intelligent. <br />
          <span className="text-[#64647a]">Gratuit pour commencer.</span>
        </p>

        {/* CTA buttons */}
        <div className="cta-element flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/auth/register"
            className="group inline-flex items-center gap-2 bg-[#ff6b35] hover:bg-[#e55a2b] text-[#06030b] text-sm font-semibold px-8 py-3.5 rounded-full transition-all duration-200 shadow-2xl shadow-[#ff6b35]/30 hover:shadow-[#ff6b35]/50 btn-glow"
            style={{ animation: 'glow-pulse 3s ease-in-out infinite' }}>
            <Bot className="w-4 h-4" />
            Créer mon compte gratuit
            <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>

          <a href="#comment"
            onClick={(e) => { e.preventDefault(); document.getElementById('comment')?.scrollIntoView({ behavior: 'smooth' }) }}
            className="group inline-flex items-center gap-2 text-[#fcfcfc] text-sm font-medium border border-[rgba(255,107,53,0.2)] hover:border-[rgba(255,107,53,0.5)] hover:bg-[rgba(255,107,53,0.05)] px-8 py-3.5 rounded-full transition-all duration-200">
            <MessageCircle className="w-4 h-4" />
            Voir la démo
          </a>
        </div>

        {/* Stats */}
        <div className="cta-element mt-16 flex flex-wrap justify-center gap-8 sm:gap-12">
          {[
            { number: '500+', label: 'Boutiques' },
            { number: '10K+', label: 'Commandes' },
            { number: '4.9', label: 'Note moyenne' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-[#fcfcfc]">{s.number}</p>
              <p className="text-xs text-[#64647a] font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
