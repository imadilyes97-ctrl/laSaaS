"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Copy, Eye, EyeOff, RefreshCw, Bot, ImageUp, MessageSquare, User, CheckCircle2, XCircle, AlertCircle, RotateCw, BarChart3, ShoppingCart, Send, Loader2, Check } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { format, parseISO, startOfDay } from "date-fns"
import { fr } from "date-fns/locale"
import type { ChatbotConfig, Conversation, Message } from "@/lib/types"

export default function ChatbotPage() {
  const [config, setConfig] = useState<ChatbotConfig | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [showToken, setShowToken] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [stats, setStats] = useState({ messagesToday: 0, ordersToday: 0 })
  const [testOpen, setTestOpen] = useState(false)
  const [testMessages, setTestMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [testInput, setTestInput] = useState("")
  const [testLoading, setTestLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const testEndRef = useRef<HTMLDivElement>(null)

  const [nom_chatbot, setNomChatbot] = useState("Yasmine")
  const [message_bienvenue, setMessageBienvenue] = useState("")
  const [langue, setLangue] = useState("FR")
  const [photoUrl, setPhotoUrl] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")

  const [promptMode, setPromptMode] = useState<"guided" | "libre">("guided")
  const [prompt_role, setPromptRole] = useState("")
  const [prompt_ton, setPromptTon] = useState("professionnel")
  const [prompt_regles, setPromptRegles] = useState("")
  const [prompt_langue, setPromptLangue] = useState("fr")
  const [prompt_libre, setPromptLibre] = useState("")
  const [prompt_final, setPromptFinal] = useState("")
  const [savingPersonality, setSavingPersonality] = useState(false)
  const [personalitySaved, setPersonalitySaved] = useState(false)

  useEffect(() => {
    testEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [testMessages])

  const loadData = useCallback(async () => {
    setLoading(true)
    setHasError(false)
    setErrorMessage("")

    const timeoutId = setTimeout(() => {
      setLoading(false)
      setHasError(true)
      setErrorMessage("Le serveur ne répond pas. Veuillez réessayer.")
    }, 10000)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        clearTimeout(timeoutId)
        setLoading(false)
        setHasError(true)
        setErrorMessage("Vous devez être connecté.")
        return
      }

      const { data: cfg, error: cfgError } = await supabase
        .from("config_chatbot")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (cfgError && cfgError.code !== "PGRST116") {
        clearTimeout(timeoutId)
        setLoading(false)
        setHasError(true)
        setErrorMessage("Erreur de connexion à la base de données. Vérifiez que la table config_chatbot existe.")
        return
      }

      if (cfg) {
        setConfig(cfg)
        setNomChatbot(cfg.nom_chatbot)
        setMessageBienvenue(cfg.message_bienvenue)
        setLangue(cfg.langue)
        setPhotoUrl(cfg.photo_profil_url || "")
        setPromptRole(cfg.prompt_role || "")
        setPromptTon(cfg.prompt_ton || "professionnel")
        setPromptRegles(cfg.prompt_regles || "")
        setPromptLangue(cfg.prompt_langue || "fr")
        setPromptLibre(cfg.prompt_libre || "")
        setPromptFinal(cfg.prompt_final || "")
        setPromptMode(cfg.prompt_final && !cfg.prompt_role ? "libre" : "guided")
      } else {
        const { data: newCfg, error: insertError } = await supabase
          .from("config_chatbot")
          .insert({
            user_id: user.id,
            nom_chatbot: "Yasmine",
            message_bienvenue: "Bonjour ! Je suis Yasmine, votre assistante virtuelle. Comment puis-je vous aider aujourd'hui ?",
            langue: "FR",
            actif: true,
            prompt_ton: "professionnel",
            prompt_langue: "fr",
          })
          .select()
          .single()

        if (insertError || !newCfg) {
          clearTimeout(timeoutId)
          setLoading(false)
          setHasError(true)
          setErrorMessage("Impossible de créer la configuration. Vérifiez que la table config_chatbot existe dans Supabase.")
          return
        }

        setConfig(newCfg)
        setNomChatbot(newCfg.nom_chatbot)
        setMessageBienvenue(newCfg.message_bienvenue)
        setLangue(newCfg.langue)
        setPhotoUrl(newCfg.photo_profil_url || "")
        setPromptTon(newCfg.prompt_ton || "professionnel")
        setPromptLangue(newCfg.prompt_langue || "fr")
      }

      const today = startOfDay(new Date()).toISOString()

      const { count: msgCount } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", today)

      const { count: orderCount } = await supabase
        .from("commandes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", today)

      setStats({
        messagesToday: msgCount || 0,
        ordersToday: orderCount || 0,
      })

      const { data: convs } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (convs) setConversations(convs)
    } catch {
      clearTimeout(timeoutId)
      setHasError(true)
      setErrorMessage("Erreur réseau. Veuillez vérifier votre connexion et réessayer.")
    } finally {
      clearTimeout(timeoutId)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()

    const supabase = createClient()
    const channel = supabase
      .channel("conversations-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        (payload) => {
          const newConv = payload.new as Conversation
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user && newConv.user_id === user.id) {
              setConversations((prev) => [newConv, ...prev])
              setStats((prev) => ({ ...prev, messagesToday: prev.messagesToday + 1 }))
            }
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadData])

  const validateFile = (file: File): string | null => {
    const allowed = ["image/jpeg", "image/png", "image/webp"]
    if (!allowed.includes(file.type)) {
      return "Format accepté : JPG, PNG, WEBP"
    }
    if (file.size > 5 * 1024 * 1024) {
      return "Image trop grande, maximum 5MB"
    }
    return null
  }

  const uploadPhoto = async (file: File) => {
    setUploading(true)
    setUploadError("")

    const validationError = validateFile(file)
    if (validationError) {
      setUploadError(validationError)
      setUploading(false)
      return ""
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setUploading(false)
      return ""
    }

    const ext = file.name.split(".").pop()
    const path = `chatbot/${user.id}/profile.${ext}`

    const { error } = await supabase.storage.from("produits").upload(path, file, { upsert: true })

    if (error) {
      setUploading(false)
      if (error.message?.includes("bucket")) {
        setUploadError("Bucket 'produits' introuvable. Créez-le dans Supabase Storage.")
      } else {
        setUploadError("Erreur lors de l'upload.")
      }
      return ""
    }

    const { data: urlData } = supabase.storage.from("produits").getPublicUrl(path)
    setUploading(false)
    return urlData?.publicUrl || ""
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    const url = await uploadPhoto(file)
    if (url) {
      setPhotoUrl(url)
      URL.revokeObjectURL(objectUrl)
      setPreviewUrl("")
    }
  }

  const saveConfig = async () => {
    if (!config) return
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from("config_chatbot")
      .update({
        nom_chatbot,
        message_bienvenue,
        langue,
        photo_profil_url: photoUrl,
        prompt_libre,
        prompt_role,
        prompt_ton,
        prompt_regles,
        prompt_langue,
        prompt_final,
      })
      .eq("id", config.id)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const generateToken = async () => {
    if (!config) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("config_chatbot")
      .update({ secret_token: uuidv4() })
      .eq("id", config.id)
      .select("secret_token")
      .single()

    if (data) {
      setConfig((prev) => prev ? { ...prev, secret_token: data.secret_token } : null)
    }
  }

  const copyToken = () => {
    if (!config) return
    navigator.clipboard.writeText(config.secret_token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generatePromptFinal = () => {
    if (promptMode === "libre") {
      setPromptFinal(prompt_libre)
      return prompt_libre
    }

    const generated = `Tu es ${prompt_role || nom_chatbot}.
Ton de communication : ${prompt_ton}.
Langue principale : ${prompt_langue}.
Règles importantes : ${prompt_regles}.
Tu connais tous les produits disponibles et tu aides les clients à commander.
Réponds toujours de manière ${prompt_ton} et dans la langue ${prompt_langue}.`
    setPromptFinal(generated)
    return generated
  }

  const handleSavePersonality = async () => {
    if (!config) return
    setSavingPersonality(true)

    const promptFinal = generatePromptFinal()

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSavingPersonality(false)
      return
    }

    const { error } = await supabase
      .from("config_chatbot")
      .update({
        prompt_libre,
        prompt_role,
        prompt_ton,
        prompt_regles,
        prompt_langue,
        prompt_final: promptFinal,
      })
      .eq("id", config.id)

    if (!error) {
      setPersonalitySaved(true)
      setTimeout(() => setPersonalitySaved(false), 2000)
    }
    setSavingPersonality(false)
  }

  const toggleActif = async () => {
    if (!config) return
    const supabase = createClient()
    await supabase
      .from("config_chatbot")
      .update({ actif: !config.actif })
      .eq("id", config.id)

    setConfig((prev) => prev ? { ...prev, actif: !prev.actif } : null)
  }

  const handleTestSend = async () => {
    if (!testInput.trim() || testLoading) return
    const userMsg = { role: "user" as const, content: testInput }
    setTestMessages((prev) => [...prev, userMsg])
    setTestInput("")
    setTestLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const resp = await fetch("/api/chat-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          userId: user?.id,
          conversationHistory: testMessages,
        }),
      })

      const data = await resp.json()
      const botMsg = { role: "assistant" as const, content: data.reply || "Désolée, je n'ai pas pu répondre." }
      setTestMessages((prev) => [...prev, botMsg])
    } catch {
      const botMsg = { role: "assistant" as const, content: "Erreur de connexion. Veuillez réessayer." }
      setTestMessages((prev) => [...prev, botMsg])
    } finally {
      setTestLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <RotateCw className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h2 className="text-lg font-semibold">Erreur de chargement</h2>
            <p className="text-muted-foreground mt-1">{errorMessage}</p>
          </div>
          <Button onClick={loadData} variant="outline" className="gap-2">
            <RotateCw className="h-4 w-4" />
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Aucune configuration trouvée.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chatbot</h1>
          <p className="text-muted-foreground">Configurez votre assistant virtuel</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => { setTestMessages([]); setTestOpen(true) }}>
          <MessageSquare className="h-4 w-4" />
          Tester le chatbot
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Messages aujourd&apos;hui</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyber-cyan">{stats.messagesToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Commandes aujourd&apos;hui</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyber-cyan">{stats.ordersToday}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Configuration
            </CardTitle>
            <CardDescription>
              Personnalisez l&apos;apparence et le comportement de votre chatbot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Statut</Label>
              <Button
                variant={config.actif ? "default" : "outline"}
                size="sm"
                onClick={toggleActif}
                className="gap-2"
              >
                {config.actif ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Activé
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Désactivé
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Photo de profil</Label>
              <div className="flex items-center gap-4">
                {previewUrl || photoUrl ? (
                  <img
                    src={previewUrl || photoUrl}
                    alt="Chatbot"
                    className="w-16 h-16 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border">
                    <Bot className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Upload..." : "Changer la photo"}
                  </Button>
                  {uploadError && (
                    <p className="text-xs text-destructive">{uploadError}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom_chatbot">Nom du chatbot</Label>
              <Input
                id="nom_chatbot"
                value={nom_chatbot}
                onChange={(e) => setNomChatbot(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message de bienvenue</Label>
              <textarea
                id="message"
                value={message_bienvenue}
                onChange={(e) => setMessageBienvenue(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <Label>Langue</Label>
              <Select value={langue} onValueChange={setLangue}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FR">Français</SelectItem>
                  <SelectItem value="AR">العربية</SelectItem>
                  <SelectItem value="EN">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={saveConfig} className="w-full gap-2" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <Check className="h-4 w-4" />
              ) : null}
              {saving ? "Enregistrement..." : saved ? "Enregistré !" : "Enregistrer"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Connexion N8n
            </CardTitle>
            <CardDescription>
              Utilisez ces informations pour connecter votre chatbot au webhook N8n
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>URL du Webhook</Label>
              <div className="flex gap-2">
                <Input
                  value={typeof window !== "undefined" ? `${window.location.origin}/api/webhook` : ""}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      typeof window !== "undefined" ? `${window.location.origin}/api/webhook` : ""
                    )
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secret Token du Chatbot</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    value={config.secret_token}
                    readOnly
                    type={showToken ? "text" : "password"}
                    className="font-mono text-xs pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button variant="outline" size="icon" onClick={copyToken}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={generateToken}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {copied && <p className="text-xs text-cyber-cyan">Copié !</p>}
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <Label className="text-base">Comment connecter N8n</Label>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Créez un webhook dans N8n avec la méthode <strong>POST</strong></li>
                <li>Utilisez l&apos;URL ci-dessus comme endpoint</li>
                <li>Ajoutez le token dans le body JSON : <code className="bg-background px-1 rounded">{'{ "token": "votre_token", "nom_client": "...", "produits": "..." }'}</code></li>
                <li>Connectez Messenger à N8n pour recevoir les messages</li>
                <li>Testez avec un message : envoyez les données au webhook</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Personnalité & Comportement
          </CardTitle>
          <CardDescription>
            Définissez la personnalité et les règles de votre chatbot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border p-1">
            <button
              onClick={() => setPromptMode("guided")}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${promptMode === "guided" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Formulaire guidé
            </button>
            <button
              onClick={() => setPromptMode("libre")}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${promptMode === "libre" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Prompt libre
            </button>
          </div>

          {promptMode === "guided" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>🎭 Rôle du chatbot</Label>
                <Input
                  value={prompt_role}
                  onChange={(e) => setPromptRole(e.target.value)}
                  placeholder={`Ex: "Tu es ${nom_chatbot}, conseillère commerciale pour une boutique de mode"`}
                />
              </div>
              <div className="space-y-2">
                <Label>🗣️ Ton de communication</Label>
                <Select value={prompt_ton} onValueChange={setPromptTon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professionnel">Professionnel</SelectItem>
                    <SelectItem value="amical">Amical</SelectItem>
                    <SelectItem value="décontracté">Décontracté</SelectItem>
                    <SelectItem value="formel">Formel</SelectItem>
                    <SelectItem value="humoristique">Humoristique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>🌍 Langue principale</Label>
                <Select value={prompt_langue} onValueChange={setPromptLangue}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="ar">Arabe</SelectItem>
                    <SelectItem value="en">Anglais</SelectItem>
                    <SelectItem value="darija">Darija</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>📋 Règles importantes</Label>
                <textarea
                  value={prompt_regles}
                  onChange={(e) => setPromptRegles(e.target.value)}
                  placeholder="Ex: Ne jamais donner de prix sans vérifier le stock. Toujours demander le nom du client en premier."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={generatePromptFinal} variant="outline" className="flex-1 gap-2">
                  Générer le prompt final
                </Button>
                <Button onClick={handleSavePersonality} className="flex-1 gap-2" disabled={savingPersonality}>
                  {savingPersonality ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : personalitySaved ? (
                    <Check className="h-4 w-4" />
                  ) : null}
                  {savingPersonality ? "Enregistrement..." : personalitySaved ? "Enregistré !" : "Enregistrer la config"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>✍️ Prompt système personnalisé</Label>
                <textarea
                  value={prompt_libre}
                  onChange={(e) => { setPromptLibre(e.target.value); setPromptFinal(e.target.value) }}
                  placeholder={`Ex: "Tu es Sarah, assistante virtuelle de la boutique Élégance. Tu parles en français avec un ton chaleureux..."`}
                  className="flex min-h-[160px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <Button onClick={handleSavePersonality} className="w-full gap-2" disabled={savingPersonality}>
                {savingPersonality ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : personalitySaved ? (
                  <Check className="h-4 w-4" />
                ) : null}
                {savingPersonality ? "Enregistrement..." : personalitySaved ? "Enregistré !" : "Enregistrer la config"}
              </Button>
            </div>
          )}

          {prompt_final && (
            <div className="space-y-2">
              <Label>Aperçu du prompt final</Label>
              <div className="rounded-lg bg-[#0a0f1a] border border-cyan-500/30 p-3 font-mono text-xs text-cyan-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {prompt_final}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dernières conversations
            </CardTitle>
            <CardDescription>
              Les {conversations.length} dernières conversations
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {conversations.slice(0, 10).map((conv) => (
              <div
                key={conv.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{conv.sender_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {conv.messages?.length || 0} message(s)
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(conv.created_at), "dd/MM HH:mm", { locale: fr })}
                </span>
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                Aucune conversation pour le moment
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="max-w-sm bg-cyber-bgCard border-cyber-cyan/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Bot className="h-5 w-5 text-cyber-cyan" />
              Tester {nom_chatbot}
            </DialogTitle>
          </DialogHeader>
          <div className="h-72 overflow-y-auto space-y-3 border border-cyber-border rounded-lg p-3 bg-cyber-bgSecond">
            {testMessages.length === 0 && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-cyber-cyan/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-cyber-cyan" />
                </div>
                <div className="bg-cyber-bgCard text-white rounded-lg p-2 text-sm">
                  {message_bienvenue || `Bonjour ! Je suis ${nom_chatbot}. Comment puis-je vous aider ?`}
                </div>
              </div>
            )}
            {testMessages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === "user" ? "bg-cyber-cyan/20" : "bg-cyber-cyan/20"}`}>
                  {msg.role === "user" ? (
                    <User className="h-3.5 w-3.5 text-cyber-cyan" />
                  ) : (
                    <Bot className="h-3.5 w-3.5 text-cyber-cyan" />
                  )}
                </div>
                <div className={`rounded-lg p-2 text-sm max-w-[80%] ${msg.role === "user" ? "bg-cyber-cyan text-black" : "bg-cyber-bgCard text-white"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {testLoading && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-cyber-cyan/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-cyber-cyan" />
                </div>
                <div className="bg-cyber-bgCard text-cyber-textSecondary rounded-lg p-2 text-sm italic">
                  En train d&apos;écrire...
                </div>
              </div>
            )}
            <div ref={testEndRef} />
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTestMessages([])}
              className="text-xs text-cyber-textSecondary"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); handleTestSend() }}
            className="flex gap-2"
          >
            <Input
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Écrivez un message..."
              className="bg-cyber-bgSecond border-cyber-border text-white"
            />
            <Button type="submit" size="icon" disabled={!testInput.trim() || testLoading}>
              {testLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
