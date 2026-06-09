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
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { format, subDays, isSameDay, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import type { Order, Conversation } from "@/lib/types"

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
  const alertTimeoutRef = useRef<NodeJS.Timeout>(undefined)

  const today = new Date()

  const todayOrders = orders.filter((o) =>
    isSameDay(parseISO(o.created_at), today)
  )
  const todayConversations = conversations.filter((c) =>
    isSameDay(parseISO(c.created_at), today)
  )
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0)

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

      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Aujourd'hui - {format(today, "EEEE d MMMM yyyy", { locale: fr })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Commandes aujourd'hui
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyber-cyan">{todayOrders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Conversations aujourd'hui
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyber-cyan">
              {todayConversations.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Chiffre d'affaires
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyber-cyan">{todayRevenue.toLocaleString()} DA</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyber-cyan">{conversionRate}%</div>
          </CardContent>
        </Card>
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
            <div className="text-lg font-bold text-cyber-cyan">
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
            <div className="text-lg font-bold text-cyber-cyan">
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
            <div className="text-lg font-bold text-cyber-cyan">
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
            <div className="text-lg font-bold text-cyber-cyan">
              {topTaille ? `${topTaille[0]} (${topTaille[1]})` : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
                <Tooltip />
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
                <Tooltip />
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

      <Card>
        <CardHeader>
          <CardTitle>Dernières commandes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Client</th>
                  <th className="text-left py-2 px-2">Wilaya</th>
                  <th className="text-left py-2 px-2">Produits</th>
                  <th className="text-left py-2 px-2">Total</th>
                  <th className="text-left py-2 px-2">Statut</th>
                  <th className="text-left py-2 px-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2">{order.nom_client}</td>
                    <td className="py-2 px-2">{order.wilaya}</td>
                    <td className="py-2 px-2">{order.produits}</td>
                    <td className="py-2 px-2">{order.total.toLocaleString()} DA</td>
                    <td className="py-2 px-2">{statutBadge(order.statut)}</td>
                    <td className="py-2 px-2">
                      {format(parseISO(order.created_at), "dd/MM/yyyy HH:mm")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
