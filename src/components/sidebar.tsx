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
  { href: "/settings", label: "Param\u00e8tres", icon: Settings },
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

      // Charger le statut du chatbot
      const { data: chatbotData } = await supabase
        .from("config_chatbot")
        .select("actif")
        .eq("user_id", user.id)
        .single()
      if (chatbotData) setChatbotActif(chatbotData.actif)

      // Charger le profil utilisateur
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, boutique_name")
        .eq("id", user.id)
        .single()
      if (profileData) setUserProfile(profileData)

      // Charger le nombre de nouvelles commandes
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
    <aside className="w-64 border-r border-cyber-border bg-cyber-bgSecond flex flex-col">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-cyber-cyan">YasmineStack</h1>
          {chatbotActif !== null && (
            chatbotActif ? (
              <CheckCircle2 className="h-4 w-4 text-cyber-cyan" />
            ) : (
              <XCircle className="h-4 w-4 text-cyber-red" />
            )
          )}
        </div>
        <p className="text-sm text-cyber-textSecondary">Dashboard</p>
      </div>

      {userProfile && (
        <div className="p-4 border-t border-cyber-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${userProfile.full_name}`}
                alt={userProfile.full_name}
              />
              <AvatarFallback>
                {userProfile.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-sm truncate">{userProfile.full_name}</p>
              <p className="text-xs text-cyber-textSecondary truncate">
                {userProfile.boutique_name}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 h-7 text-xs justify-start ps-8"
            onClick={() => router.push('/profile')}
          >
            Voir profil
          </Button>
        </div>
      )}
      <Separator />
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <span
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-cyber-cyanGlow text-cyber-cyan border-l-2 border-cyber-cyan"
                  : "text-cyber-textSecondary hover:text-cyber-cyan hover:bg-cyber-bgHover"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
      <Separator />

      {/* Indicateur de nouvelles commandes */}
      {newOrdersCount > 0 && (
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 bg-cyber-bgHover p-2 rounded-lg">
            <ShoppingCart className="h-4 w-4 text-cyber-cyan" />
            <span className="text-sm text-cyber-text">
              {newOrdersCount} commande{newOrdersCount > 1 ? 's' : ''} en attente
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 px-2 text-xs"
              onClick={() => router.push('/orders')}
            >
              Voir
            </Button>
          </div>
        </div>
      )}

      <Separator />
      <div className="p-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-cyber-textSecondary hover:text-cyber-cyan"
          onClick={toggleDark}
        >
          {dark ? (
            <Sun className="h-4 w-4 mr-2" />
          ) : (
            <Moon className="h-4 w-4 mr-2" />
          )}
          {dark ? "Mode clair" : "Mode sombre"}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-cyber-textSecondary hover:text-cyber-cyan"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          D\u00e9connexion
        </Button>
      </div>
    </aside>
  )
}
