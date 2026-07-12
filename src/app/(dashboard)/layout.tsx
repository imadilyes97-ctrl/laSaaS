"use client"

import { useState, useRef, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import DashboardAnimations from "@/components/DashboardAnimations"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  // Animation when child changes
  useEffect(() => {
    const el = mainRef.current?.querySelector('main > div')
    if (!el) return
    import('gsap').then(({ default: gsap }) => {
      gsap.fromTo(el,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'cubic-bezier(0.23, 1, 0.32, 1)' }
      )
    })
  }, [children])

  return (
    <div className="flex h-screen" style={{ background: '#06030b' }}>
      <DashboardAnimations />

      {/* Mobile overlay */}
      <div
        className={`${
          sidebarOpen ? "fixed inset-0 z-40 flex" : "hidden"
        } lg:relative lg:flex lg:inset-auto`}
      >
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-[#06030b]/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className="relative z-50 lg:z-auto">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <main ref={mainRef} className="flex-1 overflow-y-auto" style={{ background: '#06030b' }}>
        <div className="sticky top-0 z-30 lg:hidden bg-[#06030b]/80 backdrop-blur-md border-b border-[rgba(255,107,53,0.06)]">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-[#9d9db5] hover:text-[#fcfcfc] hover:bg-[rgba(255,107,53,0.08)]"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#f72585] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">L</span>
              </div>
              <span className="text-sm font-semibold text-[#fcfcfc]" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>LinkFlow</span>
            </div>
          </div>
        </div>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
