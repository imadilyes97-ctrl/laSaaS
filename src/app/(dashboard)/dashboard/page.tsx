"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  ArrowUp,
  ArrowDown,
  Search,
  Settings,
  Bot,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Separator } from "@/components/ui/separator"

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
  } catch {}
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const [dateRange, setDateRange] = useState("today")
  const [statutFilter, setStatutFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const alertTimeoutRef = useRef<NodeJS.Timeout>(undefined)
  const router = useRouter()

  const today = new Date()

  // Filtrer les données selon les filtres sélectionnés
  const filteredOrders = orders
    .filter((o) => {
      // Filtre par terme de recherche
      if (searchTerm &&
          !`${o.nom_client} ${o.produits} ${o.wilaya} ${o.statut}`.toLowerCase()
            .includes(searchTerm.toLowerCase())) {
        return false
      }

      // Filtre par statut
      if (statutFilter !== "all" && o.statut !== statutFilter) {
        return false
      }

      // Filtre par période
      const orderDate = parseISO(o.created_at)
      const today = new Date()

      switch (dateRange) {
        case "yesterday":
          const yesterday = subDays(today, 1)
          return isSameDay(orderDate, yesterday)
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

  // Calculer le panier moyen
  const avgBasket = filteredOrders.length > 0
    ? (filteredOrders.reduce((sum, o) => sum + o.total, 0) / filteredOrders.length)
    : 0

  // Calculer le taux d'annulation
  const cancelRate = filteredOrders.length > 0
    ? ((filteredOrders.filter(o => o.statut === "annulée").length / filteredOrders.length) * 100).toFixed(1)
    : "0"

  const productCounts: Record<string, number> = {}
  const wilayaCounts: Record<string, number> = {}
  const couleurCounts: Record<string, number> = {}
  const tailleCounts: Record<string, number> = {}

  orders.forEach((o) => {
    if (o.produits) {
      const prods = o.produits.split(",").map((p) => p.trim())
      prods.forEach((p) => {
        productCounts[p] = (productCounts[p] || 0) + 1
      })
    }
    if (o.wilaya) wilayaCounts[o.wilaya] = (wilayaCounts[o.wilaya] || 0) + 1
    if (o.couleur)
      couleurCounts[o.couleur] = (couleurCounts[o.couleur] || 0) + 1
    if (o.taille) tailleCounts[o.taille] = (tailleCounts[o.taille] || 0) + 1
  })

  const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]
  const topWilaya = Object.entries(wilayaCounts).sort((a, b) => b[1] - a[1])[0]
  const topCouleur = Object.entries(couleurCounts).sort((a, b) => b[1] - a[1])[0]
  const topTaille = Object.entries(tailleCounts).sort((a, b) => b[1] - a[1])[0]

  const conversionRate =
    conversations.length > 0
      ? ((orders.length / conversations.length) * 100).toFixed(1)
      : "0"

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i)
    const dayOrders = orders.filter((o) =>
      isSameDay(parseISO(o.created_at), date)
    )
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
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: ordersData } = await supabase
      .from("commandes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    const { data: conversationsData } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (ordersData) setOrders(ordersData)
    if (conversationsData) setConversations(conversationsData)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()

    const supabase = createClient()
    const channel = supabase
      .channel("commandes-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "commandes" },
        (payload) => {
          const newOrder = payload.new as Order
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user && newOrder.user_id === user.id) {
              setOrders((prev) => [newOrder, ...prev])
              playNotificationSound()
              setNewOrderAlert(true)
              if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current)
              alertTimeoutRef.current = setTimeout(() => setNewOrderAlert(false), 5000)
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current)
    }
  }, [fetchData])

  const statutBadge = (statut: string) => {
    const variants: Record<string, "warning" | "success" | "default" | "destructive"> = {
      en_attente: "warning",
      confirmée: "success",
      livrée: "default",
      annulée: "destructive",
    }
    const labels: Record<string, string> = {
      en_attente: "En attente",
      confirmée: "Confirmée",
      livrée: "Livrée",
      annulée: "Annulée",
    }
    return (
      <Badge variant={variants[statut] || "outline"}>
        {labels[statut] || statut}
      </Badge>
    )
  }

  // Fonction pour mettre à jour le statut d'une commande
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("commandes")
      .update({ statut: newStatus })
      .eq("id", orderId)

    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, statut: newStatus } : o))
    }
  }

  // Fonction pour exporter les données
  const exportData = () => {
    const csvData = [
      ["ID", "Client", "Wilaya", "Produits", "Total", "Statut", "Date"],
      ...filteredOrders.map(o => [
        o.id,
        o.nom_client,
        o.wilaya,
        o.produits,
        o.total,
        o.statut,
        format(parseISO(o.created_at), "yyyy-MM-dd HH:mm")
      ])
    ]

    const csvContent = csvData.map(row => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `commandes-${format(new Date(), "yyyy-MM-dd")}.csv`
    link.click()
  }

  // Fonction pour voir les détails d'une commande
  const viewOrderDetails = (order: Order) => {
    router.push(`/orders/${order.id}`)
  }

  // Fonction pour supprimer une commande
  const deleteOrder = async (orderId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
      const supabase = createClient()
      const { error } = await supabase
        .from("commandes")
        .delete()
        .eq("id", orderId)

      if (!error) {
        setOrders(prev => prev.filter(o => o.id !== orderId))
      }
    }
  }

  // Fonction pour imprimer une commande
  const printOrder = (order: Order) => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Commande #${order.id}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #3b82f6; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>Commande #${order.id}</h1>
            <p><strong>Date:</strong> ${format(parseISO(order.created_at), "PPpp")}</p>
            <p><strong>Client:</strong> ${order.nom_client}</p>
            <p><strong>Téléphone:</strong> ${order.telephone}</p>
            <p><strong>Wilaya:</strong> ${order.wilaya}</p>
            <p><strong>Statut:</strong> ${statutBadge(order.statut).props.children}</p>

            <h2>Produits</h2>
            <p>${order.produits}</p>

            <h2>Total: ${order.total.toLocaleString()} DA</h2>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {newOrderAlert && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-2 flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Nouvelle commande reçue !
        </div>
      )}

      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Nouvelle commande reçue !
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {dateRange === "today" ? "Aujourd'hui" :
             dateRange === "yesterday" ? "Hier" :
             dateRange === "week" ? "7 derniers jours" :
             "30 derniers jours"} - {format(today, "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="yesterday">Hier</SelectItem>
              <SelectItem value="week">7 derniers jours</SelectItem>
              <SelectItem value="month">30 derniers jours</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statutFilter} onValueChange={setStatutFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="en_attente">En attente</SelectItem>
              <SelectItem value="confirmée">Confirmées</SelectItem>
              <SelectItem value="livrée">Livrées</SelectItem>
              <SelectItem value="annulée">Annulées</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[200px] pr-8"
            />
            <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>

          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Commandes aujourd'hui
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#ff6b35]">{todayOrders.length}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Conversations aujourd'hui
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#ff6b35]">
                {todayConversations.length}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Chiffre d'affaires
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#ff6b35]">{todayRevenue.toLocaleString()} DA</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#ff6b35]">{conversionRate}%</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taux d'annulation</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#ff6b35]">{cancelRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {parseFloat(cancelRate) > 10 ? "⚠️ Taux élevé" : "✅ Bon taux"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#ff6b35]">
                {avgBasket.toLocaleString()} DA
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Produit le plus demandé
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-[#ff6b35]">
              {topProduct ? `${topProduct[0]} (${topProduct[1]})` : "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Wilaya la plus active
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-[#ff6b35]">
              {topWilaya ? `${topWilaya[0]} (${topWilaya[1]})` : "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Couleur la plus demandée
            </CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-[#ff6b35]">
              {topCouleur ? `${topCouleur[0]} (${topCouleur[1]})` : "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Taille la plus demandée
            </CardTitle>
            <Ruler className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-[#ff6b35]">
              {topTaille ? `${topTaille[0]} (${topTaille[1]})` : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="chart-anim grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commandes par jour (7 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="commandes" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Chiffre d'affaires par jour</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Line
                  type="monotone"
                  dataKey="revenu"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-2))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Commandes {filteredOrders.length > 0 ? `(${filteredOrders.length})` : ''}</CardTitle>
            <Badge variant="secondary" className="flex items-center gap-1">
              {statutFilter === 'all' ? 'Tous' : statutFilter}
              <ChevronDown className="h-3 w-3" />
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="dashboard-table">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Wilaya</TableHead>
                    <TableHead>Produits</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">Aucune commande trouvée</p>
                          <p className="text-xs text-muted-foreground">
                            Essayez de changer les filtres ou ajoutez une nouvelle commande
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 10)
                      .map((order) => (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${order.nom_client}`}
                                  alt={order.nom_client}
                                />
                                <AvatarFallback>{order.nom_client.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{order.nom_client}</p>
                                <p className="text-xs text-muted-foreground">{order.telephone}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-muted">
                              {order.wilaya}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <TooltipPrimitive.Provider>
                              <TooltipPrimitive.Root>
                                <TooltipPrimitive.Trigger asChild>
                                  <Badge variant="secondary" className="max-w-[200px] truncate cursor-pointer">
                                    {order.produits}
                                  </Badge>
                                </TooltipPrimitive.Trigger>
                                <TooltipPrimitive.Content side="top">
                                  <p>{order.produits}</p>
                                  {order.couleur && <p>Couleur: {order.couleur}</p>}
                                  {order.taille && <p>Taille: {order.taille}</p>}
                                </TooltipPrimitive.Content>
                              </TooltipPrimitive.Root>
                            </TooltipPrimitive.Provider>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {order.total.toLocaleString()} DA
                          </TableCell>
                          <TableCell>
                            <Select
                              defaultValue={order.statut}
                              onValueChange={(value) => updateOrderStatus(order.id, value as any)}
                            >
                              <SelectTrigger className="w-[120px] h-8 text-xs">
                                <SelectValue placeholder="Statut" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en_attente">En attente</SelectItem>
                                <SelectItem value="confirmée">Confirmée</SelectItem>
                                <SelectItem value="livrée">Livrée</SelectItem>
                                <SelectItem value="annulée">Annulée</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <TooltipPrimitive.Provider>
                              <TooltipPrimitive.Root>
                                <TooltipPrimitive.Trigger asChild>
                                  <p className="text-xs text-muted-foreground cursor-pointer">
                                    {formatDistanceToNow(parseISO(order.created_at), {
                                      addSuffix: true,
                                      locale: fr
                                    })}
                                  </p>
                                </TooltipPrimitive.Trigger>
                                <TooltipPrimitive.Content side="top">
                                  <p>{format(parseISO(order.created_at), "PPpp", { locale: fr })}</p>
                                </TooltipPrimitive.Content>
                              </TooltipPrimitive.Root>
                            </TooltipPrimitive.Provider>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => viewOrderDetails(order)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => printOrder(order)}>
                                  <Printer className="h-4 w-4 mr-2" />
                                  Imprimer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => deleteOrder(order.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
            </div>
            {filteredOrders.length > 10 && (
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  Voir toutes les commandes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => router.push('/produits?action=add')}
              >
                <Package className="h-6 w-6 text-[#ff6b35]" />
                <span className="text-sm">Ajouter produit</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={exportData}
              >
                <Download className="h-6 w-6 text-[#ff6b35]" />
                <span className="text-sm">Exporter données</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => router.push('/settings')}
              >
                <Settings className="h-6 w-6 text-[#ff6b35]" />
                <span className="text-sm">Paramètres</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => router.push('/chatbot')}
              >
                <Bot className="h-6 w-6 text-[#ff6b35]" />
                <span className="text-sm">Configurer chatbot</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
