"use client"

import { useState } from "react"
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

  return (
    <div className="flex h-screen">
      <DashboardAnimations />
      <div
        className={`${
          sidebarOpen ? "fixed inset-0 z-40 flex" : "hidden"
        } lg:relative lg:flex lg:inset-auto`}
      >
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-[#07050a]/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className="relative z-50 lg:z-auto">
          <Sidebar />
        </div>
      </div>
      <main className="flex-1 overflow-y-auto p-4 md:p-8" style={{ background: '#07050a' }}>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden mb-4 text-[#a0a0b8] hover:text-[#fcfcfc] hover:bg-[rgba(255,107,53,0.08)]"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        {children}
      </main>
    </div>
  )
}
