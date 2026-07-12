"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import {
  LayoutDashboard,
  ShoppingCart,
  Settings,
  User,
  LogOut,
  Package,
  Briefcase,
  MessageSquare,
  BarChart3,
  Bot,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import gsap from "gsap"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/produits", label: "Produits", icon: Package },
  { href: "/services", label: "Services", icon: Briefcase },
  { href: "/orders", label: "Commandes", icon: ShoppingCart },
  { href: "/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/analytiques", label: "Analytiques", icon: BarChart3 },
  { href: "/chatbot", label: "Chatbot", icon: Bot },
  { href: "/settings", label: "Paramètres", icon: Settings },
  { href: "/profile", label: "Profil", icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [chatbotActif, setChatbotActif] = useState<boolean | null>(null)
  const [userProfile, setUserProfile] = useState<{
    full_name: string
    boutique_name: string
    avatar_url?: string
  } | null>(null)
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: chatbotData } = await supabase
        .from("config_chatbot")
        .select("actif")
        .eq("user_id", user.id)
        .single()
      if (chatbotData) setChatbotActif(chatbotData.actif)

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, boutique_name")
        .eq("id", user.id)
        .single()
      if (profileData) setUserProfile(profileData)

      const { count } = await supabase
        .from("commandes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("statut", "en_attente")
      if (count) setNewOrdersCount(count)
    }
    loadData()
  }, [])

  // Entrance animation
  useEffect(() => {
    const el = sidebarRef.current
    if (!el) return
    gsap.fromTo(el,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.5, ease: "cubic-bezier(0.23, 1, 0.32, 1)" }
    )
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        "relative flex flex-col border-r border-[rgba(255,107,53,0.08)] transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      style={{
        background: 'linear-gradient(180deg, #0b0716 0%, #06030b 100%)',
        transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 w-6 h-6 rounded-full bg-[#0f0a1e] border border-[rgba(255,107,53,0.15)] flex items-center justify-center text-[#a0a0b8] hover:text-[#ff6b35] hover:border-[rgba(255,107,53,0.3)] transition-all duration-200 shadow-md"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* Logo */}
      <div className={cn("p-5", collapsed && "p-3 flex justify-center")}>
        <div className={cn("flex items-center gap-2.5 mb-1", collapsed && "flex-col gap-1")}>
          <div className="w-8 h-8 min-w-[2rem] rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f72585] flex items-center justify-center shadow-lg shadow-[#ff6b35]/20 animate-glow-pulse">
            <span className="text-white text-sm font-bold">L</span>
          </div>
          {!collapsed && (
            <>
              <h1 className="text-lg font-semibold text-[#fcfcfc]" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                LinkFlow
              </h1>
              {chatbotActif !== null && (
                chatbotActif ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e]" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-[#ef4444]" />
                )
              )}
            </>
          )}
        </div>
        {!collapsed && (
          <p className="text-[10px] text-[#64647a] font-semibold tracking-[0.15em] uppercase mt-1">Dashboard</p>
        )}
      </div>

      {/* Profile */}
      {userProfile && !collapsed && (
        <div className="mx-3 mb-2 p-3 rounded-xl" style={{ background: 'rgba(255, 107, 53, 0.04)', border: '1px solid rgba(255, 107, 53, 0.06)' }}>
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 ring-2 ring-[rgba(255,107,53,0.15)]">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${userProfile.full_name}`}
                alt={userProfile.full_name}
              />
              <AvatarFallback className="bg-[#120f1e] text-[#a0a0b8]">
                {userProfile.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-[#fcfcfc] truncate">{userProfile.full_name}</p>
              <p className="text-[11px] text-[#64647a] truncate">{userProfile.boutique_name}</p>
            </div>
          </div>
        </div>
      )}

      {!collapsed && <Separator className="bg-[rgba(255,107,53,0.06)] mx-3 w-auto" />}

      {/* Navigation */}
      <nav className={cn("flex-1 p-2 space-y-0.5", collapsed && "p-2")}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-all duration-200",
                  collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                  isActive
                    ? "text-[#ff6b35] bg-[rgba(255,107,53,0.1)]"
                    : "text-[#9d9db5] hover:text-[#fcfcfc] hover:bg-[rgba(255,107,53,0.05)]"
                )}
                style={{
                  position: 'relative',
                  transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                }}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[#ff6b35] shadow-sm shadow-[#ff6b35]/50" />
                )}
                <item.icon className={cn("min-w-[1rem]", collapsed ? "h-5 w-5" : "h-4 w-4")} />
                {!collapsed && item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* New orders badge */}
      {newOrdersCount > 0 && !collapsed && (
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{
            background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 107, 53, 0.03))',
            border: '1px solid rgba(255, 107, 53, 0.12)',
          }}>
            <div className="w-7 h-7 rounded-lg bg-[rgba(255,107,53,0.15)] flex items-center justify-center">
              <ShoppingCart className="h-3.5 w-3.5 text-[#ff6b35]" />
            </div>
            <span className="text-xs text-[#9d9db5] flex-1">
              {newOrdersCount} en attente
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] font-semibold text-[#ff6b35] hover:text-[#e55a2b] hover:bg-[rgba(255,107,53,0.15)] rounded-md"
              onClick={() => router.push('/orders')}
            >
              Voir
            </Button>
          </div>
        </div>
      )}

      {!collapsed && <Separator className="bg-[rgba(255,107,53,0.06)] mx-3 w-auto" />}

      {/* Footer */}
      <div className={cn("p-2 space-y-0.5", collapsed && "p-2")}>
        <Button
          variant="ghost"
          className={cn(
            "w-full text-[#9d9db5] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] text-sm font-medium transition-all duration-200 rounded-lg",
            collapsed ? "justify-center p-2.5" : "justify-start px-3 py-2.5"
          )}
          onClick={handleSignOut}
        >
          <LogOut className={cn("min-w-[1rem]", collapsed ? "h-5 w-5" : "h-4 w-4 mr-2.5")} />
          {!collapsed && "Déconnexion"}
        </Button>
      </div>
    </aside>
  )
}
