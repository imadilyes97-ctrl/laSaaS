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

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/produits", label: "Produits", icon: Package },
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

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setDark(isDark)

    const loadChatbotStatus = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("config_chatbot")
        .select("actif")
        .eq("user_id", user.id)
        .single()

      if (data) setChatbotActif(data.actif)
    }
    loadChatbotStatus()
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
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold">YasmineStack</h1>
          {chatbotActif !== null && (
            chatbotActif ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )
          )}
        </div>
        <p className="text-sm text-muted-foreground">Dashboard</p>
      </div>
      <Separator />
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <span
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
      <Separator />
      <div className="p-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
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
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </aside>
  )
}
