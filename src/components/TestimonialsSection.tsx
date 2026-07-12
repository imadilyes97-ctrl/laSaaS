'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Karim B.',
    shop: 'Mode Orientale',
    avatar: 'KO',
    text: 'Yasmine a changé ma façon de gérer ma boutique. Mes clients commandent même à 2h du matin. Le meilleur investissement que j\'ai fait cette année.',
    rating: 5,
  },
  {
    name: 'Sarah M.',
    shop: 'Créations Sarah',
    avatar: 'SM',
    text: 'Je ne pensais pas qu\'un chatbot pouvait être aussi efficace. Les commandes sont prises sans erreur et le dashboard est ultra intuitif. Je recommande à 100%',
    rating: 5,
  },
  {
    name: 'Mohamed L.',
    shop: 'TechStore DZ',
    avatar: 'ML',
    text: 'Plus besoin de répondre aux mêmes questions tous les jours. Yasmine gère tout, je me concentre sur mon business. Gain de temps énorme !',
    rating: 5,
  },
  {
    name: 'Amina K.',
    shop: 'Beauty Secret',
    avatar: 'AK',
    text: 'La configuration a pris 5 minutes, et les premières commandes sont arrivées dans l\'heure. Interface magnifique et très professionnelle.',
    rating: 5,
  },
]

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const next = () => {
    setDirection(1)
    setCurrent(c => (c + 1) % testimonials.length)
  }

  const prev = () => {
    setDirection(-1)
    setCurrent(c => (c - 1 + testimonials.length) % testimonials.length)
  }

  // Auto-play
  useEffect(() => {
    intervalRef.current = setInterval(next, 4000)
    return () => clearInterval(intervalRef.current)
  }, [])

  // Scroll reveal
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    import('gsap').then(({ default: gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger)
        gsap.fromTo(el.querySelectorAll('.testimonial-card'), {
          opacity: 0, y: 40,
        }, {
          opacity: 1, y: 0,
          duration: 0.7, stagger: 0.1,
          ease: 'cubic-bezier(0.23, 1, 0.32, 1)',
          scrollTrigger: { trigger: el, start: 'top 75%', once: true },
        })
      })
    })
  }, [])

  const t = testimonials

  return (
    <section ref={sectionRef} className="relative w-full py-24 sm:py-32 px-4 sm:px-6 overflow-hidden" style={{ background: '#0b0716' }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124, 58, 237, 0.04) 0%, transparent 60%)',
      }} />

      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="tag tag-accent mb-4">Témoignages</div>
          <h2 className="text-[#fcfcfc] text-3xl sm:text-4xl md:text-5xl font-medium mb-4" style={{ fontFamily: "'Instrument Serif', Georgia, serif", letterSpacing: '-0.03em' }}>
            Ce que nos <span className="text-gradient-accent">clients</span> disent
          </h2>
          <p className="text-[#9d9db5] text-sm sm:text-base max-w-xl mx-auto">
            Rejoins les boutiques qui automatisent leurs ventes avec Yasmine.
          </p>
        </div>

        {/* Desktop: grid */}
        <div className="hidden md:grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {t.map((item, i) => (
            <div key={i} className="testimonial-card group relative rounded-xl p-6 transition-all duration-300" style={{
              background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.04), rgba(124, 58, 237, 0.03))',
              border: '1px solid rgba(255, 107, 53, 0.08)',
            }}>
              <Quote className="w-8 h-8 text-[rgba(255,107,53,0.15)] absolute top-4 right-4" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f72585] flex items-center justify-center text-white text-sm font-bold">
                  {item.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#fcfcfc]">{item.name}</p>
                  <p className="text-xs text-[#64647a]">{item.shop}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: item.rating }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-[#ff6b35] text-[#ff6b35]" />
                  ))}
                </div>
              </div>
              <p className="text-sm text-[#9d9db5] leading-relaxed">&ldquo;{item.text}&rdquo;</p>
            </div>
          ))}
        </div>

        {/* Mobile: carousel */}
        <div className="md:hidden relative">
          <div className="testimonial-card relative rounded-xl p-6 transition-all duration-300" style={{
            background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.04), rgba(124, 58, 237, 0.03))',
            border: '1px solid rgba(255, 107, 53, 0.08)',
          }}>
            <Quote className="w-8 h-8 text-[rgba(255,107,53,0.15)] absolute top-4 right-4" />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f72585] flex items-center justify-center text-white text-sm font-bold">
                {t[current].avatar}
              </div>
              <div>
                <p className="font-semibold text-sm text-[#fcfcfc]">{t[current].name}</p>
                <p className="text-xs text-[#64647a]">{t[current].shop}</p>
              </div>
              <div className="ml-auto flex gap-0.5">
                {Array.from({ length: t[current].rating }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-[#ff6b35] text-[#ff6b35]" />
                ))}
              </div>
            </div>
            <p className="text-sm text-[#9d9db5] leading-relaxed">&ldquo;{t[current].text}&rdquo;</p>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {t.map((_, i) => (
              <button key={i} onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i) }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === current ? 'bg-[#ff6b35] w-6' : 'bg-[rgba(255,107,53,0.2)] hover:bg-[rgba(255,107,53,0.4)]'
                }`}
              />
            ))}
          </div>

          {/* Arrows */}
          <button onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-8 h-8 rounded-full bg-[#0b0716] border border-[rgba(255,107,53,0.15)] flex items-center justify-center text-[#9d9db5] hover:text-[#ff6b35] transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-8 h-8 rounded-full bg-[#0b0716] border border-[rgba(255,107,53,0.15)] flex items-center justify-center text-[#9d9db5] hover:text-[#ff6b35] transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
