"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { createClient } from "@/lib/supabase"
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
import { Plus, Pencil, Trash2, ImageUp, Briefcase, AlertTriangle, AlertCircle, Search, X, Loader2, Clock, Tag, Sparkles, ArrowUpRight } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import type { Service } from "@/lib/types"
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload"
import { LoadingSkeleton, EmptyState } from "@/components/PageStates"
import { motion } from "framer-motion"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"]
const MAX_SIZE = 5 * 1024 * 1024

const TYPE_PRIX_LABELS: Record<string, string> = {
  fixe: "Prix fixe",
  heure: "Par heure",
  seance: "Par seance",
  devis: "Sur devis",
}

const CATEGORIES = [
  "Beauté & Bien-être",
  "Photographie",
  "Ménage & Nettoyage",
  "Coaching & Formation",
  "Consulting",
  "Informatique & Tech",
  "Santé & Fitness",
  "Événementiel",
  "Réparation & Maintenance",
  "Transport & Livraison",
  "Cours & Tutorat",
  "Design & Créatif",
  "Autre",
]

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editService, setEditService] = useState<Service | null>(null)
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [photoItems, setPhotoItems] = useState<{ id: string; previewUrl: string; uploadedUrl: string; uploading: boolean }[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  const fileRef = useRef<HTMLInputElement>(null)
  const cloudinaryUpload = useCloudinaryUpload()

  const defaultForm: {
    nom: string
    description: string
    prix: number
    devise: string
    type_prix: "fixe" | "heure" | "seance" | "devis"
    duree: number
    categorie: string
    photo_url: string
  } = {
    nom: "",
    description: "",
    prix: 0,
    devise: "DZD",
    type_prix: "fixe",
    duree: 60,
    categorie: "",
    photo_url: "",
  }
  const [form, setForm] = useState(defaultForm)

  const fetchServices = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (data) setServices(data)
    setLoading(false)
  }

  useEffect(() => { fetchServices() }, [])

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services

    const q = searchQuery.toLowerCase()
    return services.filter((s) => {
      const nameMatch = s.nom.toLowerCase().includes(q)
      const descMatch = s.description.toLowerCase().includes(q)
      const catMatch = s.categorie.toLowerCase().includes(q)
      return nameMatch || descMatch || catMatch
    })
  }, [services, searchQuery])

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      const ext = file.name.split(".").pop()?.toLowerCase()
      if (!ext || !ALLOWED_EXTENSIONS.includes(`.${ext}`)) {
        return "Format accepte : JPG, PNG, WEBP"
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

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

    setPhotoItems((prev) => [...prev, ...newItems.map((n) => ({ id: n.id, previewUrl: n.previewUrl, uploadedUrl: n.uploadedUrl, uploading: n.uploading }))])

    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i]
      const url = await uploadImage(item.file)
      setPhotoItems((prev) => {
        const updated = prev.map((p) =>
          p.id === item.id ? { ...p, uploadedUrl: url || p.previewUrl, uploading: false } : p
        )
        if (i === 0 && url) {
          setForm((f) => ({ ...f, photo_url: url }))
        }
        return updated
      })
      URL.revokeObjectURL(item.previewUrl)
    }
  }

  const removePhoto = (id: string) => {
    setPhotoItems((prev) => {
      const item = prev.find((p) => p.id === id)
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
      const remaining = prev.filter((p) => p.id !== id)
      if (item && prev.indexOf(item) === 0) {
        const firstRemaining = remaining.find((p) => p.uploadedUrl)
        setForm((f) => ({ ...f, photo_url: firstRemaining?.uploadedUrl || "" }))
      }
      return remaining
    })
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      photoItems.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      })
      setPhotoItems([])
      setUploadError("")
      setSaveError("")
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

    const uploadedUrls = photoItems
      .map((item) => item.uploadedUrl)
      .filter((url) => url && url.startsWith("http"))

    const payload = {
      user_id: user.id,
      nom: form.nom,
      description: form.description,
      prix: form.prix,
      devise: form.devise,
      type_prix: form.type_prix,
      duree: form.duree,
      categorie: form.categorie,
      photo_url: uploadedUrls[0] || form.photo_url || "",
      photos: uploadedUrls.length > 0 ? uploadedUrls : [form.photo_url].filter(Boolean),
    }

    let error: any = null

    if (editService) {
      const { error: e } = await supabase.from("services").update(payload).eq("id", editService.id)
      error = e
    } else {
      const { error: e } = await supabase.from("services").insert(payload)
      error = e
    }

    if (error) {
      setSaveError(error.message)
      setSaving(false)
      return
    }

    setForm(defaultForm)
    setEditService(null)
    setOpen(false)
    setSaving(false)
    fetchServices()
  }

  const handleEdit = (s: Service) => {
    setEditService(s)
    setForm({
      nom: s.nom,
      description: s.description,
      prix: s.prix,
      devise: s.devise,
      type_prix: s.type_prix as "fixe" | "heure" | "seance" | "devis",
      duree: s.duree,
      categorie: s.categorie,
      photo_url: s.photo_url,
    })
    const existingPhotos = (s.photos || [])
      .filter((url: string) => url)
      .map((url: string) => ({
        id: uuidv4(),
        previewUrl: url,
        uploadedUrl: url,
        uploading: false,
      }))
    setPhotoItems(existingPhotos)
    setOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const supabase = createClient()
    await supabase.from("services").delete().eq("id", deleteTarget.id)
    setDeleteTarget(null)
    fetchServices()
  }

  const toggleActif = async (s: Service) => {
    const supabase = createClient()
    await supabase
      .from("services")
      .update({ actif: !s.actif })
      .eq("id", s.id)
    fetchServices()
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">

      {/* ═══ PAGE HEADER ═══ */}
      <div className="page-header flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1>Services</h1>
            <Sparkles className="h-4 w-4" style={{ color: "var(--primary)" }} />
          </div>
          <p style={{ color: "var(--textMuted)" }}>
            {services.length} service{services.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Premium Search */}
          <div className="glass-light relative flex-1 sm:w-64" style={{ borderRadius: "var(--radius-md)", padding: "0" }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--textMuted)", zIndex: 1 }} />
            <Input
              placeholder="Rechercher par nom, description, categorie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: "2.25rem",
                paddingRight: searchQuery ? "2rem" : "0.75rem",
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--textPrimary)",
                fontSize: "0.875rem",
                height: "2.5rem",
                borderRadius: "var(--radius-md)",
              }}
              className="focus-visible:ring-1 focus-visible:ring-[#ff6b35]/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
                style={{ color: "var(--textMuted)" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--textPrimary)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--textMuted)"}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Add Service Button */}
          <Dialog open={open} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button
                onClick={() => { setEditService(null); setForm(defaultForm); setPhotoItems([]) }}
                className="btn-gradient"
                style={{ borderRadius: "var(--radius-md)", height: "2.5rem" }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>

            {/* ═══ FORM DIALOG ═══ */}
            <DialogContent className="dialog-content-premium max-w-lg !p-0" style={{ maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {/* Dialog Header */}
              <div style={{ padding: "1.5rem 1.5rem 0.75rem 1.5rem", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
                <DialogHeader>
                  <DialogTitle style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.25rem", color: "var(--textPrimary)" }}>
                    {editService ? "Modifier le service" : "Nouveau service"}
                  </DialogTitle>
                </DialogHeader>
              </div>

              {/* Scrollable form body */}
              <div style={{ padding: "1.25rem 1.5rem 1rem 1.5rem", overflow: "auto", flex: 1 }}>
                <div className="space-y-5">

                  {/* Section: Photos */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-4 rounded-full" style={{ background: "var(--gradientPrimary)" }} />
                      <h4 className="text-sm font-semibold" style={{ color: "var(--textPrimary)" }}>Photos du service</h4>
                    </div>

                    {photoItems.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {photoItems.map((item, index) => (
                          <div
                            key={item.id}
                            className="product-card rounded-lg"
                            style={{ aspectRatio: "1", border: "1px solid var(--border)" }}
                          >
                            <div className="product-image rounded-lg" style={{ aspectRatio: "1" }}>
                              <img
                                src={item.uploadedUrl || item.previewUrl}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="product-overlay rounded-lg" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-200 ease-out z-10">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444", backdropFilter: "blur(4px)" }}
                                  onClick={() => removePhoto(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {item.uploading && (
                              <div className="absolute inset-0 flex items-center justify-center z-20" style={{ background: "rgba(6,3,11,0.7)", backdropFilter: "blur(2px)" }}>
                                <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--primary)" }} />
                              </div>
                            )}
                            <div
                              className="absolute top-2 left-2 z-10 text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                              style={{ background: "rgba(6,3,11,0.7)", color: "var(--textSecondary)", backdropFilter: "blur(4px)", border: "1px solid var(--borderSubtle)" }}
                            >
                              #{index + 1}
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="aspect-square rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ease-out"
                          style={{
                            border: "2px dashed var(--border)",
                            background: "var(--bgSecondary)",
                            color: "var(--textMuted)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--primary)"
                            e.currentTarget.style.color = "var(--primary)"
                            e.currentTarget.style.background = "var(--primaryDim)"
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)"
                            e.currentTarget.style.color = "var(--textMuted)"
                            e.currentTarget.style.background = "var(--bgSecondary)"
                          }}
                        >
                          <ImageUp className="h-5 w-5" />
                          <span className="text-xs font-medium">Ajouter</span>
                        </button>
                      </div>
                    )}

                    {photoItems.length === 0 && (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ease-out group cursor-pointer"
                        style={{
                          border: "2px dashed var(--border)",
                          background: "var(--bgSecondary)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "rgba(255,107,53,0.4)"
                          e.currentTarget.style.background = "var(--primaryDim)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--border)"
                          e.currentTarget.style.background = "var(--bgSecondary)"
                        }}
                      >
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
                          style={{ background: "var(--bgHover)" }}
                        >
                          <ImageUp className="h-6 w-6" style={{ color: "var(--primary)" }} />
                        </div>
                        <div className="flex flex-col items-start text-left">
                          <span className="text-sm font-medium" style={{ color: "var(--textPrimary)" }}>Ajouter des photos</span>
                          <span className="text-xs mt-0.5" style={{ color: "var(--textMuted)" }}>JPG, PNG, WEBP — max 5MB par photo</span>
                        </div>
                        <div className="ml-auto">
                          <ArrowUpRight className="h-4 w-4 transition-all duration-200" style={{ color: "var(--textMuted)" }} />
                        </div>
                      </button>
                    )}

                    <input
                      ref={fileRef}
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={handleImageSelect}
                    />

                    {uploadError && (
                      <div className="mt-2 p-3 rounded-lg" style={{ background: "var(--errorDim)", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <p className="text-sm flex items-center gap-1.5" style={{ color: "var(--error)" }}>
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {uploadError}
                        </p>
                      </div>
                    )}

                    {cloudinaryUpload.state.uploading && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between text-xs" style={{ color: "var(--textMuted)" }}>
                          <span>Upload en cours...</span>
                          <span>{cloudinaryUpload.state.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bgHover)" }}>
                          <div
                            className="h-full rounded-full transition-all duration-300 ease-out"
                            style={{
                              width: `${cloudinaryUpload.state.progress}%`,
                              background: "var(--gradientPrimary)",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section: Informations */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-4 rounded-full" style={{ background: "var(--gradientPrimary)" }} />
                      <h4 className="text-sm font-semibold" style={{ color: "var(--textPrimary)" }}>Informations</h4>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="nom" style={{ fontSize: "0.8125rem", color: "var(--textSecondary)" }}>Nom du service</Label>
                        <Input
                          id="nom"
                          value={form.nom}
                          onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                          placeholder="Ex: Soin visage, Seance photo, Coaching sportif"
                          style={{
                            background: "var(--bgCard)",
                            border: "1px solid var(--border)",
                            color: "var(--textPrimary)",
                          }}
                          className="focus-visible:ring-1 focus-visible:ring-[#ff6b35]/30"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="description" style={{ fontSize: "0.8125rem", color: "var(--textSecondary)" }}>Description</Label>
                        <Input
                          id="description"
                          value={form.description}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, description: e.target.value }))
                          }
                          placeholder="Decrivez ce que comprend ce service..."
                          style={{
                            background: "var(--bgCard)",
                            border: "1px solid var(--border)",
                            color: "var(--textPrimary)",
                          }}
                          className="focus-visible:ring-1 focus-visible:ring-[#ff6b35]/30"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="categorie" style={{ fontSize: "0.8125rem", color: "var(--textSecondary)" }}>Categorie</Label>
                        <Select
                          value={form.categorie}
                          onValueChange={(v) => setForm((f) => ({ ...f, categorie: v }))}
                        >
                          <SelectTrigger className="select-trigger-premium">
                            <SelectValue placeholder="Selectionner une categorie" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Section: Tarification & Duree */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-4 rounded-full" style={{ background: "var(--gradientPrimary)" }} />
                      <h4 className="text-sm font-semibold" style={{ color: "var(--textPrimary)" }}>Tarification & Duree</h4>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="type_prix" style={{ fontSize: "0.8125rem", color: "var(--textSecondary)" }}>Type de tarification</Label>
                        <Select
                          value={form.type_prix}
                          onValueChange={(v: "fixe" | "heure" | "seance" | "devis") =>
                            setForm((f) => ({ ...f, type_prix: v }))
                          }
                        >
                          <SelectTrigger className="select-trigger-premium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixe">Prix fixe</SelectItem>
                            <SelectItem value="heure">Par heure</SelectItem>
                            <SelectItem value="seance">Par seance</SelectItem>
                            <SelectItem value="devis">Sur devis</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="prix" style={{ fontSize: "0.8125rem", color: "var(--textSecondary)" }}>Prix ({form.devise})</Label>
                          <Input
                            id="prix"
                            type="number"
                            value={form.prix || ""}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, prix: Number(e.target.value) }))
                            }
                            disabled={form.type_prix === "devis"}
                            style={{
                              background: form.type_prix === "devis" ? "var(--bgSecondary)" : "var(--bgCard)",
                              border: "1px solid var(--border)",
                              color: "var(--textPrimary)",
                              opacity: form.type_prix === "devis" ? 0.5 : 1,
                            }}
                            className="focus-visible:ring-1 focus-visible:ring-[#ff6b35]/30"
                          />
                          {form.type_prix === "devis" && (
                            <p className="text-xs" style={{ color: "var(--textMuted)" }}>Laissez a 0 pour un devis personnalise</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="duree" style={{ fontSize: "0.8125rem", color: "var(--textSecondary)" }}>Duree (minutes)</Label>
                          <Input
                            id="duree"
                            type="number"
                            value={form.duree}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, duree: Number(e.target.value) }))
                            }
                            style={{
                              background: "var(--bgCard)",
                              border: "1px solid var(--border)",
                              color: "var(--textPrimary)",
                            }}
                            className="focus-visible:ring-1 focus-visible:ring-[#ff6b35]/30"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {saveError && (
                    <div className="p-3 rounded-lg" style={{ background: "var(--errorDim)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <p className="text-sm flex items-center gap-1.5" style={{ color: "var(--error)" }}>
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {saveError}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer with save button */}
              <div style={{ padding: "0.75rem 1.5rem 1.25rem 1.5rem", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
                <Button
                  onClick={handleSave}
                  className="btn-gradient w-full"
                  style={{ borderRadius: "var(--radius-md)", height: "2.75rem" }}
                  disabled={!form.nom || saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editService ? "Enregistrement..." : "Ajout..."}
                    </>
                  ) : (
                    editService ? "Enregistrer" : "Ajouter le service"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search results count */}
      {searchQuery && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm"
          style={{ color: "var(--textMuted)" }}
        >
          {filteredServices.length} resultat{filteredServices.length > 1 ? "s" : ""} pour &quot;{searchQuery}&quot;
        </motion.p>
      )}

      {/* ═══ SERVICE CARDS GRID ═══ */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredServices.map((s, idx) => (
          <div
            key={s.id}
            className={`product-card ${!s.actif ? "opacity-50" : ""}`}
            style={{ animation: `fade-up 500ms var(--ease-out) ${idx * 60}ms both` }}
          >
            {/* Service Image */}
            <div className="product-image" style={{ position: "relative", aspectRatio: "1", overflow: "hidden", background: "var(--bgSecondary)" }}>
              {(s.photos?.length > 0 || s.photo_url) ? (
                <>
                  <img
                    src={s.photos?.[0] || s.photo_url}
                    alt={s.nom}
                    className="w-full h-full object-cover transition-all duration-500 ease-out"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                  <div className="product-overlay" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bgSecondary)" }}>
                  <Briefcase className="h-14 w-14" style={{ color: "var(--textMuted)", opacity: 0.4 }} />
                </div>
              )}

              {/* Category Tag Overlay */}
              {s.categorie && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="tag text-[10px] flex items-center gap-1">
                    <Tag className="h-2.5 w-2.5" />
                    {s.categorie}
                  </span>
                </div>
              )}

              {/* Duration Tag Overlay */}
              <div className="absolute bottom-3 right-3 z-10">
                <span
                  className="text-[10px] font-medium px-2 py-1 rounded-md flex items-center gap-1"
                  style={{
                    background: "rgba(6,3,11,0.7)",
                    color: "var(--textSecondary)",
                    backdropFilter: "blur(4px)",
                    border: "1px solid var(--borderSubtle)",
                  }}
                >
                  <Clock className="h-2.5 w-2.5" />
                  {s.duree} min
                </span>
              </div>
            </div>

            {/* Service Info */}
            <div className="p-4 space-y-3">
              {/* Title + Actions */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm truncate" style={{ color: "var(--textPrimary)" }}>{s.nom}</h3>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => handleEdit(s)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ease-out hover:scale-105"
                    style={{ background: "var(--primaryDim)", color: "var(--primary)", border: "1px solid var(--border)" }}
                    title="Modifier"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(s)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ease-out hover:scale-105"
                    style={{ background: "var(--errorDim)", color: "var(--error)", border: "1px solid rgba(239,68,68,0.15)" }}
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Description */}
              {s.description && (
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--textMuted)" }}>
                  {s.description}
                </p>
              )}

              {/* Price Display */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold" style={{ color: "var(--primary)" }}>
                  {s.type_prix === "devis" ? (
                    "Sur devis"
                  ) : (
                    <>
                      {s.prix.toLocaleString()}{" "}
                      <span className="text-xs font-medium" style={{ color: "var(--textMuted)" }}>{s.devise}</span>
                    </>
                  )}
                </span>
                {s.type_prix !== "devis" && (
                  <span className="badge-premium text-[10px]">
                    {TYPE_PRIX_LABELS[s.type_prix]?.toLowerCase()}
                  </span>
                )}
              </div>

              {/* Toggle active button */}
              <button
                onClick={() => toggleActif(s)}
                className={`w-full py-2 rounded-lg text-xs font-medium transition-all duration-200 ease-out ${
                  s.actif
                    ? "hover:bg-red-500/10 hover:text-red-400"
                    : ""
                }`}
                style={{
                  background: s.actif ? "var(--primaryDim)" : "var(--gradientPrimary)",
                  color: s.actif ? "var(--primary)" : "var(--textInverse)",
                  border: s.actif ? "1px solid var(--border)" : "none",
                }}
              >
                {s.actif ? "Desactiver" : "Activer"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ EMPTY STATE ═══ */}
      {filteredServices.length === 0 && !loading && (
        <EmptyState
          icon={Briefcase}
          title={searchQuery ? "Aucun resultat" : "Aucun service"}
          description={searchQuery ? `Aucun service trouve pour "${searchQuery}"` : "Vous n'avez pas encore de services. Cliquez sur \"Ajouter\" pour commencer."}
          action={searchQuery ? undefined : { label: "Ajouter un service", onClick: () => { setEditService(null); setForm(defaultForm); setPhotoItems([]); setOpen(true) } }}
        />
      )}

      {/* ═══ DELETE CONFIRMATION DIALOG ═══ */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="dialog-content-premium max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "var(--errorDim)", border: "1px solid rgba(239,68,68,0.15)" }}
              >
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
