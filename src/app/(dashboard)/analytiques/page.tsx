"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
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
import { DollarSign, ShoppingCart, MessageCircle, TrendingUp, Package, MapPin, Clock, BarChart3 } from "lucide-react"
import type { Order, Conversation } from "@/lib/types"
import { LoadingSkeleton, EmptyState } from "@/components/PageStates"

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"]

/* ── Premium custom tooltip for all charts ── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: "rgba(15,10,30,0.95)",
        border: "1px solid rgba(255,107,53,0.3)",
        borderRadius: "8px",
        padding: "12px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(255,107,53,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      <p style={{ color: "#9d9db5", fontSize: "12px", marginBottom: "6px", fontWeight: 500 }}>
        {label}
      </p>
      {payload.map((entry: any, i: number) => (
        <p
          key={i}
          style={{
            color: "#fcfcfc",
            fontSize: "14px",
            fontWeight: 600,
            marginBottom: i < payload.length - 1 ? "4px" : 0,
          }}
        >
          <span style={{ color: entry.color || "#ff6b35", marginRight: "6px" }}>●</span>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  )
}

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
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ═══ Page Header ═══ */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1>Analytiques</h1>
          <p>Analysez les performances de votre boutique</p>
        </div>
        <div
          className="flex gap-1 p-1 rounded-xl self-start"
          style={{
            background: "rgba(255,107,53,0.04)",
            border: "1px solid rgba(255,107,53,0.08)",
          }}
        >
          <button
            onClick={() => setPeriod("semaine")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              period === "semaine"
                ? "btn-gradient shadow-lg"
                : "text-[#64647a] hover:text-[#9d9db5] hover:bg-[rgba(255,107,53,0.04)]"
            }`}
          >
            4 semaines
          </button>
          <button
            onClick={() => setPeriod("mois")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              period === "mois"
                ? "btn-gradient shadow-lg"
                : "text-[#64647a] hover:text-[#9d9db5] hover:bg-[rgba(255,107,53,0.04)]"
            }`}
          >
            6 mois
          </button>
        </div>
      </div>

      {/* ═══ Premium Stat Cards ═══ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card" style={{ animation: "fade-up 500ms var(--ease-out) both" }}>
          <div className="stat-icon">
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="stat-value">{totalRevenue.toLocaleString()} DA</div>
          <div className="stat-label">Chiffre d&apos;affaires</div>
          <p className="text-xs mt-1" style={{ color: "#64647a" }}>Période sélectionnée</p>
        </div>
        <div className="stat-card" style={{ animation: "fade-up 500ms var(--ease-out) both", animationDelay: "100ms" }}>
          <div className="stat-icon">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div className="stat-value">{totalOrders}</div>
          <div className="stat-label">Commandes confirmées</div>
        </div>
        <div className="stat-card" style={{ animation: "fade-up 500ms var(--ease-out) both", animationDelay: "200ms" }}>
          <div className="stat-icon">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="stat-value">{totalConversations}</div>
          <div className="stat-label">Conversations</div>
        </div>
        <div className="stat-card" style={{ animation: "fade-up 500ms var(--ease-out) both", animationDelay: "300ms" }}>
          <div className="stat-icon">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="stat-value">{conversionRate}%</div>
          <div className="stat-label">Taux de conversion</div>
          <p className="text-xs mt-1" style={{ color: "#64647a" }}>Convers → Commandes</p>
        </div>
      </div>

      {/* ═══ Charts Grid ═══ */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* ── Produits les plus vendus ── */}
        <div className="chart-container">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.1)" }}>
              <Package className="h-[18px] w-[18px]" style={{ color: "#ff6b35" }} />
            </div>
            <h3 style={{ color: "#fcfcfc", fontWeight: 600, fontSize: "1rem" }}>Produits les plus vendus</h3>
          </div>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,107,53,0.06)" />
                <XAxis
                  type="number"
                  tick={{ fill: "#64647a", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,107,53,0.08)" }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fill: "#64647a", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,107,53,0.04)" }} />
                <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={Package}
              title="Aucun produit vendu"
              description="Les produits les plus vendus apparaîtront ici dès les premières commandes."
            />
          )}
        </div>

        {/* ── Wilayas les plus actives ── */}
        <div className="chart-container">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.1)" }}>
              <MapPin className="h-[18px] w-[18px]" style={{ color: "#ff6b35" }} />
            </div>
            <h3 style={{ color: "#fcfcfc", fontWeight: 600, fontSize: "1rem" }}>Wilayas les plus actives</h3>
          </div>
          {topWilayas.length > 0 ? (
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
                  labelLine={{ stroke: "rgba(255,107,53,0.15)" }}
                >
                  {topWilayas.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={MapPin}
              title="Aucune wilaya"
              description="La répartition géographique apparaîtra une fois les premières commandes confirmées."
            />
          )}
        </div>

        {/* ── Activité horaire des conversations ── */}
        <div className="chart-container">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.1)" }}>
              <Clock className="h-[18px] w-[18px]" style={{ color: "#ff6b35" }} />
            </div>
            <h3 style={{ color: "#fcfcfc", fontWeight: 600, fontSize: "1rem" }}>Activité horaire des conversations</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,107,53,0.06)" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fill: "#64647a", fontSize: 12 }}
                interval={2}
                axisLine={{ stroke: "rgba(255,107,53,0.08)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64647a", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,107,53,0.04)" }} />
              <Bar dataKey="conversations" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Chiffre d'affaires par période ── */}
        <div className="chart-container">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.1)" }}>
              <BarChart3 className="h-[18px] w-[18px]" style={{ color: "#ff6b35" }} />
            </div>
            <h3 style={{ color: "#fcfcfc", fontWeight: 600, fontSize: "1rem" }}>Chiffre d&apos;affaires par période</h3>
          </div>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,107,53,0.06)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#64647a", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,107,53,0.08)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64647a", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-4))", strokeWidth: 0, r: 4 }}
                  activeDot={{
                    r: 6,
                    fill: "hsl(var(--chart-4))",
                    stroke: "rgba(15,10,30,0.95)",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="Aucun revenu"
              description="Le chiffre d'affaires apparaîtra une fois les premières commandes confirmées."
            />
          )}
        </div>
      </div>
    </div>
  )
}
