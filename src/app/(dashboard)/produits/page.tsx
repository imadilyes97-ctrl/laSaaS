"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2, ImageUp, Package, AlertTriangle } from "lucide-react"
import type { Product } from "@/lib/types"

export default function ProduitsPage() {
  const [produits, setProduits] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const defaultForm = {
    nom: "",
    description: "",
    prix: 0,
    stock: 0,
    tailles: "",
    couleurs: "",
    photo_url: "",
  }
  const [form, setForm] = useState(defaultForm)

  const fetchProduits = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("produits")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (data) setProduits(data)
    setLoading(false)
  }

  useEffect(() => { fetchProduits() }, [])

  const uploadImage = async (file: File) => {
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ""

    const ext = file.name.split(".").pop()
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`

    const { error } = await supabase.storage
      .from("produits")
      .upload(path, file)

    if (error) {
      console.error("Upload error:", error)
      setUploading(false)
      return ""
    }

    const { data: urlData } = supabase.storage
      .from("produits")
      .getPublicUrl(path)

    setUploading(false)
    return urlData?.publicUrl || ""
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadImage(file)
    if (url) setForm((f) => ({ ...f, photo_url: url }))
  }

  const handleSave = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !form.nom) return

    const taillesArr = form.tailles
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    const couleursArr = form.couleurs
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)

    const payload = {
      user_id: user.id,
      nom: form.nom,
      description: form.description,
      photo_url: form.photo_url,
      prix: form.prix,
      stock: form.stock,
      tailles: taillesArr,
      couleurs: couleursArr,
    }

    if (editProduct) {
      await supabase.from("produits").update(payload).eq("id", editProduct.id)
    } else {
      await supabase.from("produits").insert(payload)
    }

    setForm(defaultForm)
    setEditProduct(null)
    setOpen(false)
    fetchProduits()
  }

  const handleEdit = (p: Product) => {
    setEditProduct(p)
    setForm({
      nom: p.nom,
      description: p.description,
      prix: p.prix,
      stock: p.stock,
      tailles: (p.tailles || []).join(", "),
      couleurs: (p.couleurs || []).join(", "),
      photo_url: p.photo_url,
    })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from("produits").delete().eq("id", id)
    fetchProduits()
  }

  const toggleActif = async (p: Product) => {
    const supabase = createClient()
    await supabase
      .from("produits")
      .update({ actif: !p.actif })
      .eq("id", p.id)
    fetchProduits()
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
          <h1 className="text-3xl font-bold">Produits</h1>
          <p className="text-muted-foreground">{produits.length} produit(s)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditProduct(null); setForm(defaultForm) }}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un produit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editProduct ? "Modifier le produit" : "Nouveau produit"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Photo du produit</Label>
                <div className="flex items-center gap-4">
                  {form.photo_url ? (
                    <img
                      src={form.photo_url}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                      <ImageUp className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Upload..." : "Choisir une image"}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom du produit</Label>
                <Input
                  id="nom"
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex: Robe d'été"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Description du produit"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prix">Prix (DA)</Label>
                  <Input
                    id="prix"
                    type="number"
                    value={form.prix || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, prix: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={form.stock}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, stock: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tailles">Tailles (séparées par des virgules)</Label>
                <Input
                  id="tailles"
                  value={form.tailles}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tailles: e.target.value }))
                  }
                  placeholder="S, M, L, XL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="couleurs">Couleurs (séparées par des virgules)</Label>
                <Input
                  id="couleurs"
                  value={form.couleurs}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, couleurs: e.target.value }))
                  }
                  placeholder="Rouge, Bleu, Noir"
                />
              </div>
              <Button onClick={handleSave} className="w-full" disabled={!form.nom}>
                {editProduct ? "Enregistrer" : "Ajouter"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {produits.map((p) => (
          <Card key={p.id} className={!p.actif ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                {p.photo_url ? (
                  <img
                    src={p.photo_url}
                    alt={p.nom}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold truncate">{p.nom}</h3>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEdit(p)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {p.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold">
                    {p.prix.toLocaleString()} DA
                  </span>
                  <div className="flex gap-1">
                    {p.stock === 0 ? (
                      <Badge variant="destructive">Épuisé</Badge>
                    ) : p.stock < 5 ? (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Stock: {p.stock}
                      </Badge>
                    ) : (
                      <Badge variant="success">Stock: {p.stock}</Badge>
                    )}
                  </div>
                </div>
                {(p.tailles?.length > 0 || p.couleurs?.length > 0) && (
                  <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                    {p.tailles?.length > 0 && (
                      <span>Tailles: {p.tailles.join(", ")}</span>
                    )}
                    {p.couleurs?.length > 0 && (
                      <span>Couleurs: {p.couleurs.join(", ")}</span>
                    )}
                  </div>
                )}
                <Button
                  variant={p.actif ? "outline" : "default"}
                  size="sm"
                  className="w-full"
                  onClick={() => toggleActif(p)}
                >
                  {p.actif ? "Désactiver" : "Activer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {produits.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Aucun produit pour le moment. Cliquez sur "Ajouter un produit" pour commencer.
          </div>
        )}
      </div>
    </div>
  )
}
