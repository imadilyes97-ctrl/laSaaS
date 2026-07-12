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
import { Plus, Pencil, Trash2, ImageUp, Package, AlertTriangle, AlertCircle, Search, X, Loader2, Box, ShoppingBag, Truck, Palette, Ruler, Camera, Sparkles } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import type { Product } from "@/lib/types"
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload"
import { LoadingSkeleton, EmptyState } from "@/components/PageStates"

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
  const cloudinaryUpload = useCloudinaryUpload()

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
    livraison_domicile: 0,
    livraison_bureau: 0,
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
    setUploadError("")

    const url = await cloudinaryUpload.upload(file)
    if (!url) {
      setUploadError(cloudinaryUpload.state.error || "Erreur lors de l'upload")
      return ""
    }

    return url
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
      livraison_domicile: form.livraison_domicile,
      livraison_bureau: form.livraison_bureau,
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
      livraison_domicile: p.livraison_domicile ?? 0,
      livraison_bureau: p.livraison_bureau ?? 0,
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
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ═══ HEADER ═══ */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1>Produits</h1>
            <p>{produits.length} produit{produits.length > 1 ? "s" : ""} dans votre catalogue</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Premium Search Bar */}
            <div className="relative flex-1 sm:w-72">
              <div className="glass-light rounded-xl transition-all duration-200 ease-out focus-within:border-[#ff6b35]/40 focus-within:shadow-[0_0_20px_rgba(255,107,53,0.06)]">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--textMuted)" }} />
                  <Input
                    placeholder="Rechercher par nom, taille, couleur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      background: "transparent",
                      border: "none",
                      boxShadow: "none",
                      paddingLeft: "2.25rem",
                      paddingRight: searchQuery ? "2rem" : "0.75rem",
                      color: "var(--textPrimary)",
                    }}
                    className="h-10 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-all duration-200 ease-out"
                      style={{ color: "var(--textMuted)" }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Premium Add Button */}
            <Dialog open={open} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => { setEditProduct(null); setForm(defaultForm); setDescriptionVisuelle(null); setPhotoItemsProduit([]); setPhotoItemsReelles([]) }}
                  className="btn-gradient gap-2"
                  style={{ borderRadius: "var(--radius-md)" }}
                >
                  <Plus className="h-4 w-4" />
                  <span>Nouveau produit</span>
                </Button>
              </DialogTrigger>

              {/* ═══ DIALOG — Premium Modal ═══ */}
              <DialogContent className="dialog-content-premium max-w-2xl overflow-y-auto max-h-[90vh]">
                <DialogHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--primaryDim)", border: "1px solid var(--border)" }}>
                      {editProduct ? (
                        <Pencil className="h-5 w-5" style={{ color: "var(--primary)" }} />
                      ) : (
                        <Sparkles className="h-5 w-5" style={{ color: "var(--primary)" }} />
                      )}
                    </div>
                    <div>
                      <DialogTitle style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.35rem", letterSpacing: "-0.01em", color: "var(--textPrimary)" }}>
                        {editProduct ? "Modifier le produit" : "Nouveau produit"}
                      </DialogTitle>
                      <p style={{ fontSize: "0.8rem", color: "var(--textMuted)", marginTop: "0.125rem" }}>
                        {editProduct ? "Modifiez les details de votre produit" : "Ajoutez un nouveau produit a votre catalogue"}
                      </p>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-6 pt-2">
                  {/* ════════════════════════════════════ */}
                  {/* SECTION 1 — Photos du produit        */}
                  {/* ════════════════════════════════════ */}
                  <div className="stat-card">
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="h-4 w-4" style={{ color: "var(--primary)" }} />
                      <span className="text-sm font-semibold" style={{ color: "var(--textPrimary)" }}>Photos officielles</span>
                      <span className="tag text-[10px]" style={{ marginLeft: "auto" }}>Studio</span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: "var(--textMuted)" }}>Photos sur fond blanc ou studio — Max 5 photos</p>

                    {photoItemsProduit.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {photoItemsProduit.map((item, index) => (
                          <div key={item.id} className="product-card rounded-lg" style={{ aspectRatio: "1" }}>
                            <div className="product-image rounded-lg" style={{ aspectRatio: "1" }}>
                              <img src={item.uploadedUrl || item.previewUrl} alt={`Officielle ${index + 1}`} className="w-full h-full object-cover" />
                              <div className="product-overlay rounded-lg" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-200 ease-out z-10">
                                <button
                                  type="button"
                                  onClick={() => removePhoto(item.id, setPhotoItemsProduit)}
                                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ease-out hover:scale-110"
                                  style={{ background: "rgba(239, 68, 68, 0.8)", color: "white" }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                              {item.uploading && (
                                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(6, 3, 11, 0.7)" }}>
                                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--primary)" }} />
                                </div>
                              )}
                              <div className="absolute top-1.5 left-1.5 tag text-[10px] px-1.5 py-0.5" style={{ zIndex: 5 }}>
                                {index + 1}
                              </div>
                            </div>
                          </div>
                        ))}
                        {photoItemsProduit.length < 5 && (
                          <button
                            type="button"
                            onClick={() => fileRefProduit.current?.click()}
                            className="aspect-square rounded-lg transition-all duration-200 ease-out flex flex-col items-center justify-center gap-1.5"
                            style={{
                              border: "2px dashed var(--border)",
                              background: "rgba(255, 107, 53, 0.02)",
                              color: "var(--textMuted)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "var(--borderHover)"
                              e.currentTarget.style.color = "var(--primary)"
                              e.currentTarget.style.background = "var(--primaryDim)"
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "var(--border)"
                              e.currentTarget.style.color = "var(--textMuted)"
                              e.currentTarget.style.background = "rgba(255, 107, 53, 0.02)"
                            }}
                          >
                            <ImageUp className="h-5 w-5" />
                            <span className="text-xs font-medium">Ajouter</span>
                          </button>
                        )}
                      </div>
                    )}

                    {photoItemsProduit.length === 0 && (
                      <div
                        onClick={() => fileRefProduit.current?.click()}
                        className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 ease-out group"
                        style={{
                          border: "2px dashed var(--border)",
                          background: "rgba(255, 107, 53, 0.02)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--borderHover)"
                          e.currentTarget.style.background = "var(--primaryDim)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--border)"
                          e.currentTarget.style.background = "rgba(255, 107, 53, 0.02)"
                        }}
                      >
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ease-out" style={{ background: "var(--primaryDim)", border: "1px solid var(--border)" }}>
                          <ImageUp className="h-5 w-5" style={{ color: "var(--primary)" }} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium transition-all duration-200 ease-out" style={{ color: "var(--textPrimary)" }}>Ajouter des photos officielles</span>
                          <span className="text-xs" style={{ color: "var(--textMuted)" }}>JPG, PNG, WEBP — max 5MB par photo</span>
                        </div>
                      </div>
                    )}

                    <input ref={fileRefProduit} type="file" multiple accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleProduitSelect} />
                  </div>

                  {/* ════════════════════════════════════ */}
                  {/* SECTION 2 — Photos réelles           */}
                  {/* ════════════════════════════════════ */}
                  <div className="stat-card">
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="h-4 w-4" style={{ color: "var(--accent)" }} />
                      <span className="text-sm font-semibold" style={{ color: "var(--textPrimary)" }}>Photos réelles</span>
                      <span className="tag tag-accent text-[10px]" style={{ marginLeft: "auto" }}>Optionnel</span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: "var(--textMuted)" }}>Photos portees par des modeles ou en situation reelle — Max 5 photos</p>

                    {photoItemsReelles.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {photoItemsReelles.map((item, index) => (
                          <div key={item.id} className="product-card rounded-lg" style={{ aspectRatio: "1" }}>
                            <div className="product-image rounded-lg" style={{ aspectRatio: "1" }}>
                              <img src={item.uploadedUrl || item.previewUrl} alt={`Reelle ${index + 1}`} className="w-full h-full object-cover" />
                              <div className="product-overlay rounded-lg" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-200 ease-out z-10">
                                <button
                                  type="button"
                                  onClick={() => removePhoto(item.id, setPhotoItemsReelles)}
                                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ease-out hover:scale-110"
                                  style={{ background: "rgba(239, 68, 68, 0.8)", color: "white" }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                              {item.uploading && (
                                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(6, 3, 11, 0.7)" }}>
                                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--accent)" }} />
                                </div>
                              )}
                              <div className="absolute top-1.5 left-1.5 tag tag-accent text-[10px] px-1.5 py-0.5" style={{ zIndex: 5 }}>
                                {index + 1}
                              </div>
                            </div>
                          </div>
                        ))}
                        {photoItemsReelles.length < 5 && (
                          <button
                            type="button"
                            onClick={() => fileRefReelles.current?.click()}
                            className="aspect-square rounded-lg transition-all duration-200 ease-out flex flex-col items-center justify-center gap-1.5"
                            style={{
                              border: "2px dashed var(--border)",
                              background: "rgba(124, 58, 237, 0.02)",
                              color: "var(--textMuted)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "rgba(124, 58, 237, 0.3)"
                              e.currentTarget.style.color = "var(--accent)"
                              e.currentTarget.style.background = "var(--accentDim)"
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "var(--border)"
                              e.currentTarget.style.color = "var(--textMuted)"
                              e.currentTarget.style.background = "rgba(124, 58, 237, 0.02)"
                            }}
                          >
                            <ImageUp className="h-5 w-5" />
                            <span className="text-xs font-medium">Ajouter</span>
                          </button>
                        )}
                      </div>
                    )}

                    {photoItemsReelles.length === 0 && (
                      <div
                        onClick={() => fileRefReelles.current?.click()}
                        className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 ease-out group"
                        style={{
                          border: "2px dashed var(--border)",
                          background: "rgba(124, 58, 237, 0.02)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "rgba(124, 58, 237, 0.3)"
                          e.currentTarget.style.background = "var(--accentDim)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--border)"
                          e.currentTarget.style.background = "rgba(124, 58, 237, 0.02)"
                        }}
                      >
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ease-out" style={{ background: "var(--accentDim)", border: "1px solid rgba(124, 58, 237, 0.15)" }}>
                          <ImageUp className="h-5 w-5" style={{ color: "var(--accent)" }} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium transition-all duration-200 ease-out" style={{ color: "var(--textPrimary)" }}>Ajouter des photos reelles (modeles)</span>
                          <span className="text-xs" style={{ color: "var(--textMuted)" }}>JPG, PNG, WEBP — max 5MB par photo</span>
                        </div>
                      </div>
                    )}

                    <input ref={fileRefReelles} type="file" multiple accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleReellesSelect} />
                  </div>

                  {/* Upload errors */}
                  {uploadError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "var(--errorDim)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                      <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "var(--error)" }} />
                      <p className="text-sm" style={{ color: "var(--error)" }}>{uploadError}</p>
                    </div>
                  )}

                  {/* Upload progress */}
                  {cloudinaryUpload.state.uploading && (
                    <div className="space-y-2 p-4 rounded-xl" style={{ background: "var(--bgCard)", border: "1px solid var(--border)" }}>
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: "var(--textSecondary)" }}>Upload en cours...</span>
                        <span className="font-medium" style={{ color: "var(--primary)" }}>{cloudinaryUpload.state.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bgSecondary)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${cloudinaryUpload.state.progress}%`, background: "var(--gradientPrimary)" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ════════════════════════════════════ */}
                  {/* SECTION 3 — Informations de base     */}
                  {/* ════════════════════════════════════ */}
                  <div className="stat-card">
                    <div className="flex items-center gap-2 mb-4">
                      <ShoppingBag className="h-4 w-4" style={{ color: "var(--primary)" }} />
                      <span className="text-sm font-semibold" style={{ color: "var(--textPrimary)" }}>Informations</span>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="nom" style={{ fontSize: "0.8rem", color: "var(--textSecondary)", fontWeight: 600, letterSpacing: "0.02em" }}>Nom du produit</Label>
                        <Input
                          id="nom"
                          value={form.nom}
                          onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                          placeholder="Ex: Robe d'ete"
                          className="select-trigger-premium h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="description" style={{ fontSize: "0.8rem", color: "var(--textSecondary)", fontWeight: 600, letterSpacing: "0.02em" }}>Description</Label>
                        <Input
                          id="description"
                          value={form.description}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, description: e.target.value }))
                          }
                          placeholder="Description du produit"
                          className="select-trigger-premium h-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ════════════════════════════════════ */}
                  {/* SECTION 4 — Prix et Stock            */}
                  {/* ════════════════════════════════════ */}
                  <div className="stat-card">
                    <div className="flex items-center gap-2 mb-4">
                      <Box className="h-4 w-4" style={{ color: "var(--primary)" }} />
                      <span className="text-sm font-semibold" style={{ color: "var(--textPrimary)" }}>Prix & Stock</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="prix" style={{ fontSize: "0.8rem", color: "var(--textSecondary)", fontWeight: 600, letterSpacing: "0.02em" }}>Prix (DA)</Label>
                        <Input
                          id="prix"
                          type="number"
                          value={form.prix || ""}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, prix: Number(e.target.value) }))
                          }
                          placeholder="0"
                          className="select-trigger-premium h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="stock" style={{ fontSize: "0.8rem", color: "var(--textSecondary)", fontWeight: 600, letterSpacing: "0.02em" }}>Stock</Label>
                        <Input
                          id="stock"
                          type="number"
                          value={form.stock}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, stock: Number(e.target.value) }))
                          }
                          placeholder="0"
                          className="select-trigger-premium h-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ════════════════════════════════════ */}
                  {/* SECTION 5 — Livraison                */}
                  {/* ════════════════════════════════════ */}
                  <div className="stat-card">
                    <div className="flex items-center gap-2 mb-4">
                      <Truck className="h-4 w-4" style={{ color: "var(--primary)" }} />
                      <span className="text-sm font-semibold" style={{ color: "var(--textPrimary)" }}>Livraison</span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: "var(--textMuted)" }}>Laissez 0 si livraison gratuite ou non disponible</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="livraison_domicile" style={{ fontSize: "0.8rem", color: "var(--textSecondary)", fontWeight: 600, letterSpacing: "0.02em" }}>A domicile (DA)</Label>
                        <Input
                          id="livraison_domicile"
                          type="number"
                          min={0}
                          value={form.livraison_domicile}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, livraison_domicile: Number(e.target.value) }))
                          }
                          placeholder="0"
                          className="select-trigger-premium h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="livraison_bureau" style={{ fontSize: "0.8rem", color: "var(--textSecondary)", fontWeight: 600, letterSpacing: "0.02em" }}>Au bureau (DA)</Label>
                        <Input
                          id="livraison_bureau"
                          type="number"
                          min={0}
                          value={form.livraison_bureau}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, livraison_bureau: Number(e.target.value) }))
                          }
                          placeholder="0"
                          className="select-trigger-premium h-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ════════════════════════════════════ */}
                  {/* SECTION 6 — Variantes                */}
                  {/* ════════════════════════════════════ */}
                  <div className="stat-card">
                    <div className="flex items-center gap-2 mb-4">
                      <Palette className="h-4 w-4" style={{ color: "var(--primary)" }} />
                      <Ruler className="h-4 w-4" style={{ color: "var(--accent)" }} />
                      <span className="text-sm font-semibold" style={{ color: "var(--textPrimary)" }}>Variantes</span>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="tailles" style={{ fontSize: "0.8rem", color: "var(--textSecondary)", fontWeight: 600, letterSpacing: "0.02em" }}>Tailles (separees par des virgules)</Label>
                        <Input
                          id="tailles"
                          value={form.tailles}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, tailles: e.target.value }))
                          }
                          placeholder="S, M, L, XL"
                          className="select-trigger-premium h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="couleurs" style={{ fontSize: "0.8rem", color: "var(--textSecondary)", fontWeight: 600, letterSpacing: "0.02em" }}>Couleurs (separees par des virgules)</Label>
                        <Input
                          id="couleurs"
                          value={form.couleurs}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, couleurs: e.target.value }))
                          }
                          placeholder="Rouge, Bleu, Noir"
                          className="select-trigger-premium h-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save error */}
                  {saveError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "var(--errorDim)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                      <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "var(--error)" }} />
                      <p className="text-sm" style={{ color: "var(--error)" }}>{saveError}</p>
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    onClick={handleSave}
                    disabled={!form.nom || saving}
                    className="btn-gradient w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-out"
                    style={{ color: "var(--textInverse)" }}
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {editProduct ? "Enregistrement..." : "Ajout..."}
                      </span>
                    ) : (
                      editProduct ? "Enregistrer les modifications" : "Ajouter le produit"
                    )}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Search results info */}
      {searchQuery && (
        <div className="flex items-center gap-2 px-1 animate-fade-down">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--primary)" }} />
          <p className="text-sm" style={{ color: "var(--textMuted)" }}>
            {filteredProduits.length} resultat{filteredProduits.length > 1 ? "s" : ""} pour &quot;{searchQuery}&quot;
          </p>
        </div>
      )}

      {/* ═══ PRODUCT GRID ═══ */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProduits.map((p, idx) => (
          <div
            key={p.id}
            className={`product-card ${!p.actif ? "opacity-50" : ""}`}
            style={{ animation: `fade-up 500ms var(--ease-out) ${idx * 60}ms both` }}
          >
            {/* Product Image */}
            <div className="product-image" style={{ position: "relative", aspectRatio: "1", overflow: "hidden", background: "var(--bgSecondary)" }}>
              {(p.photos_produit?.length > 0 || p.photo_url) ? (
                <>
                  <img
                    src={p.photos_produit?.[0] || p.photo_url}
                    alt={p.nom}
                    className="w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                  />
                  <div className="product-overlay" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bgSecondary)" }}>
                  <Package className="h-14 w-14" style={{ color: "var(--textMuted)", opacity: 0.4 }} />
                </div>
              )}

              {/* Badges overlay */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                {p.stock === 0 ? (
                  <span className="tag" style={{ background: "var(--errorDim)", color: "var(--error)", borderColor: "rgba(239,68,68,0.2)" }}>
                    <AlertTriangle className="h-3 w-3" /> Epuise
                  </span>
                ) : p.stock < 5 ? (
                  <span className="tag" style={{ background: "var(--warningDim)", color: "var(--warning)", borderColor: "rgba(245,158,11,0.2)" }}>
                    <AlertTriangle className="h-3 w-3" /> Stock: {p.stock}
                  </span>
                ) : (
                  <span className="tag">
                    En stock: {p.stock}
                  </span>
                )}
              </div>

              {/* Real photos count */}
              {(p.photos_reelles?.length > 0) && (
                <div className="absolute bottom-3 right-3 z-10">
                  <span className="tag tag-accent text-[10px] flex items-center gap-1">
                    <Camera className="h-2.5 w-2.5" />
                    {p.photos_reelles.length} reelle{p.photos_reelles.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}

            </div>

            {/* Product Info */}
            <div className="p-4 space-y-3">
              {/* Title + Actions */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm truncate" style={{ color: "var(--textPrimary)" }}>{p.nom}</h3>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => handleEdit(p)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ease-out hover:scale-105"
                    style={{ background: "var(--primaryDim)", color: "var(--primary)", border: "1px solid var(--border)" }}
                    title="Modifier"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(p)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ease-out hover:scale-105"
                    style={{ background: "var(--errorDim)", color: "var(--error)", border: "1px solid rgba(239,68,68,0.15)" }}
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Description */}
              {p.description && (
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--textMuted)" }}>
                  {p.description}
                </p>
              )}

              {/* Price + Tags */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold" style={{ color: "var(--primary)" }}>
                  {p.prix.toLocaleString()} <span className="text-xs font-medium" style={{ color: "var(--textMuted)" }}>DA</span>
                </span>
              </div>

              {/* Sizes & Colors chips */}
              {(p.tailles?.length > 0 || p.couleurs?.length > 0) && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {p.tailles?.length > 0 && p.tailles.map((t) => (
                    <span key={t} className="px-2 py-0.5 text-[10px] font-medium rounded-md" style={{ background: "var(--bgHover)", color: "var(--textSecondary)", border: "1px solid var(--borderSubtle)" }}>
                      {t}
                    </span>
                  ))}
                  {p.couleurs?.length > 0 && p.couleurs.map((c) => (
                    <span key={c} className="px-2 py-0.5 text-[10px] font-medium rounded-md" style={{ background: "var(--accentDim)", color: "var(--accent)", border: "1px solid rgba(124,58,237,0.15)" }}>
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {/* Toggle active button */}
              <button
                onClick={() => toggleActif(p)}
                className={`w-full py-2 rounded-lg text-xs font-medium transition-all duration-200 ease-out ${
                  p.actif
                    ? "hover:bg-red-500/10 hover:text-red-400"
                    : ""
                }`}
                style={{
                  background: p.actif ? "var(--primaryDim)" : "var(--gradientPrimary)",
                  color: p.actif ? "var(--primary)" : "var(--textInverse)",
                  border: p.actif ? "1px solid var(--border)" : "none",
                }}
              >
                {p.actif ? "Desactiver" : "Activer"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ EMPTY STATE ═══ */}
      {filteredProduits.length === 0 && !loading && (
        <EmptyState
          icon={Package}
          title={searchQuery ? "Aucun resultat" : "Catalogue vide"}
          description={searchQuery ? `Aucun produit trouve pour "${searchQuery}"` : "Vous n'avez pas encore de produits. Cliquez sur \"Nouveau produit\" pour commencer."}
          action={searchQuery ? undefined : { label: "Ajouter un produit", onClick: () => { setEditProduct(null); setForm(defaultForm); setDescriptionVisuelle(null); setPhotoItemsProduit([]); setPhotoItemsReelles([]); setOpen(true) } }}
        />
      )}

      {/* ═══ DELETE CONFIRMATION DIALOG ═══ */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="dialog-content-premium max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--errorDim)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <AlertTriangle className="h-5 w-5" style={{ color: "var(--error)" }} />
              </div>
              <DialogTitle style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.15rem", color: "var(--textPrimary)" }}>
                Confirmer la suppression
              </DialogTitle>
            </div>
            <DialogDescription style={{ color: "var(--textSecondary)", fontSize: "0.875rem", lineHeight: "1.5" }}>
              Etes-vous sur de vouloir supprimer <strong style={{ color: "var(--textPrimary)" }}>{deleteTarget?.nom}</strong> ? Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="flex-1"
              style={{ borderRadius: "var(--radius-md)", borderColor: "var(--border)", color: "var(--textSecondary)", background: "transparent" }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
              style={{ borderRadius: "var(--radius-md)" }}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
