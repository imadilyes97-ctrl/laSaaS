"use client"

import { useEffect, useState, useRef, useMemo } from "react"
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2, ImageUp, Package, AlertTriangle, AlertCircle, Search, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import type { Product } from "@/lib/types"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"]
const MAX_SIZE = 5 * 1024 * 1024

export default function ProduitsPage() {
  const [produits, setProduits] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")
  const [photoItemsProduit, setPhotoItemsProduit] = useState<{ id: string; previewUrl: string; uploadedUrl: string; uploading: boolean }[]>([])
  const [photoItemsReelles, setPhotoItemsReelles] = useState<{ id: string; previewUrl: string; uploadedUrl: string; uploading: boolean }[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [analysing, setAnalysing] = useState(false)
  const [descriptionVisuelle, setDescriptionVisuelle] = useState<Record<string, unknown> | null>(null)

  const fileRefProduit = useRef<HTMLInputElement>(null)
  const fileRefReelles = useRef<HTMLInputElement>(null)

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

  const filteredProduits = useMemo(() => {
    if (!searchQuery.trim()) return produits

    const q = searchQuery.toLowerCase()
    return produits.filter((p) => {
      const nameMatch = p.nom.toLowerCase().includes(q)
      const tailleMatch = (p.tailles || []).some((t) => t.toLowerCase().includes(q))
      const couleurMatch = (p.couleurs || []).some((c) => c.toLowerCase().includes(q))
      return nameMatch || tailleMatch || couleurMatch
    })
  }, [produits, searchQuery])

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      const ext = file.name.split(".").pop()?.toLowerCase()
      if (!ext || !ALLOWED_EXTENSIONS.includes(`.${ext}`)) {
        return "Format accepté : JPG, PNG, WEBP"
      }
    }
    if (file.size > MAX_SIZE) {
      return "Image trop grande, maximum 5MB"
    }
    return null
  }

  const uploadImage = async (file: File) => {
    setUploading(true)
    setUploadProgress(0)
    setUploadError("")

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setUploading(false)
      setUploadError("Utilisateur non connecté")
      return ""
    }

    const ext = file.name.split(".").pop()
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90))
    }, 200)

    const { error } = await supabase.storage
      .from("produits")
      .upload(path, file)

    clearInterval(progressInterval)

    if (error) {
      setUploading(false)
      setUploadProgress(0)
      if (error.message?.includes("bucket")) {
        setUploadError("Bucket 'produits' introuvable. Créez-le dans Supabase Storage.")
      } else if (error.message?.includes("policy")) {
        setUploadError("Permission refusée. Vérifiez les politiques RLS du bucket.")
      } else {
        setUploadError(`Erreur lors de l'upload : ${error.message}`)
      }
      return ""
    }

    setUploadProgress(100)

    const { data: urlData } = supabase.storage
      .from("produits")
      .getPublicUrl(path)

    setUploading(false)
    return urlData?.publicUrl || ""
  }

  const uploadFiles = async (files: File[], setItems: React.Dispatch<React.SetStateAction<typeof photoItemsProduit>>) => {
    setUploadError("")

    for (const file of files) {
      const validationError = validateFile(file)
      if (validationError) {
        setUploadError(validationError)
        return
      }
    }

    const newItems = files.map((file) => ({
      id: uuidv4(),
      file,
      previewUrl: URL.createObjectURL(file),
      uploadedUrl: "",
      uploading: true,
    }))

    setItems((prev) => [...prev, ...newItems.map((n) => ({ id: n.id, previewUrl: n.previewUrl, uploadedUrl: n.uploadedUrl, uploading: n.uploading }))])

    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i]
      const url = await uploadImage(item.file)
      setItems((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, uploadedUrl: url || p.previewUrl, uploading: false } : p
        )
      )
      URL.revokeObjectURL(item.previewUrl)
    }
  }

  const handleProduitSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    uploadFiles(files, setPhotoItemsProduit)
  }

  const handleReellesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    uploadFiles(files, setPhotoItemsReelles)
  }

  const removePhoto = (id: string, setItems: React.Dispatch<React.SetStateAction<typeof photoItemsProduit>>) => {
    setItems((prev) => {
      const item = prev.find((p) => p.id === id)
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((p) => p.id !== id)
    })
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl("")
      }
      photoItemsProduit.forEach((item) => { if (item.previewUrl) URL.revokeObjectURL(item.previewUrl) })
      photoItemsReelles.forEach((item) => { if (item.previewUrl) URL.revokeObjectURL(item.previewUrl) })
      setPhotoItemsProduit([])
      setPhotoItemsReelles([])
      setUploadError("")
      setUploadProgress(0)
      setSaveError("")
      setDescriptionVisuelle(null)
    }
    setOpen(open)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError("")
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !form.nom) {
      setSaving(false)
      return
    }

    const taillesArr = form.tailles
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    const couleursArr = form.couleurs
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)

    const descVisuelle = descriptionVisuelle || (editProduct?.description_visuelle) || {}

    // Collecter les URLs par catégorie
    const uploadedProduit = photoItemsProduit
      .map((item) => item.uploadedUrl)
      .filter((url) => url && url.startsWith("http"))
    const uploadedReelles = photoItemsReelles
      .map((item) => item.uploadedUrl)
      .filter((url) => url && url.startsWith("http"))

    const payload = {
      user_id: user.id,
      nom: form.nom,
      description: form.description,
      photo_url: uploadedProduit[0] || form.photo_url || "",
      photos: uploadedProduit.length > 0 ? uploadedProduit : [form.photo_url].filter(Boolean),
      photos_produit: uploadedProduit.length > 0 ? uploadedProduit : (editProduct?.photos_produit || []),
      photos_reelles: uploadedReelles.length > 0 ? uploadedReelles : (editProduct?.photos_reelles || []),
      prix: form.prix,
      stock: form.stock,
      tailles: taillesArr,
      couleurs: couleursArr,
      description_visuelle: descVisuelle,
    }

    let error: any = null

    if (editProduct) {
      const { error: e } = await supabase.from("produits").update(payload).eq("id", editProduct.id)
      error = e
    } else {
      const { error: e } = await supabase.from("produits").insert(payload)
      error = e
    }

    if (error) {
      setSaveError(error.message)
      setSaving(false)
      return
    }

    setForm(defaultForm)
    setEditProduct(null)
    setDescriptionVisuelle(null)
    setOpen(false)
    setSaving(false)
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
    // Charger les photos existantes par catégorie
    const mapPhotos = (urls: string[]) =>
      (urls || []).filter(Boolean).map((url: string) => ({
        id: uuidv4(),
        previewUrl: url,
        uploadedUrl: url,
        uploading: false,
      }))
    setPhotoItemsProduit(mapPhotos(p.photos_produit || p.photos || []))
    setPhotoItemsReelles(mapPhotos(p.photos_reelles || []))
    setDescriptionVisuelle(p.description_visuelle || null)
    setOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const supabase = createClient()
    await supabase.from("produits").delete().eq("id", deleteTarget.id)
    setDeleteTarget(null)
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
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Produits</h1>
          <p className="text-muted-foreground">{produits.length} produit(s)</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, taille, couleur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Dialog open={open} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditProduct(null); setForm(defaultForm); setDescriptionVisuelle(null); setPhotoItemsProduit([]); setPhotoItemsReelles([]) }}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editProduct ? "Modifier le produit" : "Nouveau produit"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* 📸 Section Photos officielles */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ImageUp className="h-4 w-4 text-[#ff6b35]" />
                    <Label className="font-semibold">Photos officielles du produit</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Photos sur fond blanc ou studio — Max 5 photos</p>

                  {photoItemsProduit.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {photoItemsProduit.map((item, index) => (
                        <div key={item.id} className="relative group aspect-square rounded-lg border bg-muted overflow-hidden">
                          <img src={item.uploadedUrl || item.previewUrl} alt={`Officielle ${index + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => removePhoto(item.id, setPhotoItemsProduit)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {item.uploading && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <Loader2 className="h-5 w-5 animate-spin text-white" />
                            </div>
                          )}
                          <div className="absolute top-1 left-1 bg-black/60 text-white text-xs rounded px-1.5 py-0.5">{index + 1}</div>
                        </div>
                      ))}
                      <button type="button" onClick={() => fileRefProduit.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-[#ff6b35]/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-[#ff6b35] transition-colors">
                        <ImageUp className="h-5 w-5" />
                        <span className="text-xs">Ajouter</span>
                      </button>
                    </div>
                  )}

                  {photoItemsProduit.length === 0 && (
                    <div onClick={() => fileRefProduit.current?.click()} className="flex items-center gap-4 p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-[#ff6b35]/50 transition-colors">
                      <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        <ImageUp className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Ajouter des photos officielles</span>
                        <span className="text-xs text-muted-foreground">JPG, PNG, WEBP — max 5MB par photo</span>
                      </div>
                    </div>
                  )}

                  <input ref={fileRefProduit} type="file" multiple accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleProduitSelect} />
                </div>

                {/* 🤳 Section Photos réelles */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ImageUp className="h-4 w-4 text-amber-400" />
                    <Label className="font-semibold">Photos réelles <span className="text-xs font-normal text-muted-foreground">(optionnel)</span></Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Photos portées par des modèles ou en situation réelle — Max 5 photos</p>

                  {photoItemsReelles.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {photoItemsReelles.map((item, index) => (
                        <div key={item.id} className="relative group aspect-square rounded-lg border bg-muted overflow-hidden">
                          <img src={item.uploadedUrl || item.previewUrl} alt={`Réelle ${index + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => removePhoto(item.id, setPhotoItemsReelles)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {item.uploading && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <Loader2 className="h-5 w-5 animate-spin text-white" />
                            </div>
                          )}
                          <div className="absolute top-1 left-1 bg-black/60 text-white text-xs rounded px-1.5 py-0.5">{index + 1}</div>
                        </div>
                      ))}
                      <button type="button" onClick={() => fileRefReelles.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-[#ff6b35]/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-[#ff6b35] transition-colors">
                        <ImageUp className="h-5 w-5" />
                        <span className="text-xs">Ajouter</span>
                      </button>
                    </div>
                  )}

                  {photoItemsReelles.length === 0 && (
                    <div onClick={() => fileRefReelles.current?.click()} className="flex items-center gap-4 p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-[#ff6b35]/50 transition-colors">
                      <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        <ImageUp className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Ajouter des photos réelles (modèles)</span>
                        <span className="text-xs text-muted-foreground">JPG, PNG, WEBP — max 5MB par photo</span>
                      </div>
                    </div>
                  )}

                  <input ref={fileRefReelles} type="file" multiple accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleReellesSelect} />
                </div>

                {uploadError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {uploadError}
                  </p>
                )}

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
                {saveError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {saveError}
                  </p>
                )}
                <Button onClick={handleSave} className="w-full" disabled={!form.nom || saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editProduct ? "Enregistrement..." : "Ajout..."}
                    </>
                  ) : (
                    editProduct ? "Enregistrer" : "Ajouter"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          {filteredProduits.length} résultat(s) pour &quot;{searchQuery}&quot;
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProduits.map((p) => (
          <Card key={p.id} className={!p.actif ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="relative aspect-square bg-muted rounded-lg mb-3 overflow-hidden group">
                {(p.photos_produit?.length > 0 || p.photo_url) ? (
                  <img
                    src={p.photos_produit?.[0] || p.photo_url}
                    alt={p.nom}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {(p.photos_reelles?.length > 0) && (
                  <div className="absolute bottom-2 right-2 bg-amber-500/80 text-white text-[10px] rounded-full px-2 py-0.5">
                    📸 {p.photos_reelles.length} réelle{p.photos_reelles.length > 1 ? 's' : ''}
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
                      onClick={() => setDeleteTarget(p)}
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
                      <Badge className="bg-[#ff6b35]/20 text-[#ff6b35] border-[rgba(255,107,53,0.3)]">En stock: {p.stock}</Badge>
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
        {filteredProduits.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {searchQuery
              ? `Aucun produit trouvé pour "${searchQuery}"`
              : 'Aucun produit pour le moment. Cliquez sur "Ajouter" pour commencer.'}
          </div>
        )}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{deleteTarget?.nom}</strong> ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
