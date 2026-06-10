'use client'

import { useState, useEffect } from 'react'
import { LogIn, Sparkles, Play, Menu, X, Clock, Bot, LayoutDashboard, Sliders, Zap, CheckCircle2, ShoppingCart, MessageSquare } from 'lucide-react'
import RobotAnimation from './RobotAnimation'
import ChatDemo from './ChatDemo'
import FAQSection from './FAQSection'

const LOGIN_URL = 'https://imadilyes97-ctrl-lasaas.vercel.app/auth/login'

export default function HeroSection() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('demo')

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const navLinks = [
    { href: '#avantages', label: 'Avantages' },
    { href: '#comment', label: 'Comment ça marche' },
    { href: '#tarifs', label: 'Tarifs' },
  ]

  const showTab = (tab: 'demo' | 'steps') => {
    setActiveTab(tab)
  }

  const avantages = [
    {
      icon: Clock,
      title: 'Disponibilité 24/7',
      desc: 'Ton chatbot répond aux clients à toute heure, sans pause. Plus de ventes manquées même la nuit ou le weekend.',
    },
    {
      icon: Bot,
      title: 'Automatisation des commandes',
      desc: 'Yasmine prend les commandes automatiquement, collecte nom, téléphone, wilaya et commune sans intervention humaine.',
    },
    {
      icon: LayoutDashboard,
      title: 'Gestion centralisée',
      desc: 'Suis ton stock, tes produits et toutes tes conversations depuis un seul dashboard simple et efficace.',
    },
    {
      icon: Sliders,
      title: 'Personnalisation facile',
      desc: 'Configure ton chatbot, ajoute tes produits et personnalise tes réponses sans aucune compétence technique.',
    },
    {
      icon: Zap,
      title: 'Gain de temps',
      desc: 'Réduis les tâches répétitives et concentre-toi sur la croissance de ta boutique.',
    },
  ]

  return (
    <>
      <section className="relative w-full min-h-screen sm:h-screen overflow-hidden bg-cyber-bg">
        <RobotAnimation className="absolute inset-0 w-full h-full z-[0]" />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0, 212, 255, 0.02) 0%, transparent 50%)'
        }} />

        <div className="absolute inset-0 pointer-events-none z-[1]" style={{ background: 'linear-gradient(to top, rgba(5,13,26,0.5) 0%, transparent 25%), linear-gradient(to right, rgba(5,13,26,0.4) 0%, transparent 30%)' }} />

        <nav className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 md:px-10 py-4 sm:py-6">
          <div className="flex items-center gap-2 text-cyber-cyan">
            <span className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight">
              LinkFlow<sup className="text-[10px] sm:text-xs font-medium">TM</sup>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1 bg-cyber-bgCard/80 backdrop-blur-md rounded-full pl-6 pr-1 py-1 shadow-sm border border-cyber-border">
            {navLinks.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm px-3 py-2 transition-colors ${
                  i === 0
                    ? 'font-semibold text-cyber-cyan'
                    : 'font-medium text-cyber-textSecondary hover:text-cyber-cyan'
                }`}
              >
                {link.label}
              </a>
            ))}
            <button className="ml-2 bg-cyber-cyan hover:bg-cyber-blue text-cyber-bg text-sm font-medium px-5 py-2.5 rounded-full transition-colors cursor-pointer btn-cyber">
              <Sparkles className="w-3.5 h-3.5 inline-block -mt-0.5 mr-1.5" />
              Essayer Gratuitement
            </button>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 text-cyber-textSecondary">
            <a
              href={LOGIN_URL}
              className="hidden sm:flex items-center gap-2 text-sm font-medium hover:text-cyber-cyan transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Se connecter
            </a>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden relative flex items-center justify-center w-10 h-10 rounded-full bg-cyber-bgCard/80 backdrop-blur-md border border-cyber-border text-cyber-cyan transition-all duration-300 hover:bg-cyber-bgHover cursor-pointer"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              <Menu
                className={`w-5 h-5 absolute transition-all duration-300 ${
                  menuOpen
                    ? 'opacity-0 rotate-90 scale-50'
                    : 'opacity-100 rotate-0 scale-100'
                }`}
              />
              <X
                className={`w-5 h-5 absolute transition-all duration-300 ${
                  menuOpen
                    ? 'opacity-100 rotate-0 scale-100'
                    : 'opacity-0 -rotate-90 scale-50'
                }`}
              />
            </button>
          </div>
        </nav>

        <div
          className={`lg:hidden fixed inset-0 z-20 transition-opacity duration-300 ${
            menuOpen
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-cyber-bg/80 backdrop-blur-sm" />
        </div>

        <div
          className={`lg:hidden fixed top-0 right-0 bottom-0 z-20 w-[85%] max-w-sm bg-cyber-bgCard/95 backdrop-blur-xl shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full pt-24 px-8 pb-8">
            <div className="flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`text-2xl font-semibold text-cyber-textPrimary py-4 border-b border-cyber-border transition-all duration-500 ${
                    menuOpen
                      ? 'translate-x-0 opacity-100'
                      : 'translate-x-8 opacity-0'
                  }`}
                  style={{
                    transitionDelay: menuOpen ? `${150 + i * 70}ms` : '0ms',
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div
              className={`mt-8 flex flex-col gap-4 transition-all duration-500 ${
                menuOpen
                  ? 'translate-x-0 opacity-100'
                  : 'translate-x-8 opacity-0'
              }`}
              style={{ transitionDelay: menuOpen ? '400ms' : '0ms' }}
            >
              <a
                href={LOGIN_URL}
                className="flex items-center gap-2 text-sm font-medium text-cyber-textSecondary hover:text-cyber-cyan transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Se connecter
              </a>
              <button className="mt-2 bg-cyber-cyan hover:bg-cyber-blue text-cyber-bg text-sm font-semibold px-5 py-3 rounded-full transition-colors cursor-pointer btn-cyber">
                Essayer Gratuitement
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center pt-24 sm:pt-28 md:pt-32 px-4 sm:px-6">
          <h1
            className="font-normal leading-[0.95] text-white text-[2rem] sm:text-4xl md:text-5xl lg:text-[4.75rem] xl:text-[5.25rem] max-w-5xl"
            style={{
              fontFamily:
                '"Neue Haas Grotesk Display Pro 55 Roman", "Neue Haas Grotesk Text Pro", "Helvetica Neue", Helvetica, Arial, sans-serif',
              letterSpacing: '-0.035em',
            }}
          >
            Automatise ta boutique{' '}
            <span className="text-cyber-cyan text-glow-cyan animate-pulse-slow">
              avec un chatbot
              <br className="hidden sm:block" /> intelligent
            </span>
          </h1>

          <p className="mt-6 sm:mt-8 text-cyber-textSecondary text-sm sm:text-base md:text-lg leading-relaxed max-w-md px-2">
            Répond aux clients 24h/24, prend les commandes automatiquement et gère ton stock depuis un seul dashboard.
          </p>
        </div>

        <div className="absolute left-4 right-4 sm:right-auto sm:left-6 md:left-10 bottom-6 sm:bottom-8 md:bottom-10 z-10 max-w-sm">
          <div className="flex items-center gap-2 text-cyber-textSecondary mb-3">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold sm:font-medium">
              FluxEngine<sup className="text-[10px]">TM</sup>
            </span>
          </div>
          <p className="text-cyber-textSecondary text-xs leading-relaxed mb-6 max-w-xs font-medium">
            Connecte ton chatbot Yasmine à ta page Facebook, gère tes produits et suis tes commandes en temps réel depuis un seul endroit.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <a
              href={LOGIN_URL}
              className="inline-block bg-cyber-cyan hover:bg-cyber-blue text-cyber-bg text-sm font-bold px-5 sm:px-6 py-2.5 sm:py-3 rounded-full transition-colors shadow-sm btn-cyber"
            >
              Commencer Maintenant
            </a>
            <button
              onClick={() => {
                const section = document.getElementById('comment')
                if (section) section.scrollIntoView({ behavior: 'smooth' })
                setActiveTab('demo')
              }}
              className="group text-cyber-cyan text-sm font-semibold sm:font-medium border border-cyber-cyan/40 hover:border-cyber-cyan px-5 sm:px-6 py-2.5 sm:py-3 rounded-full transition-colors cursor-pointer relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-1">
                <Play className="w-3.5 h-3.5" />
                Voir la démo
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-cyber-cyan/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></span>
            </button>
          </div>
        </div>

        <div className="hidden sm:flex absolute right-6 md:right-10 bottom-8 md:bottom-10 z-10 items-center gap-2 text-cyber-textSecondary text-sm">
          <button className="flex items-center justify-center w-6 h-6 rounded-full bg-cyber-cyan/20 backdrop-blur-sm hover:bg-cyber-cyan/30 transition-colors cursor-pointer">
            <Play className="w-3 h-3 fill-cyber-cyan text-cyber-cyan ml-0.5" />
          </button>
          <span className="font-medium">How we build?</span>
          <span className="text-cyber-textMuted">1:35</span>
        </div>
      </section>

      <section id="avantages" className="relative w-full py-20 sm:py-28 px-4 sm:px-6 bg-cyber-bg">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-white text-3xl sm:text-4xl md:text-5xl font-semibold mb-4">
            Pourquoi choisir LinkFlow ?
          </h2>
          <p className="text-center text-cyber-textSecondary text-sm sm:text-base mb-12 sm:mb-16 max-w-lg mx-auto">
            Tout ce dont tu as besoin pour gérer ta boutique connectée.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {avantages.map((item, i) => (
              <div
                key={i}
                className="bg-[#0d1f35] border border-[#00d4ff20] rounded-2xl p-6 sm:p-8 shadow-sm hover:border-[#00d4ff60] hover:shadow-[0_0_20px_#00d4ff15] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-[#00d4ff15] flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-[#00d4ff]" />
                </div>
                <h3 className="text-white text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-[#8ab4cc] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative w-full py-16 sm:py-20 px-4 sm:px-6 bg-cyber-bg">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { number: "500+", label: "Boutiques connectées", icon: Bot },
              { number: "24/7", label: "Disponibilité", icon: Clock },
              { number: "10K+", label: "Commandes traitées", icon: ShoppingCart },
              { number: "<2min", label: "Configuration rapide", icon: Zap },
            ].map((stat, i) => (
              <div key={i} className="bg-cyber-bgCard border border-cyber-border/30 rounded-xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-cyber-cyan/10 rounded-full flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-cyber-cyan" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-xs sm:text-sm text-cyber-textSecondary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="comment" className="relative w-full py-20 sm:py-28 px-4 sm:px-6 bg-cyber-bgSecond">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-white text-3xl sm:text-4xl md:text-5xl font-semibold mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-cyber-textSecondary text-sm sm:text-base mb-8 max-w-lg mx-auto">
              Découvrez comment Yasmine automatise vos ventes en 3 étapes simples
            </p>

            <div className="inline-flex items-center gap-1 bg-cyber-bgCard/50 rounded-full p-1 mb-12">
              <button
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${activeTab === 'demo' ? 'text-white bg-cyber-cyan/20 hover:bg-cyber-cyan/30' : 'text-cyber-textSecondary hover:text-white'}`}
                onClick={() => showTab('demo')}
              >
                <Bot className="w-4 h-4 inline-block mr-1 -mt-0.5" />
                Démo interactive
              </button>
              <button
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${activeTab === 'steps' ? 'text-white bg-cyber-cyan/20 hover:bg-cyber-cyan/30' : 'text-cyber-textSecondary hover:text-white'}`}
                onClick={() => showTab('steps')}
              >
                <ShoppingCart className="w-4 h-4 inline-block mr-1 -mt-0.5" />
                Étapes
              </button>
            </div>
          </div>

          <div id="demo-content" className={activeTab === 'demo' ? 'block' : 'hidden'}>
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              <div className="lg:w-1/2">
                <h3 className="text-white text-2xl font-semibold mb-4">Essayez Yasmine en direct</h3>
                <p className="text-cyber-textSecondary mb-6">
                  Discutez avec notre démo interactive pour voir comment votre chatbot répondra à vos clients
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyber-cyan" />
                    <span className="text-cyber-textSecondary text-sm">Réponses instantanées 24/7</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyber-cyan" />
                    <span className="text-cyber-textSecondary text-sm">Prise de commande automatique</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyber-cyan" />
                    <span className="text-cyber-textSecondary text-sm">Intégration Facebook Messenger</span>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 w-full">
                <ChatDemo />
              </div>
            </div>
          </div>

          <div id="steps-content" className={activeTab === 'steps' ? 'block' : 'hidden'}>
            <div className="relative">
              <div className="hidden lg:block absolute top-8 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] border-t border-dashed border-[#00d4ff20]"/>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                {[
                  {
                    num: '01',
                    title: 'Crée ton compte',
                    desc: 'Inscris-toi sur la plateforme, configure le nom de ton chatbot et connecte ta page Facebook Messenger en quelques minutes.',
                  },
                  {
                    num: '02',
                    title: 'Ajoute tes produits',
                    desc: 'Depuis le dashboard, ajoute tes produits avec photos, prix, tailles et couleurs. Yasmine les connaît instantanément.',
                  },
                  {
                    num: '03',
                    title: 'Reçois tes commandes',
                    desc: 'Tes clients chattent avec Yasmine sur Messenger, elle prend leurs commandes et tu les retrouves dans ton dashboard en temps réel.',
                  },
                ].map((step, i) => (
                  <div key={i} className="relative flex flex-col items-center text-center">
                    <div className="text-[#00d4ff20] text-8xl font-bold leading-none mb-6">
                      {step.num}
                    </div>
                    <h3 className="text-white font-semibold text-xl mb-3">
                      {step.title}
                    </h3>
                    <p className="text-[#8ab4cc] text-sm leading-relaxed max-w-xs">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />
    </>
  )
}
