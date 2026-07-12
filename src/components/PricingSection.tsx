'use client'

import { useEffect, useRef } from 'react'
import { Check, Sparkles, ArrowUpRight, Zap, Bot, BarChart3, MessageSquare } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: 'Gratuit',
    period: '15 jours',
    desc: 'Parfait pour découvrir LinkFlow',
    features: [
      'Chatbot Yasmine configurable',
      'Jusqu\'à 50 commandes/mois',
      'Dashboard de base',
      'Support email',
    ],
    cta: 'Essayer gratuitement',
    popular: false,
    icon: Zap,
  },
  {
    name: 'Pro',
    price: '4 900 DA',
    period: '/mois',
    desc: 'Pour les boutiques en croissance',
    features: [
      'Chatbot illimité',
      'Commandes illimitées',
      'Analytiques avancées',
      'Export CSV illimité',
      'Support prioritaire',
      'Personnalisation avancée',
    ],
    cta: 'Choisir Pro',
    popular: true,
    icon: Bot,
  },
  {
    name: 'Business',
    price: '9 900 DA',
    period: '/mois',
    desc: 'Solution complète pour professionnels',
    features: [
      'Tout Pro +',
      'Multi-boutiques',
      'API dédiée',
      'Webhooks personnalisés',
      'Intégration Facebook/Instagram',
      'Support VIP 24/7',
      'SLA garanti',
    ],
    cta: 'Choisir Business',
    popular: false,
    icon: BarChart3,
  },
]

export default function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const cardsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    import('gsap').then(({ default: gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger)

        const cards = cardsRef.current.filter(Boolean)
        gsap.fromTo(cards, { opacity: 0, y: 40, scale: 0.95 }, {
          opacity: 1, y: 0, scale: 1,
          duration: 0.7, stagger: 0.15,
          ease: 'cubic-bezier(0.23, 1, 0.32, 1)',
          scrollTrigger: {
            trigger: el,
            start: 'top 70%',
            once: true,
          },
        })
      })
    })
  }, [])

  return (
    <section id="tarifs" ref={sectionRef} className="relative w-full py-24 sm:py-32 px-4 sm:px-6 overflow-hidden" style={{ background: '#06030b' }}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse 60% 40% at 20% 50%, rgba(255, 107, 53, 0.05) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 50%, rgba(124, 58, 237, 0.04) 0%, transparent 60%)
        `,
      }} />

      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="tag mb-4">Tarifs</div>
          <h2 className="text-[#fcfcfc] text-3xl sm:text-4xl md:text-5xl font-medium mb-4" style={{ fontFamily: "'Instrument Serif', Georgia, serif", letterSpacing: '-0.03em' }}>
            Un tarif <span className="text-gradient">pour chaque besoin</span>
          </h2>
          <p className="text-[#9d9db5] text-sm sm:text-base max-w-xl mx-auto">
            Commence gratuitement, évolue quand tu veux. Pas d&apos;engagement, pas de surprise.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {plans.map((plan, i) => {
            const isPopular = plan.popular
            return (
              <div
                key={i}
                ref={(el) => { cardsRef.current[i] = el! }}
                className="relative group"
              >
                <div
                  className={`relative h-full rounded-2xl p-6 sm:p-8 transition-all duration-500 flex flex-col ${
                    isPopular
                      ? 'bg-gradient-to-b from-[rgba(255,107,53,0.08)] to-[rgba(255,107,53,0.02)] border-[rgba(255,107,53,0.25)] shadow-xl shadow-[#ff6b35]/5'
                      : 'bg-[#0b0716] border-[rgba(255,107,53,0.08)] hover:border-[rgba(255,107,53,0.2)]'
                  }`}
                  style={{
                    border: '1px solid',
                    transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isPopular) e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(255,107,53,0.05)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isPopular) e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Popular badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#ff6b35] to-[#f72585] text-[#06030b] text-xs font-bold shadow-lg shadow-[#ff6b35]/30 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      POPULAIRE
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${
                    isPopular
                      ? 'bg-[rgba(255,107,53,0.15)] border-[rgba(255,107,53,0.2)]'
                      : 'bg-[rgba(255,107,53,0.08)] border-[rgba(255,107,53,0.1)]'
                  }`}>
                    <plan.icon className="w-5 h-5 text-[#ff6b35]" />
                  </div>

                  {/* Name & price */}
                  <h3 className="text-xl font-semibold text-[#fcfcfc] mb-1">{plan.name}</h3>
                  <p className="text-[#9d9db5] text-sm mb-4">{plan.desc}</p>

                  <div className="mb-6">
                    <span className="text-3xl font-bold text-[#fcfcfc]">{plan.price}</span>
                    <span className="text-[#64647a] text-sm ml-1">{plan.period}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isPopular ? 'bg-[rgba(255,107,53,0.12)]' : 'bg-[rgba(255,107,53,0.08)]'
                        }`}>
                          <Check className={`w-3 h-3 ${isPopular ? 'text-[#ff6b35]' : 'text-[#9d9db5]'}`} />
                        </div>
                        <span className="text-sm text-[#9d9db5]">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => window.location.href = '/auth/register'}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 group/btn ${
                      isPopular
                        ? 'bg-[#ff6b35] hover:bg-[#e55a2b] text-[#06030b] shadow-lg shadow-[#ff6b35]/20'
                        : 'border border-[rgba(255,107,53,0.2)] hover:border-[rgba(255,107,53,0.4)] text-[#fcfcfc] hover:bg-[rgba(255,107,53,0.05)]'
                    }`}
                    style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
                  >
                    {plan.cta}
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom note */}
        <div className="text-center mt-10">
          <p className="text-[#64647a] text-sm">
            Tous les prix sont en Dinar Algérien (DA). <span className="text-[#9d9db5]">Pas de frais cachés.</span>
          </p>
        </div>
      </div>
    </section>
  )
}
