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
import { Download, Search, Filter } from "lucide-react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"

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
    return <Badge variant={variants[statut] || "outline"}>{labels[statut] || statut}</Badge>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Commandes</h1>
          <p className="text-muted-foreground">
            {filteredOrders.length} commande(s)
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterWilaya} onValueChange={setFilterWilaya}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Wilaya" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {wilayas.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {STATUTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterProduit} onValueChange={setFilterProduit}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Produit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {produits.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-36"
            />
            <Input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-36"
            />
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("")
                setFilterWilaya("")
                setFilterStatut("")
                setFilterProduit("")
                setDateDebut("")
                setDateFin("")
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-3 font-medium">Client</th>
                  <th className="text-left py-3 px-3 font-medium">Téléphone</th>
                  <th className="text-left py-3 px-3 font-medium">Wilaya</th>
                  <th className="text-left py-3 px-3 font-medium">Produits</th>
                  <th className="text-left py-3 px-3 font-medium">Couleur</th>
                  <th className="text-left py-3 px-3 font-medium">Taille</th>
                  <th className="text-left py-3 px-3 font-medium">Total</th>
                  <th className="text-left py-3 px-3 font-medium">Statut</th>
                  <th className="text-left py-3 px-3 font-medium">Date</th>
                  <th className="text-left py-3 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-3">{order.nom_client}</td>
                    <td className="py-3 px-3">{order.telephone}</td>
                    <td className="py-3 px-3">{order.wilaya}</td>
                    <td className="py-3 px-3">{order.produits}</td>
                    <td className="py-3 px-3">{order.couleur}</td>
                    <td className="py-3 px-3">{order.taille}</td>
                    <td className="py-3 px-3">{order.total.toLocaleString()} DA</td>
                    <td className="py-3 px-3">{statutBadge(order.statut)}</td>
                    <td className="py-3 px-3">
                      {format(parseISO(order.created_at), "dd/MM/yyyy HH:mm")}
                    </td>
                    <td className="py-3 px-3">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            Changer statut
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Changer le statut - {order.nom_client}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-2">
                            {STATUTS.map((s) => (
                              <Button
                                key={s}
                                variant={
                                  order.statut === s ? "default" : "outline"
                                }
                                className="justify-start"
                                onClick={() => updateStatut(order.id, s)}
                              >
                                {s.replace("_", " ")}
                              </Button>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
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
