"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { format, subDays, isSameDay, parseISO, subWeeks, startOfWeek, endOfWeek, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { fr } from "date-fns/locale"
import type { Order, Conversation } from "@/lib/types"

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"]

export default function AnalytiquesPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<"semaine" | "mois">("semaine")

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: ordersData } = await supabase
        .from("commandes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      const { data: convsData } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (ordersData) setOrders(ordersData)
      if (convsData) setConversations(convsData)
      setLoading(false)
    }
    fetchData()
  }, [])

  const now = new Date()
  const periodStart = period === "semaine" ? subWeeks(now, 4) : subMonths(now, 6)

  const periodOrders = orders.filter((o) => parseISO(o.created_at) >= periodStart)
  const periodConvs = conversations.filter((c) => parseISO(c.created_at) >= periodStart)

  const confirmedOrders = periodOrders.filter((o) => o.statut === "confirmée" || o.statut === "livrée")

  const productSales: Record<string, number> = {}
  confirmedOrders.forEach((o) => {
    if (o.produits) {
      const prods = o.produits.split(",").map((p) => p.trim())
      prods.forEach((p) => {
        productSales[p] = (productSales[p] || 0) + 1
      })
    }
  })
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }))

  const wilayaSales: Record<string, number> = {}
  confirmedOrders.forEach((o) => {
    if (o.wilaya) wilayaSales[o.wilaya] = (wilayaSales[o.wilaya] || 0) + 1
  })
  const topWilayas = Object.entries(wilayaSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }))

  const hourlyActivity: Record<string, number> = {}
  conversations.forEach((c) => {
    const hour = format(parseISO(c.created_at), "HH:00")
    hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1
  })
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const key = `${String(i).padStart(2, "0")}:00`
    return { hour: key, conversations: hourlyActivity[key] || 0 }
  })

  const weeklyRevenue: Record<string, number> = {}
  confirmedOrders.forEach((o) => {
    const weekKey = format(parseISO(o.created_at), "yyyy-'S'ww")
    weeklyRevenue[weekKey] = (weeklyRevenue[weekKey] || 0) + o.total
  })
  const revenueData = Object.entries(weeklyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([name, value]) => ({ name, value }))

  const totalConversations = periodConvs.length
  const totalOrders = confirmedOrders.length
  const conversionRate = totalConversations > 0
    ? ((totalOrders / totalConversations) * 100).toFixed(1)
    : "0"

  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + o.total, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytiques</h1>
          <p className="text-muted-foreground">
            Analysez les performances de votre boutique
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod("semaine")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === "semaine" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"
            }`}
          >
            4 semaines
          </button>
          <button
            onClick={() => setPeriod("mois")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === "mois" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"
            }`}
          >
            6 mois
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#ff6b35]">{totalRevenue.toLocaleString()} DA</div>
            <p className="text-xs text-muted-foreground">Période sélectionnée</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Commandes confirmées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#ff6b35]">{totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#ff6b35]">{totalConversations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#ff6b35]">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Convers → Commandes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produits les plus vendus</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {topProducts.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Aucune donnée</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wilayas les plus actives</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topWilayas}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                  }
                >
                  {topWilayas.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {topWilayas.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Aucune donnée</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité horaire des conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={2} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="conversations" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chiffre d'affaires par période</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-4))" }}
                />
              </LineChart>
            </ResponsiveContainer>
            {revenueData.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Aucune donnée</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
