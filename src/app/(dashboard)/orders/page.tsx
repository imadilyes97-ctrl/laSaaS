"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Download, Search, Filter, X, ShoppingBag, RotateCcw } from "lucide-react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { LoadingSkeleton, EmptyState } from "@/components/PageStates"

type Order = {
  id: string
  user_id: string
  nom_client: string
  telephone: string
  wilaya: string
  commune: string
  produits: string
  couleur: string
  taille: string
  total: number
  statut: string
  date: string
  created_at: string
}

const STATUTS = ["en_attente", "confirmée", "livrée", "annulée"]

const STATUT_CONFIG: Record<string, { bg: string; color: string; border: string; label: string }> = {
  en_attente: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "rgba(245,158,11,0.2)", label: "En attente" },
  confirmée: { bg: "rgba(34,197,94,0.12)", color: "#22c55e", border: "rgba(34,197,94,0.2)", label: "Confirmée" },
  livrée: { bg: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "rgba(59,130,246,0.2)", label: "Livrée" },
  annulée: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", border: "rgba(239,68,68,0.2)", label: "Annulée" },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterWilaya, setFilterWilaya] = useState("")
  const [filterStatut, setFilterStatut] = useState("")
  const [filterProduit, setFilterProduit] = useState("")
  const [dateDebut, setDateDebut] = useState("")
  const [dateFin, setDateFin] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const fetchOrders = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("commandes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (data) {
      setOrders(data)
      setFilteredOrders(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()

    const supabase = createClient()
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "commandes" },
        () => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    let result = [...orders]

    if (search) {
      result = result.filter(
        (o) =>
          o.nom_client?.toLowerCase().includes(search.toLowerCase()) ||
          o.telephone?.includes(search) ||
          o.id?.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (filterWilaya) {
      result = result.filter((o) => o.wilaya === filterWilaya)
    }
    if (filterStatut) {
      result = result.filter((o) => o.statut === filterStatut)
    }
    if (filterProduit) {
      result = result.filter((o) =>
        o.produits?.toLowerCase().includes(filterProduit.toLowerCase())
      )
    }
    if (dateDebut) {
      result = result.filter((o) => o.created_at >= dateDebut)
    }
    if (dateFin) {
      result = result.filter(
        (o) => o.created_at <= dateFin + "T23:59:59"
      )
    }

    setFilteredOrders(result)
  }, [search, filterWilaya, filterStatut, filterProduit, dateDebut, dateFin, orders])

  const wilayas = [...new Set(orders.map((o) => o.wilaya).filter(Boolean))]
  const produits = [...new Set(orders.map((o) => o.produits).filter(Boolean))]

  const exportCSV = () => {
    const headers = [
      "ID",
      "Client",
      "Téléphone",
      "Wilaya",
      "Commune",
      "Produits",
      "Couleur",
      "Taille",
      "Total",
      "Statut",
      "Date",
    ]
    const rows = filteredOrders.map((o) => [
      o.id,
      o.nom_client,
      o.telephone,
      o.wilaya,
      o.commune,
      o.produits,
      o.couleur,
      o.taille,
      o.total.toString(),
      o.statut,
      o.created_at,
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `commandes_${format(new Date(), "yyyy-MM-dd")}.csv`
    link.click()
  }

  const updateStatut = async (orderId: string, newStatut: string) => {
    const supabase = createClient()
    await supabase.from("commandes").update({ statut: newStatut }).eq("id", orderId)

    if (newStatut === "confirmée") {
      const order = orders.find((o) => o.id === orderId)
      if (order?.produits) {
        const productNames = order.produits.split(",").map((p) => p.trim()).filter(Boolean)
        for (const name of productNames) {
          await supabase.rpc("decrement_stock", {
            p_user_id: order.user_id,
            p_product_name: name,
          })
        }
      }
    }

    fetchOrders()
    setSelectedOrder(null)
  }

  const statutBadge = (statut: string) => {
    const cfg = STATUT_CONFIG[statut] || { bg: "rgba(100,100,122,0.12)", color: "#64647a", border: "rgba(100,100,122,0.2)", label: statut }
    return (
      <Badge
        className="badge-premium"
        style={{
          background: cfg.bg,
          color: cfg.color,
          borderColor: cfg.border,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "0.2rem 0.75rem",
          fontSize: "0.75rem",
          fontWeight: 500,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: cfg.color,
            flexShrink: 0,
          }}
        />
        {cfg.label}
      </Badge>
    )
  }

  const hasActiveFilters = search || filterWilaya || filterStatut || filterProduit || dateDebut || dateFin

  const resetFilters = () => {
    setSearch("")
    setFilterWilaya("")
    setFilterStatut("")
    setFilterProduit("")
    setDateDebut("")
    setDateFin("")
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div style={{ animation: "fade-up 500ms cubic-bezier(0.23,1,0.32,1)" }}>
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 page-header">
        <div>
          <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Commandes
          </h1>
          <p className="text-sm" style={{ color: "var(--textMuted)", marginTop: 4 }}>
            <span style={{ color: "var(--primary)", fontWeight: 600 }}>{filteredOrders.length}</span> commande{filteredOrders.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={exportCSV}
          className="btn-gradient"
          style={{
            background: "linear-gradient(135deg, #ff6b35, #f72585)",
            color: "#06030b",
            fontWeight: 600,
            fontSize: "0.8125rem",
            height: 40,
            padding: "0 1.25rem",
            borderRadius: 10,
            border: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
          }}
        >
          <Download style={{ width: 16, height: 16 }} />
          Export CSV
        </Button>
      </div>

      {/* ── Filters Section ── */}
      <div className="card-premium" style={{ marginBottom: 24 }}>
        <div style={{ padding: "1.25rem 1.5rem" }}>
          {/* Filter header */}
          <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "var(--primaryDim)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--border)",
              }}
            >
              <Filter style={{ width: 13, height: 13, color: "var(--primary)" }} />
            </div>
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--textMuted)" }}>
              Filtres
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                style={{
                  marginLeft: "auto",
                  fontSize: "0.75rem",
                  color: "var(--primary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 8px",
                  borderRadius: 6,
                  transition: "all 200ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--primaryDim)" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
              >
                <RotateCcw style={{ width: 12, height: 12 }} />
                Réinitialiser
              </button>
            )}
          </div>

          {/* Filter grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 14,
                  height: 14,
                  color: "var(--textMuted)",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  paddingLeft: 32,
                  height: 38,
                  fontSize: "0.8125rem",
                  background: "var(--bgCard)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--textPrimary)",
                  width: "100%",
                }}
              />
            </div>

            {/* Wilaya */}
            <Select value={filterWilaya} onValueChange={setFilterWilaya}>
              <SelectTrigger
                className="select-trigger-premium"
                style={{ height: 38, fontSize: "0.8125rem", borderRadius: 8, width: "100%" }}
              >
                <SelectValue placeholder="Wilaya" />
              </SelectTrigger>
              <SelectContent
                style={{
                  background: "var(--bgElevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              >
                <SelectItem value="all" style={{ fontSize: "0.8125rem" }}>Toutes</SelectItem>
                {wilayas.map((w) => (
                  <SelectItem key={w} value={w} style={{ fontSize: "0.8125rem" }}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Statut */}
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger
                className="select-trigger-premium"
                style={{ height: 38, fontSize: "0.8125rem", borderRadius: 8, width: "100%" }}
              >
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent
                style={{
                  background: "var(--bgElevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              >
                <SelectItem value="all" style={{ fontSize: "0.8125rem" }}>Tous</SelectItem>
                {STATUTS.map((s) => (
                  <SelectItem key={s} value={s} style={{ fontSize: "0.8125rem" }}>
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Produit */}
            <Select value={filterProduit} onValueChange={setFilterProduit}>
              <SelectTrigger
                className="select-trigger-premium"
                style={{ height: 38, fontSize: "0.8125rem", borderRadius: 8, width: "100%" }}
              >
                <SelectValue placeholder="Produit" />
              </SelectTrigger>
              <SelectContent
                style={{
                  background: "var(--bgElevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              >
                <SelectItem value="all" style={{ fontSize: "0.8125rem" }}>Tous</SelectItem>
                {produits.map((p) => (
                  <SelectItem key={p} value={p} style={{ fontSize: "0.8125rem" }}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date début */}
            <div style={{ position: "relative" }}>
              <Input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                style={{
                  height: 38,
                  fontSize: "0.8125rem",
                  background: "var(--bgCard)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--textPrimary)",
                  width: "100%",
                  colorScheme: "dark",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)"
                  e.currentTarget.style.boxShadow = "0 0 0 2px var(--primaryDim)"
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)"
                  e.currentTarget.style.boxShadow = "none"
                }}
              />
            </div>

            {/* Date fin */}
            <div style={{ position: "relative" }}>
              <Input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                style={{
                  height: 38,
                  fontSize: "0.8125rem",
                  background: "var(--bgCard)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--textPrimary)",
                  width: "100%",
                  colorScheme: "dark",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)"
                  e.currentTarget.style.boxShadow = "0 0 0 2px var(--primaryDim)"
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)"
                  e.currentTarget.style.boxShadow = "none"
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Orders Table ── */}
      {filteredOrders.length === 0 ? (
        <div className="card-premium" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "2.5rem 1.5rem" }}>
            <EmptyState
              icon={ShoppingBag}
              title="Aucune commande"
              description={
                hasActiveFilters
                  ? "Aucune commande ne correspond à vos filtres. Essayez de modifier vos critères de recherche."
                  : "Vous n'avez pas encore de commandes."
              }
              action={hasActiveFilters ? { label: "Réinitialiser les filtres", onClick: resetFilters } : undefined}
            />
          </div>
        </div>
      ) : (
        <div className="card-premium" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="table-premium">
              <thead>
                <tr>
                  <th style={{ padding: "0.875rem 1rem", fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--textMuted)", textAlign: "left", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                    <div className="flex items-center gap-1.5">
                      Client
                    </div>
                  </th>
                  <th style={{ padding: "0.875rem 1rem", fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--textMuted)", textAlign: "left", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                    Téléphone
                  </th>
                  <th style={{ padding: "0.875rem 1rem", fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--textMuted)", textAlign: "left", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                    Wilaya
                  </th>
                  <th style={{ padding: "0.875rem 1rem", fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--textMuted)", textAlign: "left", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                    Produits
                  </th>
                  <th style={{ padding: "0.875rem 1rem", fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--textMuted)", textAlign: "left", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                    Couleur
                  </th>
                  <th style={{ padding: "0.875rem 1rem", fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--textMuted)", textAlign: "left", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                    Taille
                  </th>
                  <th style={{ padding: "0.875rem 1rem", fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--textMuted)", textAlign: "right", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                    Total
                  </th>
                  <th style={{ padding: "0.875rem 1rem", fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--textMuted)", textAlign: "left", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                    Statut
                  </th>
                  <th style={{ padding: "0.875rem 1rem", fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--textMuted)", textAlign: "left", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                    Date
                  </th>
                  <th style={{ padding: "0.875rem 1rem", fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--textMuted)", textAlign: "center", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    style={{
                      transition: "all 200ms cubic-bezier(0.23,1,0.32,1)",
                      borderBottom: "1px solid var(--borderSubtle)",
                      opacity: 0,
                      animation: `fade-up 400ms cubic-bezier(0.23,1,0.32,1) ${Math.min(index * 40, 400)}ms forwards`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,107,53,0.04)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent"
                    }}
                  >
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "var(--textPrimary)", fontWeight: 500, whiteSpace: "nowrap" }}>
                      {order.nom_client}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "var(--textSecondary)", whiteSpace: "nowrap" }}>
                      {order.telephone}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "var(--textSecondary)", whiteSpace: "nowrap" }}>
                      {order.wilaya}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "var(--textSecondary)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={order.produits}>
                      {order.produits}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "var(--textSecondary)", whiteSpace: "nowrap" }}>
                      {order.couleur && (
                        <div className="flex items-center gap-2">
                          {order.couleur}
                        </div>
                      )}
                      {!order.couleur && (
                        <span style={{ color: "var(--textMuted)", fontStyle: "italic", fontSize: "0.75rem" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "var(--textSecondary)", whiteSpace: "nowrap" }}>
                      {order.taille || <span style={{ color: "var(--textMuted)", fontStyle: "italic", fontSize: "0.75rem" }}>—</span>}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "var(--primary)", fontWeight: 600, textAlign: "right", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                      {order.total.toLocaleString()} DA
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", whiteSpace: "nowrap" }}>
                      {statutBadge(order.statut)}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.8125rem", color: "var(--textMuted)", whiteSpace: "nowrap" }}>
                      {format(parseISO(order.created_at), "dd/MM/yyyy HH:mm")}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", textAlign: "center", whiteSpace: "nowrap" }}>
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "0.375rem 0.75rem",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              color: "var(--primary)",
                              background: "var(--primaryDim)",
                              border: "1px solid var(--border)",
                              borderRadius: 8,
                              cursor: "pointer",
                              transition: "all 200ms cubic-bezier(0.23,1,0.32,1)",
                              whiteSpace: "nowrap",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(255,107,53,0.2)"
                              e.currentTarget.style.borderColor = "var(--borderHover)"
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "var(--primaryDim)"
                              e.currentTarget.style.borderColor = "var(--border)"
                            }}
                          >
                            Changer
                          </button>
                        </DialogTrigger>
                        <DialogContent
                          className="dialog-content-premium"
                          style={{
                            maxWidth: 420,
                            borderRadius: 16,
                            padding: "1.75rem",
                            background: "linear-gradient(135deg, var(--bgCard) 0%, var(--bgSecondary) 100%)",
                            border: "1px solid var(--borderElevated)",
                            boxShadow: "var(--shadowXl), var(--shadowGlow)",
                          }}
                        >
                          <DialogHeader style={{ marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 10,
                                  background: "var(--primaryDim)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  border: "1px solid var(--border)",
                                }}
                              >
                                <ShoppingBag style={{ width: 15, height: 15, color: "var(--primary)" }} />
                              </div>
                              <div>
                                <DialogTitle
                                  style={{
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    color: "var(--textPrimary)",
                                    fontFamily: "'Instrument Serif', Georgia, serif",
                                    letterSpacing: "-0.01em",
                                  }}
                                >
                                  Changer le statut
                                </DialogTitle>
                                <p style={{ fontSize: "0.75rem", color: "var(--textMuted)", marginTop: 2 }}>
                                  Commande de <span style={{ color: "var(--textPrimary)", fontWeight: 500 }}>{order.nom_client}</span>
                                </p>
                              </div>
                            </div>
                          </DialogHeader>

                          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                            {STATUTS.map((s) => {
                              const cfg = STATUT_CONFIG[s] || { bg: "rgba(100,100,122,0.12)", color: "#64647a", border: "rgba(100,100,122,0.2)", label: s }
                              const isActive = order.statut === s
                              return (
                                <button
                                  key={s}
                                  onClick={() => updateStatut(order.id, s)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "0.625rem 1rem",
                                    fontSize: "0.8125rem",
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive ? cfg.color : "var(--textSecondary)",
                                    background: isActive ? cfg.bg : "transparent",
                                    border: isActive ? `1px solid ${cfg.border}` : "1px solid transparent",
                                    borderRadius: 10,
                                    cursor: "pointer",
                                    transition: "all 200ms cubic-bezier(0.23,1,0.32,1)",
                                    textAlign: "left",
                                    width: "100%",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isActive) {
                                      e.currentTarget.style.background = "rgba(255,255,255,0.03)"
                                      e.currentTarget.style.borderColor = "var(--borderSubtle)"
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isActive) {
                                      e.currentTarget.style.background = "transparent"
                                      e.currentTarget.style.borderColor = "transparent"
                                    }
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "inline-block",
                                      width: 8,
                                      height: 8,
                                      borderRadius: "50%",
                                      background: cfg.color,
                                      flexShrink: 0,
                                      boxShadow: isActive ? `0 0 8px ${cfg.color}40` : "none",
                                    }}
                                  />
                                  <span style={{ flex: 1 }}>{cfg.label}</span>
                                  {isActive && (
                                    <span
                                      style={{
                                        fontSize: "0.625rem",
                                        fontWeight: 500,
                                        color: cfg.color,
                                        background: cfg.bg,
                                        padding: "0.125rem 0.5rem",
                                        borderRadius: 999,
                                        border: `1px solid ${cfg.border}`,
                                      }}
                                    >
                                      Actuel
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table footer summary */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              borderTop: "1px solid var(--borderSubtle)",
              background: "rgba(255,107,53,0.02)",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "var(--textMuted)" }}>
              {filteredOrders.length} commande{filteredOrders.length > 1 ? "s" : ""} affichée{filteredOrders.length > 1 ? "s" : ""}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--textMuted)" }}>
              Total:{" "}
              <span style={{ color: "var(--primary)", fontWeight: 600 }}>
                {filteredOrders.reduce((sum, o) => sum + o.total, 0).toLocaleString()} DA
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
