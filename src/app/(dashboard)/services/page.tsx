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
import { Plus, Pencil, Trash2, ImageUp, Briefcase, AlertTriangle, AlertCircle, Search, X, Loader2, Clock, Tag } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import type { Service } from "@/lib/types"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"]
const MAX_SIZE = 5 * 1024 * 1024

const TYPE_PRIX_LABELS: Record<string, string> = {
  fixe: "Prix fixe",
  heure: "Par heure",
  seance: "Par séance",
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

  const defaultForm = {
    nom: "",
    description: "",
    prix: 0,
    devise: "DZD",
    type_prix: "fixe" as const,
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
    setUploadError("")

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setUploading(false)
      setUploadError("Utilisateur non connecté")
      return ""
    }

    const ext = file.name.split(".").pop()
    const path = `services/${user.id}/${crypto.randomUUID()}.${ext}`

    const { error } = await supabase.storage
      .from("produits")
      .upload(path, file)

    if (error) {
      setUploading(false)
      if (error.message?.includes("bucket")) {
        setUploadError("Bucket 'produits' introuvable. Créez-le dans Supabase Storage.")
      } else if (error.message?.includes("policy")) {
        setUploadError("Permission refusée. Vérifiez les politiques RLS du bucket.")
      } else {
        setUploadError(`Erreur lors de l'upload : ${error.message}`)
      }
      return ""
    }

    const { data: urlData } = supabase.storage
      .from("produits")
      .getPublicUrl(path)

    setUploading(false)
    return urlData?.publicUrl || ""
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
      type_prix: s.type_prix,
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
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-muted-foreground">{services.length} service(s)</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, description, catégorie..."
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
              <Button onClick={() => { setEditService(null); setForm(defaultForm); setPhotoItems([]) }}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editService ? "Modifier le service" : "Nouveau service"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Photos du service</Label>

                  {photoItems.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {photoItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="relative group aspect-square rounded-lg border bg-muted overflow-hidden"
                        >
                          <img
                            src={item.uploadedUrl || item.previewUrl}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-white hover:bg-white/20"
                              onClick={() => removePhoto(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {item.uploading && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <Loader2 className="h-5 w-5 animate-spin text-white" />
                            </div>
                          )}
                          <div className="absolute top-1 left-1 bg-black/60 text-white text-xs rounded px-1.5 py-0.5">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-cyber-cyan/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-cyber-cyan transition-colors"
                      >
                        <ImageUp className="h-5 w-5" />
                        <span className="text-xs">Ajouter</span>
                      </button>
                    </div>
                  )}

                  {photoItems.length === 0 && (
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-4 p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-cyber-cyan/50 transition-colors"
                    >
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        <ImageUp className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Ajouter des photos</span>
                        <span className="text-xs text-muted-foreground">JPG, PNG, WEBP — max 5MB par photo</span>
                      </div>
                    </div>
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
                    <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {uploadError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nom">Nom du service</Label>
                  <Input
                    id="nom"
                    value={form.nom}
                    onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                    placeholder="Ex: Soin visage, Séance photo, Coaching sportif"
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
                    placeholder="Décrivez ce que comprend ce service..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categorie">Catégorie</Label>
                  <Select
                    value={form.categorie}
                    onValueChange={(v) => setForm((f) => ({ ...f, categorie: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type_prix">Type de tarification</Label>
                  <Select
                    value={form.type_prix}
                    onValueChange={(v: "fixe" | "heure" | "seance" | "devis") =>
                      setForm((f) => ({ ...f, type_prix: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixe">Prix fixe</SelectItem>
                      <SelectItem value="heure">Par heure</SelectItem>
                      <SelectItem value="seance">Par séance</SelectItem>
                      <SelectItem value="devis">Sur devis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prix">Prix ({form.devise})</Label>
                    <Input
                      id="prix"
                      type="number"
                      value={form.prix || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, prix: Number(e.target.value) }))
                      }
                      disabled={form.type_prix === "devis"}
                    />
                    {form.type_prix === "devis" && (
                      <p className="text-xs text-muted-foreground">Laissez à 0 pour un devis personnalisé</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duree">Durée (minutes)</Label>
                    <Input
                      id="duree"
                      type="number"
                      value={form.duree}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, duree: Number(e.target.value) }))
                      }
                    />
                  </div>
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
                      {editService ? "Enregistrement..." : "Ajout..."}
                    </>
                  ) : (
                    editService ? "Enregistrer" : "Ajouter"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          {filteredServices.length} résultat(s) pour &quot;{searchQuery}&quot;
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredServices.map((s) => (
          <Card key={s.id} className={!s.actif ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="relative aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                {(s.photos?.length > 0 || s.photo_url) ? (
                  <img
                    src={s.photos?.[0] || s.photo_url}
                    alt={s.nom}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Briefcase className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold truncate">{s.nom}</h3>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEdit(s)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setDeleteTarget(s)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {s.categorie && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    {s.categorie}
                  </div>
                )}

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {s.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="font-bold">
                    {s.type_prix === "devis" ? (
                      "Sur devis"
                    ) : (
                      <>
                        {s.prix.toLocaleString()} {s.devise}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          {TYPE_PRIX_LABELS[s.type_prix]?.toLowerCase()}
                        </span>
                      </>
                    )}
                  </span>
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    {s.duree} min
                  </Badge>
                </div>

                <Button
                  variant={s.actif ? "outline" : "default"}
                  size="sm"
                  className="w-full"
                  onClick={() => toggleActif(s)}
                >
                  {s.actif ? "Désactiver" : "Activer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredServices.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {searchQuery
              ? `Aucun service trouvé pour "${searchQuery}"`
              : 'Aucun service pour le moment. Cliquez sur "Ajouter" pour commencer.'}
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
