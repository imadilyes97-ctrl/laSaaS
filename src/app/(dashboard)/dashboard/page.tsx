"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingCart,
  MessageSquare,
  DollarSign,
  TrendingUp,
  MapPin,
  Palette,
  Ruler,
  Package,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Printer,
  Trash2,
  Download,
  AlertTriangle,
  ShoppingBag,
  Search,
  Bot,
  ArrowUpRight,
  Sparkles,
  Zap,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts"
import { format, subDays, isSameDay, parseISO, formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import type { Order, Conversation } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LoadingSkeleton, EmptyState, usePageState } from "@/components/PageStates"

function playNotificationSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 800
    osc.type = "sine"
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  } catch { /* noop */ }
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const { isLoading, setLoaded } = usePageState({ minLoadingMs: 500 })
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const [dateRange, setDateRange] = useState("today")
  const [statutFilter, setStatutFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const alertTimeoutRef = useRef<NodeJS.Timeout>(undefined)
  const pageRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const today = new Date()

  // Page enter animation
  useEffect(() => {
    const el = pageRef.current
    if (!el || isLoading) return
    import('gsap').then(({ default: gsap }) => {
      gsap.fromTo(el,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'cubic-bezier(0.23, 1, 0.32, 1)' }
      )
    })
  }, [isLoading])

  const filteredOrders = orders
    .filter((o) => {
      if (searchTerm &&
          !`${o.nom_client} ${o.produits} ${o.wilaya} ${o.statut}`.toLowerCase()
            .includes(searchTerm.toLowerCase())) {
        return false
      }
      if (statutFilter !== "all" && o.statut !== statutFilter) {
        return false
      }
      const orderDate = parseISO(o.created_at)
      switch (dateRange) {
        case "yesterday":
          return isSameDay(orderDate, subDays(today, 1))
        case "week":
          return orderDate >= subDays(today, 7)
        case "month":
          return orderDate >= subDays(today, 30)
        case "today":
        default:
          return isSameDay(orderDate, today)
      }
    })

  const todayOrders = filteredOrders.filter((o) =>
    isSameDay(parseISO(o.created_at), today)
  )
  const todayConversations = conversations.filter((c) =>
    isSameDay(parseISO(c.created_at), today)
  )
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0)
  const avgBasket = filteredOrders.length > 0
    ? (filteredOrders.reduce((sum, o) => sum + o.total, 0) / filteredOrders.length)
    : 0
  const cancelRate = filteredOrders.length > 0
    ? ((filteredOrders.filter(o => o.statut === "annulée").length / filteredOrders.length) * 100).toFixed(1)
    : "0"

  const productCounts: Record<string, number> = {}
  const wilayaCounts: Record<string, number> = {}
  const couleurCounts: Record<string, number> = {}
  const tailleCounts: Record<string, number> = {}
  orders.forEach((o) => {
    if (o.produits) {
      o.produits.split(",").map(p => p.trim()).forEach(p => {
        productCounts[p] = (productCounts[p] || 0) + 1
      })
    }
    if (o.wilaya) wilayaCounts[o.wilaya] = (wilayaCounts[o.wilaya] || 0) + 1
    if (o.couleur) couleurCounts[o.couleur] = (couleurCounts[o.couleur] || 0) + 1
    if (o.taille) tailleCounts[o.taille] = (tailleCounts[o.taille] || 0) + 1
  })

  const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]
  const topWilaya = Object.entries(wilayaCounts).sort((a, b) => b[1] - a[1])[0]
  const topCouleur = Object.entries(couleurCounts).sort((a, b) => b[1] - a[1])[0]
  const topTaille = Object.entries(tailleCounts).sort((a, b) => b[1] - a[1])[0]

  const conversionRate = conversations.length > 0
    ? ((orders.length / conversations.length) * 100).toFixed(1)
    : "0"

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i)
    const dayOrders = orders.filter((o) => isSameDay(parseISO(o.created_at), date))
    return {
      date: format(date, "dd/MM"),
      commandes: dayOrders.length,
      revenu: dayOrders.reduce((sum, o) => sum + o.total, 0),
    }
  })

  const recentOrders = orders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [ordersRes, convsRes] = await Promise.all([
      supabase.from("commandes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("conversations").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ])

    if (ordersRes.data) setOrders(ordersRes.data)
    if (convsRes.data) setConversations(convsRes.data)
    setLoaded()
  }, [setLoaded])

  useEffect(() => {
    fetchData()
    const supabase = createClient()
    const channel = supabase
      .channel("commandes-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "commandes" }, (payload) => {
        const newOrder = payload.new as Order
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user && newOrder.user_id === user.id) {
            setOrders(prev => [newOrder, ...prev])
            playNotificationSound()
            setNewOrderAlert(true)
            if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current)
            alertTimeoutRef.current = setTimeout(() => setNewOrderAlert(false), 5000)
          }
        })
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current)
    }
  }, [fetchData])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("commandes").update({ statut: newStatus }).eq("id", orderId)
    if (!error) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, statut: newStatus } : o))
  }

  const exportData = () => {
    const csvData = [
      ["ID", "Client", "Wilaya", "Produits", "Total", "Statut", "Date"],
      ...filteredOrders.map(o => [o.id, o.nom_client, o.wilaya, o.produits, o.total, o.statut, format(parseISO(o.created_at), "yyyy-MM-dd HH:mm")])
    ]
    const csvContent = csvData.map(row => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `commandes-${format(new Date(), "yyyy-MM-dd")}.csv`
    link.click()
  }

  const deleteOrder = async (orderId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
      const supabase = createClient()
      await supabase.from("commandes").delete().eq("id", orderId)
      setOrders(prev => prev.filter(o => o.id !== orderId))
    }
  }

  const statutBadge = (statut: string) => {
    const variants: Record<string, "warning" | "success" | "default" | "destructive"> = {
      en_attente: "warning", confirmée: "success", livrée: "default", annulée: "destructive",
    }
    const labels: Record<string, string> = {
      en_attente: "En attente", confirmée: "Confirmée", livrée: "Livrée", annulée: "Annulée",
    }
    return <Badge className="badge-premium" variant={variants[statut] || "outline"}>{labels[statut] || statut}</Badge>
  }

  if (isLoading) return <LoadingSkeleton />

  return (
    <div ref={pageRef} className="space-y-6">
      {/* ═══ New Order Alert ═══ */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 toast-premium flex items-center gap-3 px-4 py-3"
          >
            <div className="w-8 h-8 rounded-lg bg-[rgba(255,107,53,0.15)] flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-[#ff6b35]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#fcfcfc]">Nouvelle commande !</p>
              <p className="text-xs text-[#9d9db5]">Une commande vient d&apos;être reçue</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Page Header ═══ */}
      <div className="page-header flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1>Dashboard</h1>
            <Sparkles className="h-4 w-4 text-[#ff6b35] animate-pulse-soft" />
          </div>
          <p>
            {dateRange === "today" ? "Aujourd'hui" :
             dateRange === "yesterday" ? "Hier" :
             dateRange === "week" ? "7 derniers jours" :
             "30 derniers jours"} · {format(today, "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[180px] pl-8 h-9 text-sm bg-[#0f0a1e] border-[rgba(255,107,53,0.12)]"
            />
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#64647a]" />
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px] h-9 text-sm bg-[#0f0a1e] border-[rgba(255,107,53,0.12)]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd&apos;hui</SelectItem>
              <SelectItem value="yesterday">Hier</SelectItem>
              <SelectItem value="week">7 jours</SelectItem>
              <SelectItem value="month">30 jours</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statutFilter} onValueChange={setStatutFilter}>
            <SelectTrigger className="w-[140px] h-9 text-sm bg-[#0f0a1e] border-[rgba(255,107,53,0.12)]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="en_attente">En attente</SelectItem>
              <SelectItem value="confirmée">Confirmées</SelectItem>
              <SelectItem value="livrée">Livrées</SelectItem>
              <SelectItem value="annulée">Annulées</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportData} className="h-9 border-[rgba(255,107,53,0.12)]">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      {/* ═══ Stats Grid ═══ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="stat-label">Commandes</span>
              <div className="stat-icon">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </div>
            <div className="stat-value">{todayOrders.length}</div>
            <p className="stat-label">{dateRange === "today" ? "aujourd'hui" : "période"}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="stat-label">Conversations</span>
              <div className="stat-icon" style={{ background: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed', borderColor: 'rgba(124, 58, 237, 0.15)' }}>
                <MessageSquare className="h-4 w-4" />
              </div>
            </div>
            <div className="stat-value" style={{ color: '#7c3aed' }}>{todayConversations.length}</div>
            <p className="stat-label">aujourd&apos;hui</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="stat-label">Chiffre d&apos;affaires</span>
              <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.15)' }}>
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="stat-value" style={{ color: '#22c55e' }}>{todayRevenue.toLocaleString()} <span className="text-sm font-medium opacity-60">DA</span></div>
            <p className="stat-label">aujourd&apos;hui</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="stat-label">Conversion</span>
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.15)' }}>
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{conversionRate}%</div>
            <p className="stat-label">conversations → commandes</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="stat-label">Annulations</span>
              <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="stat-value" style={{ color: '#ef4444' }}>{cancelRate}%</div>
            <p className="stat-label">
              {parseFloat(cancelRate) > 10 ? "⚠️ Taux élevé" : "✅ Bon taux"}
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="stat-label">Panier moyen</span>
              <div className="stat-icon">
                <ShoppingBag className="h-4 w-4" />
              </div>
            </div>
            <div className="stat-value">{avgBasket.toLocaleString()} <span className="text-sm font-medium opacity-60">DA</span></div>
            <p className="stat-label">par commande</p>
          </div>
        </motion.div>
      </div>

      {/* ═══ Secondary Stats ═══ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card !p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="stat-icon !w-8 !h-8"><Package className="h-3.5 w-3.5" /></div>
            <span className="text-xs font-medium text-[#64647a] uppercase tracking-wider">Top Produit</span>
          </div>
          <p className="font-semibold text-[#fcfcfc]">{topProduct ? `${topProduct[0]} (${topProduct[1]})` : "N/A"}</p>
        </div>
        <div className="stat-card !p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="stat-icon !w-8 !h-8"><MapPin className="h-3.5 w-3.5" /></div>
            <span className="text-xs font-medium text-[#64647a] uppercase tracking-wider">Top Wilaya</span>
          </div>
          <p className="font-semibold text-[#fcfcfc]">{topWilaya ? `${topWilaya[0]} (${topWilaya[1]})` : "N/A"}</p>
        </div>
        <div className="stat-card !p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="stat-icon !w-8 !h-8"><Palette className="h-3.5 w-3.5" /></div>
            <span className="text-xs font-medium text-[#64647a] uppercase tracking-wider">Top Couleur</span>
          </div>
          <p className="font-semibold text-[#fcfcfc]">{topCouleur ? `${topCouleur[0]} (${topCouleur[1]})` : "N/A"}</p>
        </div>
        <div className="stat-card !p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="stat-icon !w-8 !h-8"><Ruler className="h-3.5 w-3.5" /></div>
            <span className="text-xs font-medium text-[#64647a] uppercase tracking-wider">Top Taille</span>
          </div>
          <p className="font-semibold text-[#fcfcfc]">{topTaille ? `${topTaille[0]} (${topTaille[1]})` : "N/A"}</p>
        </div>
      </div>

      {/* ═══ Charts ═══ */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="chart-container">
          <h3 className="font-semibold text-sm text-[#fcfcfc] mb-4">Commandes — 7 jours</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,107,53,0.06)" />
              <XAxis dataKey="date" tick={{ fill: '#64647a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64647a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <RechartsTooltip
                contentStyle={{
                  background: 'rgba(15,10,30,0.95)',
                  border: '1px solid rgba(255,107,53,0.15)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(12px)',
                }}
                labelStyle={{ color: '#9d9db5' }}
              />
              <Bar dataKey="commandes" fill="#ff6b35" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-container">
          <h3 className="font-semibold text-sm text-[#fcfcfc] mb-4">Chiffre d&apos;affaires — 7 jours</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,107,53,0.06)" />
              <XAxis dataKey="date" tick={{ fill: '#64647a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64647a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <RechartsTooltip
                contentStyle={{
                  background: 'rgba(15,10,30,0.95)',
                  border: '1px solid rgba(255,107,53,0.15)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#9d9db5' }}
              />
              <Line type="monotone" dataKey="revenu" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: '#7c3aed', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ Orders Table ═══ */}
      <div className="card-premium">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,107,53,0.06)]">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#fcfcfc]">Commandes</h3>
            {filteredOrders.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(255,107,53,0.1)] text-[#ff6b35] font-medium">{filteredOrders.length}</span>
            )}
          </div>
          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
            {statutFilter === 'all' ? 'Tous les statuts' : statutFilter}
            <ChevronDown className="h-3 w-3" />
          </Badge>
        </div>
        <div className="overflow-x-auto p-0">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Client</th>
                <th>Wilaya</th>
                <th>Produits</th>
                <th className="text-right">Total</th>
                <th>Statut</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={Package}
                      title="Aucune commande"
                      description="Aucune commande trouvée pour cette période. Essayez de modifier les filtres."
                    />
                  </td>
                </tr>
              ) : (
                filteredOrders
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 10)
                  .map((order) => (
                    <tr key={order.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 ring-1 ring-[rgba(255,107,53,0.1)]">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${order.nom_client}`}
                              alt={order.nom_client}
                            />
                            <AvatarFallback className="bg-[#120f1e] text-xs">{order.nom_client.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm text-[#fcfcfc]">{order.nom_client}</p>
                            <p className="text-xs text-[#64647a]">{order.telephone}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant="outline" className="bg-[rgba(255,107,53,0.04)] text-[#9d9db5] border-[rgba(255,107,53,0.1)] text-xs">
                          {order.wilaya}
                        </Badge>
                      </td>
                      <td>
                        <TooltipPrimitive.Provider>
                          <TooltipPrimitive.Root>
                            <TooltipPrimitive.Trigger asChild>
                              <Badge variant="secondary" className="max-w-[180px] truncate cursor-pointer text-xs">
                                {order.produits}
                              </Badge>
                            </TooltipPrimitive.Trigger>
                            <TooltipPrimitive.Content side="top" className="bg-[#0f0a1e] border border-[rgba(255,107,53,0.15)] rounded-lg p-2 text-xs text-[#9d9db5]">
                              <p>{order.produits}</p>
                              {order.couleur && <p className="mt-1">Couleur: {order.couleur}</p>}
                              {order.taille && <p>Taille: {order.taille}</p>}
                            </TooltipPrimitive.Content>
                          </TooltipPrimitive.Root>
                        </TooltipPrimitive.Provider>
                      </td>
                      <td className="text-right font-semibold text-[#fcfcfc]">{order.total.toLocaleString()} DA</td>
                      <td>
                        <Select defaultValue={order.statut} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                          <SelectTrigger className="w-[120px] h-7 text-xs bg-[#0f0a1e] border-[rgba(255,107,53,0.1)]">
                            <SelectValue placeholder="Statut" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en_attente">En attente</SelectItem>
                            <SelectItem value="confirmée">Confirmée</SelectItem>
                            <SelectItem value="livrée">Livrée</SelectItem>
                            <SelectItem value="annulée">Annulée</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td>
                        <TooltipPrimitive.Provider>
                          <TooltipPrimitive.Root>
                            <TooltipPrimitive.Trigger asChild>
                              <p className="text-xs text-[#64647a] cursor-pointer">
                                {formatDistanceToNow(parseISO(order.created_at), { addSuffix: true, locale: fr })}
                              </p>
                            </TooltipPrimitive.Trigger>
                            <TooltipPrimitive.Content side="top" className="bg-[#0f0a1e] border border-[rgba(255,107,53,0.15)] rounded-lg p-2 text-xs text-[#9d9db5]">
                              <p>{format(parseISO(order.created_at), "PPpp", { locale: fr })}</p>
                            </TooltipPrimitive.Content>
                          </TooltipPrimitive.Root>
                        </TooltipPrimitive.Provider>
                      </td>
                      <td className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#0f0a1e] border-[rgba(255,107,53,0.15)]">
                            <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}`)}>
                              <Eye className="h-3.5 w-3.5 mr-2" /> Voir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const w = window.open("", "_blank")
                              if (w) {
                                w.document.write(`<html><head><title>Commande #${order.id}</title><style>body{font-family:Arial;padding:20px;color:#333}h1{color:#ff6b35}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}th{background:#f5f5f5}</style></head><body><h1>Commande #${order.id}</h1><p><strong>Client:</strong> ${order.nom_client}</p><p><strong>Téléphone:</strong> ${order.telephone}</p><p><strong>Wilaya:</strong> ${order.wilaya}</p><p><strong>Produits:</strong> ${order.produits}</p><p><strong>Total:</strong> ${order.total.toLocaleString()} DA</p></body></html>`)
                                w.document.close()
                                w.print()
                              }
                            }}>
                              <Printer className="h-3.5 w-3.5 mr-2" /> Imprimer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[rgba(255,107,53,0.1)]" />
                            <DropdownMenuItem className="text-[#ef4444] focus:text-[#ef4444]" onClick={() => deleteOrder(order.id)}>
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
        {filteredOrders.length > 10 && (
          <div className="text-center py-4 border-t border-[rgba(255,107,53,0.06)]">
            <Button variant="ghost" size="sm" className="text-[#ff6b35] text-xs" onClick={() => router.push('/orders')}>
              Voir toutes les commandes <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* ═══ Quick Actions ═══ */}
      <div className="card-premium !p-6">
        <h3 className="text-sm font-semibold text-[#fcfcfc] mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#ff6b35]" />
          Actions rapides
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Ajouter produit", icon: Package, href: '/produits?action=add' },
            { label: "Exporter données", icon: Download, action: exportData },
            { label: "Paramètres", icon: Bot, href: '/settings' },
            { label: "Chatbot", icon: MessageSquare, href: '/chatbot' },
          ].map((item, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => item.href ? router.push(item.href) : item.action?.()}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[rgba(255,107,53,0.08)] hover:border-[rgba(255,107,53,0.25)] bg-[rgba(255,107,53,0.02)] hover:bg-[rgba(255,107,53,0.05)] transition-all duration-200 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-[rgba(255,107,53,0.1)] flex items-center justify-center">
                <item.icon className="h-5 w-5 text-[#ff6b35]" />
              </div>
              <span className="text-xs font-medium text-[#9d9db5]">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
