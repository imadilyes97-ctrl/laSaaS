'use client'

import { useState, useEffect, useRef } from 'react'
import { LogIn, Sparkles, Play, Menu, X, Clock, Bot, LayoutDashboard, Sliders, Zap, CheckCircle2, ShoppingCart, MessageSquare, ArrowUpRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import RobotAnimation from './RobotAnimation'
import FloatingParticles from './FloatingParticles'
import ChatDemo from './ChatDemo'
import PricingSection from './PricingSection'
import TestimonialsSection from './TestimonialsSection'
import CTAFinalSection from './CTAFinalSection'
import FAQSection from './FAQSection'
import { EASE, useRevealStagger } from '@/lib/animations'

gsap.registerPlugin(ScrollTrigger)

const LOGIN_URL = 'https://imadilyes97-ctrl-lasaas.vercel.app/auth/login'

export default function HeroSection() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('demo')
  const heroRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const numbersRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // GSAP Hero entrance
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: EASE.out } })

    // Nav
    const navEl = navRef.current
    if (navEl) tl.fromTo(navEl, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6 })

    // Tag
    tl.fromTo('.hero-tag', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')

    // Heading word-by-word
    const headingEl = headingRef.current
    if (headingEl) {
      const text = headingEl.innerText
      headingEl.innerHTML = ''
      const words = text.split(' ')
      const wordSpans: HTMLSpanElement[] = []
      words.forEach((word, i) => {
        const isGradient = word.includes('intelligent') || word.includes('chatbot')
        const span = document.createElement('span')
        span.textContent = word + (i < words.length - 1 ? ' ' : '')
        span.style.display = 'inline-block'
        span.style.opacity = '0'
        span.style.transform = 'translateY(2rem) rotateX(15deg)'
        span.style.perspective = '800px'
        if (isGradient) {
          span.style.background = 'linear-gradient(135deg, #ff6b35, #f72585)'
          span.style.webkitBackgroundClip = 'text'
          span.style.webkitTextFillColor = 'transparent'
          span.style.backgroundClip = 'text'
        }
        headingEl.appendChild(span)
        wordSpans.push(span)
      })
      wordSpans.forEach((word, i) => {
        tl.to(word, {
          opacity: 1, y: 0, rotateX: 0, duration: 0.8, ease: EASE.out,
        }, `>-${0.7 - i * 0.002}`)
      })
    }

    // Subtitle
    const subtitleEl = subtitleRef.current
    if (subtitleEl) tl.fromTo(subtitleEl, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.1')

    // CTAs
    const ctaEl = ctaRef.current
    if (ctaEl) {
      const ctas = ctaEl.querySelectorAll('a, button')
      tl.fromTo(ctas, { opacity: 0, y: 15, scale: 0.98 }, {
        opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: EASE.spring,
      }, '-=0.2')
    }

    // Bottom
    tl.fromTo('.hero-bottom', { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=0.3')

    // ScrollTrigger stats count-up
    const validNumberEls = numbersRef.current.filter(Boolean) as HTMLDivElement[]
    validNumberEls.forEach((el) => {
      const endText = el.dataset.count || el.textContent || '0'
      const end = parseInt(endText.replace(/[^0-9]/g, '')) || 0
      const statCard = el.closest('.stat-hero')
      if (statCard) {
        ScrollTrigger.create({
          trigger: statCard,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.fromTo(el, { textContent: 0 }, {
              textContent: end,
              duration: 2,
              ease: EASE.out,
              snap: { textContent: 1 },
              onUpdate: () => {
                el.textContent = endText.includes('+')
                  ? Math.round(Number(el.textContent)) + '+'
                  : Math.round(Number(el.textContent)).toString()
              },
            })
          },
        })
      }
    })

    return () => { tl.kill() }
  }, [])

  // Cards stagger
  useRevealStagger('.advantage-card', { stagger: 0.1, y: 40 })
  useRevealStagger('.stat-hero', { stagger: 0.12, y: 30 })
  useRevealStagger('.step-card', { stagger: 0.12, y: 30 })

  const navLinks = [
    { href: '#avantages', label: 'Avantages' },
    { href: '#comment', label: 'Comment ça marche' },
    { href: '#tarifs', label: 'Tarifs' },
    { href: '#faq', label: 'FAQ' },
  ]

  const avantages = [
    {
      icon: Clock, title: 'Disponibilité 24/7',
      desc: 'Ton chatbot répond aux clients à toute heure, sans pause. Plus de ventes manquées, même la nuit ou le weekend.',
    },
    {
      icon: Bot, title: 'Automatisation des commandes',
      desc: 'Yasmine prend les commandes automatiquement, collecte nom, téléphone, wilaya et commune sans intervention humaine.',
    },
    {
      icon: LayoutDashboard, title: 'Gestion centralisée',
      desc: 'Suis ton stock, tes produits et toutes tes conversations depuis un seul dashboard simple et efficace.',
    },
    {
      icon: Sliders, title: 'Personnalisation facile',
      desc: 'Configure ton chatbot, ajoute tes produits et personnalise tes réponses sans aucune compétence technique.',
    },
    {
      icon: Zap, title: 'Gain de temps ×10',
      desc: 'Réduis les tâches répétitives et concentre-toi sur la croissance de ta boutique. Yasmine travaille pour toi.',
    },
  ]

  return (
    <>
      {/* ═══════ HERO ═══════ */}
      <section ref={heroRef} className="relative w-full min-h-screen overflow-hidden" style={{ background: '#06030b' }}>
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-animated opacity-50" />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `
            radial-gradient(ellipse 80% 60% at 10% 20%, rgba(255, 107, 53, 0.1) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 90% 80%, rgba(124, 58, 237, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 50% 50%, rgba(255, 107, 53, 0.04) 0%, transparent 50%)
          `,
        }} />
        <div className="absolute inset-0 bg-noise pointer-events-none" />

        {/* Floating particles */}
        <FloatingParticles count={25} />

        {/* Robot animation background */}
        <RobotAnimation className="absolute inset-0 w-full h-full z-[0] opacity-50" />

        {/* ══ NAV ══ */}
        <nav ref={navRef} className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-8 md:px-12 py-5 sm:py-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f72585] flex items-center justify-center shadow-lg shadow-[#ff6b35]/30 animate-glow-pulse">
              <span className="text-white text-sm font-bold">L</span>
            </div>
            <span className="text-[#fcfcfc] text-lg sm:text-xl font-semibold tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              LinkFlow
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1 bg-[#0b0716]/80 backdrop-blur-xl rounded-full pl-6 pr-1.5 py-1 border border-[rgba(255,107,53,0.12)] shadow-2xl shadow-black/30">
            {navLinks.map((link, i) => (
              <a key={link.href} href={link.href}
                className={`text-sm px-4 py-2 rounded-full transition-all duration-200 ${
                  i === 0 ? 'font-medium text-[#ff6b35] bg-[rgba(255,107,53,0.1)]' : 'font-medium text-[#9d9db5] hover:text-[#fcfcfc] hover:bg-[#161029]'
                }`}
                style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => window.location.href = LOGIN_URL}
              className="ml-2 bg-[#ff6b35] hover:bg-[#e55a2b] text-[#06030b] text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200 cursor-pointer shadow-lg shadow-[#ff6b35]/25 hover:shadow-[#ff6b35]/40 btn-glow"
              style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
            >
              <Sparkles className="w-3.5 h-3.5 inline-block -mt-0.5 mr-1.5" />
              Essayer Gratuitement
            </button>
          </div>

          <div className="flex items-center gap-4 text-[#9d9db5]">
            <a href={LOGIN_URL}
              className="hidden sm:flex items-center gap-2 text-sm font-medium hover:text-[#ff6b35] transition-colors duration-200"
              style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
            >
              <LogIn className="w-4 h-4" />
              Se connecter
            </a>
            <button onClick={() => setMenuOpen(v => !v)}
              className="lg:hidden relative flex items-center justify-center w-10 h-10 rounded-full bg-[#0b0716]/80 backdrop-blur-md border border-[rgba(255,107,53,0.12)] text-[#ff6b35] transition-all duration-300 hover:bg-[#161029] cursor-pointer"
              aria-label={menuOpen ? 'Fermer' : 'Menu'}
            >
              <Menu className={`w-5 h-5 absolute transition-all duration-300 ${menuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
              <X className={`w-5 h-5 absolute transition-all duration-300 ${menuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <div className={`lg:hidden fixed inset-0 z-20 transition-all duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-[#06030b]/80 backdrop-blur-lg" />
        </div>
        <div className={`lg:hidden fixed top-0 right-0 bottom-0 z-20 w-[85%] max-w-sm bg-[#0b0716]/95 backdrop-blur-2xl shadow-2xl border-l border-[rgba(255,107,53,0.08)] transition-transform duration-500 ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}>
          <div className="flex flex-col h-full pt-28 px-8 pb-8">
            <div className="flex flex-col gap-2">
              {navLinks.map((link, i) => (
                <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                  className="text-2xl font-medium text-[#fcfcfc] py-4 border-b border-[rgba(255,107,53,0.08)] transition-all duration-500"
                  style={{
                    fontFamily: "'Instrument Serif', Georgia, serif",
                    transitionDelay: menuOpen ? `${150 + i * 70}ms` : '0ms',
                    transform: menuOpen ? 'translateX(0)' : 'translateX(16px)',
                    opacity: menuOpen ? 1 : 0,
                  }}>
                  {link.label}
                </a>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-4 transition-all duration-500"
              style={{ transitionDelay: menuOpen ? '400ms' : '0ms', transform: menuOpen ? 'translateX(0)' : 'translateX(16px)', opacity: menuOpen ? 1 : 0 }}>
              <a href={LOGIN_URL} className="flex items-center gap-2 text-sm font-medium text-[#9d9db5] hover:text-[#ff6b35] transition-colors">
                <LogIn className="w-4 h-4" /> Se connecter
              </a>
              <button onClick={() => window.location.href = LOGIN_URL}
                className="mt-2 w-full bg-[#ff6b35] hover:bg-[#e55a2b] text-[#06030b] text-sm font-semibold px-5 py-3.5 rounded-full transition-all duration-200 cursor-pointer shadow-lg shadow-[#ff6b35]/20">
                <Sparkles className="w-4 h-4 inline-block -mt-0.5 mr-2" />
                Essayer Gratuitement
              </button>
            </div>
          </div>
        </div>

        {/* ══ HERO CONTENT ══ */}
        <div className="relative z-10 flex flex-col items-center text-center pt-28 sm:pt-32 md:pt-40 px-4 sm:px-6 max-w-6xl mx-auto">
          {/* Tag */}
          <div className="hero-tag tag flex items-center gap-2 px-4 py-1.5 mb-6 sm:mb-8">
            <Sparkles className="w-3 h-3 text-[#ff6b35]" />
            <span className="text-xs font-semibold tracking-wider">IA Conversationnelle</span>
          </div>

          {/* Heading */}
          <h1 ref={headingRef}
            className="font-normal leading-[0.92] text-[#fcfcfc] text-[2.5rem] sm:text-[3.5rem] md:text-[5rem] lg:text-[6rem] xl:text-[7.5rem] max-w-6xl"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif", letterSpacing: '-0.04em', visibility: 'hidden' }}>
            Automatise ta boutique avec un chatbot intelligent
          </h1>

          {/* Subtitle */}
          <p ref={subtitleRef} className="mt-6 sm:mt-8 text-[#9d9db5] text-sm sm:text-base md:text-lg leading-relaxed max-w-xl px-2">
            Yasmine répond à tes clients 24h/24, prend les commandes automatiquement
            et gère ton stock depuis un seul dashboard. Le tout sans effort.
          </p>

          {/* CTA */}
          <div ref={ctaRef} className="flex items-center gap-4 mt-8 sm:mt-10 flex-wrap justify-center">
            <a href={LOGIN_URL}
              className="group inline-flex items-center gap-2 bg-[#ff6b35] hover:bg-[#e55a2b] text-[#06030b] text-sm font-semibold px-8 py-3.5 rounded-full transition-all duration-200 shadow-xl shadow-[#ff6b35]/25 hover:shadow-[#ff6b35]/40 btn-glow"
              style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}>
              Commencer Maintenant
              <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <button onClick={() => { document.getElementById('comment')?.scrollIntoView({ behavior: 'smooth' }); setActiveTab('demo') }}
              className="group inline-flex items-center gap-2 text-[#fcfcfc] text-sm font-medium border border-[rgba(255,107,53,0.2)] hover:border-[rgba(255,107,53,0.5)] hover:bg-[rgba(255,107,53,0.05)] px-8 py-3.5 rounded-full transition-all duration-200 cursor-pointer relative overflow-hidden">
              <Play className="w-3.5 h-3.5" />
              Voir la démo
            </button>
          </div>
        </div>

        {/* ══ BOTTOM ══ */}
        <div className="hero-bottom absolute left-0 right-0 bottom-0 z-10 px-4 sm:px-8 md:px-12 pb-6 sm:pb-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 text-[#9d9db5] mb-1.5">
                <Sparkles className="w-3 h-3" />
                <span className="text-[10px] font-semibold tracking-[0.15em] uppercase">FluxEngine</span>
              </div>
              <p className="text-[#64647a] text-xs leading-relaxed font-medium">
                Connecte Yasmine à ta page Facebook, gère tes produits et suis tes commandes en temps réel depuis un seul endroit.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[#9d9db5] text-sm">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[rgba(255,107,53,0.1)] hover:bg-[rgba(255,107,53,0.2)] transition-colors cursor-pointer border border-[rgba(255,107,53,0.12)]">
                <Play className="w-3.5 h-3.5 fill-[#ff6b35] text-[#ff6b35] ml-0.5" />
              </div>
              <span className="font-medium">Comment ça marche</span>
              <span className="text-[#64647a]">1:35</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ ADVANTAGES ═══════ */}
      <section id="avantages" className="relative w-full py-24 sm:py-32 px-4 sm:px-6" style={{ background: '#06030b' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255, 107, 53, 0.04) 0%, transparent 60%)',
        }} />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16 sm:mb-20">
            <div className="tag mb-4">Pourquoi LinkFlow</div>
            <h2 className="text-[#fcfcfc] text-3xl sm:text-4xl md:text-5xl font-medium mb-4" style={{ fontFamily: "'Instrument Serif', Georgia, serif", letterSpacing: '-0.03em' }}>
              Tout ce dont tu as besoin<br />
              <span className="text-gradient">pour gérer ta boutique</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {avantages.map((item, i) => (
              <div key={i} className="advantage-card group relative overflow-hidden rounded-xl p-6 sm:p-8 transition-all duration-500"
                style={{
                  background: 'linear-gradient(180deg, rgba(255, 107, 53, 0.04) 0%, transparent 100%)',
                  border: '1px solid rgba(255, 107, 53, 0.08)',
                  transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 107, 53, 0.3)'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 107, 53, 0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 107, 53, 0.08)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}>
                <div className="w-10 h-10 rounded-xl bg-[rgba(255,107,53,0.1)] flex items-center justify-center mb-4 border border-[rgba(255,107,53,0.08)]">
                  <item.icon className="w-5 h-5 text-[#ff6b35]" />
                </div>
                <h3 className="text-[#fcfcfc] text-lg font-medium mb-2.5">{item.title}</h3>
                <p className="text-[#9d9db5] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ STATS ═══════ */}
      <section className="relative w-full py-16 sm:py-20 px-4 sm:px-6 border-y border-[rgba(255,107,53,0.06)]" style={{ background: '#0b0716' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { number: '500+', label: 'Boutiques connectées', icon: Bot },
              { number: '24/7', label: 'Disponibilité', icon: Clock },
              { number: '10K+', label: 'Commandes traitées', icon: ShoppingCart },
              { number: '<2min', label: 'Configuration rapide', icon: Zap },
            ].map((stat, i) => (
              <div key={i} className="stat-hero text-center p-6 sm:p-8 rounded-xl transition-all duration-300" style={{
                background: 'linear-gradient(180deg, rgba(255, 107, 53, 0.04) 0%, transparent 100%)',
                border: '1px solid rgba(255, 107, 53, 0.06)',
              }}>
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[rgba(255,107,53,0.08)] flex items-center justify-center border border-[rgba(255,107,53,0.06)]">
                  <stat.icon className="w-5 h-5 text-[#ff6b35]" />
                </div>
                <div ref={(el) => { numbersRef.current[i] = el }} data-count={stat.number}
                  className="text-2xl sm:text-3xl font-bold text-[#fcfcfc] mb-1">
                  {stat.number}
                </div>
                <div className="text-xs sm:text-sm text-[#9d9db5] font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="comment" className="relative w-full py-24 sm:py-32 px-4 sm:px-6" style={{ background: '#0b0716' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(124, 58, 237, 0.04) 0%, transparent 60%)',
        }} />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <div className="tag mb-4">Comment ça marche</div>
            <h2 className="text-[#fcfcfc] text-3xl sm:text-4xl md:text-5xl font-medium mb-4" style={{ fontFamily: "'Instrument Serif', Georgia, serif", letterSpacing: '-0.03em' }}>
              Yasmine automatise tes ventes<br />
              <span className="text-gradient">en 3 étapes simples</span>
            </h2>
            <p className="text-[#9d9db5] text-sm sm:text-base mb-10 max-w-lg mx-auto">
              De la configuration à la première commande, sans complication
            </p>

            {/* Tabs */}
            <div className="inline-flex items-center gap-1 bg-[#0b0716]/80 rounded-full p-1 mb-14 border border-[rgba(255,107,53,0.06)]">
              <button
                className={`px-4 sm:px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer ${
                  activeTab === 'demo' ? 'text-[#fcfcfc] bg-[rgba(255,107,53,0.1)] shadow-sm' : 'text-[#9d9db5] hover:text-[#fcfcfc] hover:bg-[#161029]'
                }`}
                onClick={() => setActiveTab('demo')}>
                <Bot className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                Démo interactive
              </button>
              <button
                className={`px-4 sm:px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer ${
                  activeTab === 'steps' ? 'text-[#fcfcfc] bg-[rgba(255,107,53,0.1)] shadow-sm' : 'text-[#9d9db5] hover:text-[#fcfcfc] hover:bg-[#161029]'
                }`}
                onClick={() => setActiveTab('steps')}>
                <ShoppingCart className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                Étapes
              </button>
            </div>
          </div>

          {/* Demo */}
          {activeTab === 'demo' && (
            <div className="reveal flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              <div className="lg:w-[45%]">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.15)] mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] animate-pulse" />
                  <span className="text-xs font-medium text-[#7c3aed]">Live Demo</span>
                </div>
                <h3 className="text-[#fcfcfc] text-2xl font-medium mb-4" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  Discute avec Yasmine
                </h3>
                <p className="text-[#9d9db5] mb-6 text-sm leading-relaxed">
                  Teste notre chatbot en direct pour voir comment il répond à tes clients, prend les commandes et collecte les informations automatiquement.
                </p>
                <div className="space-y-3">
                  {['Réponses instantanées 24/7', 'Prise de commande automatique', 'Intégration Facebook Messenger'].map((text, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[rgba(255,107,53,0.1)] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-[#ff6b35]" />
                      </div>
                      <span className="text-[#9d9db5] text-sm">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:w-[55%] w-full">
                <ChatDemo />
              </div>
            </div>
          )}

          {/* Steps */}
          {activeTab === 'steps' && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
                {[
                  { num: '01', title: 'Crée ton compte', desc: 'Inscris-toi sur la plateforme, configure le nom de ton chatbot et connecte ta page Facebook Messenger en quelques minutes.' },
                  { num: '02', title: 'Ajoute tes produits', desc: 'Depuis le dashboard, ajoute tes produits avec photos, prix, tailles et couleurs. Yasmine les connaît instantanément.' },
                  { num: '03', title: 'Reçois tes commandes', desc: 'Tes clients chattent avec Yasmine sur Messenger, elle prend leurs commandes et tu les retrouves dans ton dashboard en temps réel.' },
                ].map((step, i) => (
                  <div key={i} className="step-card relative flex flex-col items-center text-center">
                    <div className="text-7xl sm:text-8xl font-bold leading-none mb-6 text-transparent bg-clip-text" style={{
                      background: 'linear-gradient(180deg, rgba(255,107,53,0.15) 0%, transparent 100%)',
                      WebkitBackgroundClip: 'text',
                    }}>
                      {step.num}
                    </div>
                    <div className="w-12 h-0.5 rounded-full bg-[rgba(255,107,53,0.2)] mb-6" />
                    <h3 className="text-[#fcfcfc] font-medium text-xl mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                      {step.title}
                    </h3>
                    <p className="text-[#9d9db5] text-sm leading-relaxed max-w-xs">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <TestimonialsSection />
      <PricingSection />
      <CTAFinalSection />
      <FAQSection />
    </>
  )
}
