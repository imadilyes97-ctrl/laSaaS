"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
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
  Moon,
  Sun,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
  const [dark, setDark] = useState(false)
  const [chatbotActif, setChatbotActif] = useState<boolean | null>(null)
  const [userProfile, setUserProfile] = useState<{
    full_name: string;
    boutique_name: string;
    avatar_url?: string;
  } | null>(null)
  const [newOrdersCount, setNewOrdersCount] = useState(0)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setDark(isDark)

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

  const toggleDark = () => {
    const newDark = !dark
    setDark(newDark)
    document.documentElement.classList.toggle("dark", newDark)
    localStorage.setItem("theme", newDark ? "dark" : "light")
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <aside className="w-64 border-r border-[rgba(255,107,53,0.08)] flex flex-col" style={{ background: '#0c0a14' }}>
      {/* Logo */}
      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#f72585] flex items-center justify-center shadow-sm shadow-[#ff6b35]/20">
            <span className="text-white text-xs font-bold">L</span>
          </div>
          <h1 className="text-lg font-semibold text-[#fcfcfc]" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>LinkFlow</h1>
          {chatbotActif !== null && (
            chatbotActif ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e]" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-[#ef4444]" />
            )
          )}
        </div>
        <p className="text-xs text-[#6b6b80] font-medium tracking-wide">Dashboard</p>
      </div>

      {/* Profile */}
      {userProfile && (
        <div className="px-5 py-3 border-t border-[rgba(255,107,53,0.06)]">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 ring-1 ring-[rgba(255,107,53,0.15)]">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${userProfile.full_name}`}
                alt={userProfile.full_name}
              />
              <AvatarFallback className="bg-[#120f1e] text-[#a0a0b8]">
                {userProfile.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-[#fcfcfc] truncate">{userProfile.full_name}</p>
              <p className="text-xs text-[#6b6b80] truncate">{userProfile.boutique_name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 h-7 text-xs justify-start ps-8 text-[#6b6b80] hover:text-[#ff6b35] hover:bg-[rgba(255,107,53,0.08)]"
            onClick={() => router.push('/profile')}
          >
            Voir profil
          </Button>
        </div>
      )}

      <Separator className="bg-[rgba(255,107,53,0.06)]" />

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-[#ff6b35] bg-[rgba(255,107,53,0.08)] border-l-2 border-[#ff6b35]"
                    : "text-[#a0a0b8] hover:text-[#fcfcfc] hover:bg-[rgba(255,107,53,0.04)]"
                )}
                style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-[rgba(255,107,53,0.06)]" />

      {/* New orders badge */}
      {newOrdersCount > 0 && (
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(255, 107, 53, 0.06)', border: '1px solid rgba(255, 107, 53, 0.08)' }}>
            <ShoppingCart className="h-4 w-4 text-[#ff6b35]" />
            <span className="text-sm text-[#a0a0b8]">{newOrdersCount} commande{newOrdersCount > 1 ? 's' : ''} en attente</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 px-2 text-xs text-[#ff6b35] hover:text-[#e55a2b] hover:bg-[rgba(255,107,53,0.1)]"
              onClick={() => router.push('/orders')}
            >
              Voir
            </Button>
          </div>
        </div>
      )}

      <Separator className="bg-[rgba(255,107,53,0.06)]" />

      {/* Footer actions */}
      <div className="p-3 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start text-[#a0a0b8] hover:text-[#fcfcfc] hover:bg-[rgba(255,107,53,0.04)] text-sm font-medium"
          onClick={toggleDark}
        >
          {dark ? <Sun className="h-4 w-4 mr-2.5" /> : <Moon className="h-4 w-4 mr-2.5" />}
          {dark ? "Mode clair" : "Mode sombre"}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-[#a0a0b8] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] text-sm font-medium"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2.5" />
          Déconnexion
        </Button>
      </div>
    </aside>
  )
}
