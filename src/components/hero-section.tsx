'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Check, ArrowRight } from 'lucide-react'
import { useTypewriter } from '@/hooks/useTypewriter'

const SERVICES = ['Brand', 'Digital', 'Campaign', 'Other'] as const

export default function HeroSection() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedServices, setSelectedServices] = useState<string[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const prevXRef = useRef(0)
  const isInitialRef = useRef(true)

  const { displayed, done } = useTypewriter("we'd love to\nhear from you!")

  const toggleService = useCallback((service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service],
    )
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 1024) return

      if (isInitialRef.current) {
        isInitialRef.current = false
        prevXRef.current = e.clientX
        return
      }

      const delta = e.clientX - prevXRef.current
      prevXRef.current = e.clientX

      const scrubFactor = (delta / window.innerWidth) * 0.8 * video.duration
      const targetTime = Math.max(
        0,
        Math.min(video.duration, video.currentTime + scrubFactor),
      )
      video.currentTime = targetTime
    }

    const handleSeeked = () => {
      if (!video) return
    }

    window.addEventListener('mousemove', handleMouseMove)
    video.addEventListener('seeked', handleSeeked)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      video.removeEventListener('seeked', handleSeeked)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (window.innerWidth < 1024) {
      video.autoplay = true
      video.play().catch(() => {})
    }
  }, [])

  return (
    <div className="relative bg-white text-neutral-900 font-sans selection:bg-[#EAECE9] selection:text-[#1C2E1E] antialiased overflow-x-hidden flex flex-col lg:block lg:min-h-screen">
      <div className="order-last lg:order-none relative lg:absolute lg:inset-0 lg:z-0 overflow-hidden pointer-events-none w-full aspect-square md:aspect-video lg:aspect-auto lg:h-full bg-neutral-50 lg:bg-transparent">
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover object-right lg:object-right-bottom"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      <header className="fixed top-0 inset-x-0 z-10 px-5 sm:px-8 py-4 sm:py-5 flex flex-row justify-between items-center bg-transparent">
        <div className="flex flex-row items-center gap-3">
          <span className="text-[21px] sm:text-[26px] tracking-tight text-black font-medium select-none">
            Mainframe&reg;
          </span>
          <span className="text-[25px] sm:text-[30px] text-black select-none tracking-[-0.02em] font-medium leading-none mb-1">
            &#10033;
          </span>
        </div>

        <nav className="hidden md:flex flex-row items-center text-[23px] text-black">
          {['Labs', 'Studio', 'Openings', 'Shop'].map((link, i) => (
            <span key={link} className="flex items-center">
              <a href="#" className="hover:opacity-60 transition-opacity">
                {link}
              </a>
              {i < 3 && (
                <span className="opacity-40 mx-1 select-none">,&nbsp;</span>
              )}
            </span>
          ))}
        </nav>

        <a
          href="#"
          className="hidden md:inline text-[23px] text-black underline underline-offset-2 hover:opacity-60 transition-opacity"
        >
          Get in touch
        </a>

        <button
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="md:hidden flex flex-col gap-[5px] items-center justify-center p-2"
          aria-label="Toggle menu"
        >
          <span
            className={`w-6 h-[2px] bg-black transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`}
          />
          <span
            className={`w-6 h-[2px] bg-black transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}
          />
          <span
            className={`w-6 h-[2px] bg-black transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`}
          />
        </button>
      </header>

      <div
        className={`fixed inset-0 z-[9] bg-white/95 backdrop-blur-sm transition-all duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <nav className="flex flex-col items-center justify-center h-full gap-8 text-3xl text-black font-medium">
          {['Labs', 'Studio', 'Openings', 'Shop'].map((link) => (
            <a
              key={link}
              href="#"
              className="hover:opacity-60 transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link}
            </a>
          ))}
          <a
            href="#"
            className="underline underline-offset-4 hover:opacity-60 transition-opacity mt-4 text-2xl"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Get in touch
          </a>
        </nav>
      </div>

      <div className="relative z-10 flex flex-col order-first lg:order-none w-full bg-white lg:bg-transparent pb-8 lg:pb-0 lg:min-h-screen">
        <main
          id="spade-hero"
          className="w-full max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-[76px] font-normal tracking-tight text-black leading-[1.08] mb-8 select-none w-full whitespace-pre-wrap">
              {displayed}
              {!done && (
                <span className="inline-block w-[2px] h-[1.1em] bg-black align-middle ml-[2px] animate-blink" />
              )}
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <p className="text-lg md:text-xl text-[#5A635A] leading-relaxed font-normal mb-14 max-w-2xl">
              Whether you have questions, feedback, <br />
              drop us a message and we&apos;ll get back to you as soon as
              possible.
            </p>
          </motion.div>

          <div>
            <h2 className="text-2xl font-medium tracking-tight mb-2 text-black">
              What sort of service?
            </h2>
            <p className="opacity-85 text-[#738273] mb-8">
              Select all that apply
            </p>

            <div className="flex flex-wrap gap-3 mb-6">
              {SERVICES.map((service) => {
                const isActive = selectedServices.includes(service)
                return (
                  <motion.button
                    key={service}
                    onClick={() => toggleService(service)}
                    whileTap={{ scale: 0.97 }}
                    className={`relative px-5 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer select-none ${
                      isActive
                        ? 'bg-[#1C2E1E] text-white shadow-md shadow-emerald-950/5'
                        : 'bg-white text-[#1C2E1E] border border-[#F1F3F1] hover:bg-[#F1F3F1]/55'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="inline-block mr-1.5"
                      >
                        <Check className="w-3.5 h-3.5 inline-block -mt-0.5" />
                      </motion.span>
                    )}
                    {service}
                  </motion.button>
                )
              })}
            </div>

            <AnimatePresence mode="wait">
              {selectedServices.length === 0 ? (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 0.5, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="italic text-xs text-black"
                >
                  Please click to select services above.
                </motion.p>
              ) : (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="bg-[#FAFBF9] border rounded-2xl px-5 py-4 flex flex-row items-center justify-between gap-4">
                    <p className="text-sm text-[#4D6D47]">
                      Ready to inquire about: {selectedServices.join(', ')}
                    </p>
                    <button className="flex items-center gap-1.5 text-[#4D6D47] uppercase text-xs font-medium hover:opacity-70 transition-opacity cursor-pointer">
                      Let&apos;s Go
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
