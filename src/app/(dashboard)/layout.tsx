"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen">
      <div
        className={`${
          sidebarOpen ? "fixed inset-0 z-40 flex" : "hidden"
        } lg:relative lg:flex lg:inset-auto`}
      >
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className="relative z-50 lg:z-auto">
          <Sidebar />
        </div>
      </div>
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden mb-4"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        {children}
      </main>
    </div>
  )
}
