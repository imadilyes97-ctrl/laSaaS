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
import { Copy, Eye, EyeOff, RefreshCw, Bot, ImageUp, MessageSquare, User, CheckCircle2, XCircle, AlertCircle, RotateCw, BarChart3, ShoppingCart, Send, Loader2, Check, Sparkles, Shield, Globe, BookOpen, Zap, Key, Webhook, Smartphone, Paintbrush, Settings2 } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { format, parseISO, startOfDay } from "date-fns"
import { fr } from "date-fns/locale"
import type { ChatbotConfig, Conversation, Message } from "@/lib/types"
import { LoadingSkeleton, ErrorState } from "@/components/PageStates"

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
          stream: true
        }),
      })

      const contentType = resp.headers.get("Content-Type")

      if (contentType?.includes("text/event-stream")) {
        const reader = resp.body!.getReader()
        const decoder = new TextDecoder()
        let accumulated = ""
        let buffer = ""

        setTestMessages((prev) => [...prev, { role: "assistant", content: "" }])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const parsed = JSON.parse(line)
              accumulated += parsed.content || ""
            } catch {
              // Ignorer les JSON incomplets
            }
          }

          setTestMessages((prev) => {
            const updated = [...prev]
            if (updated.length > 0) {
              updated[updated.length - 1] = { role: "assistant", content: accumulated }
            }
            return updated
          })
        }
      } else {
        const data = await resp.json()
        const botMsg = { role: "assistant" as const, content: data.reply || "Désolée, je n'ai pas pu répondre." }
        setTestMessages((prev) => [...prev, botMsg])
      }
    } catch {
      const botMsg = { role: "assistant" as const, content: "Erreur de connexion. Veuillez réessayer." }
      setTestMessages((prev) => [...prev, botMsg])
    } finally {
      setTestLoading(false)
    }
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  if (hasError) {
    return <ErrorState message={errorMessage} onRetry={loadData} />
  }

  if (!config) {
    return <ErrorState message="Aucune configuration trouvée." />
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="page-header mb-0">
          <div className="flex items-center gap-3">
            <div className="stat-icon w-12 h-12 rounded-2xl">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h1 className="flex items-center gap-3">
                Chatbot
                <span className={`tag ${config.actif ? "" : "tag-accent"}`}>
                  {config.actif ? (
                    <><CheckCircle2 className="h-3 w-3" /> Actif</>
                  ) : (
                    <><XCircle className="h-3 w-3" /> Inactif</>
                  )}
                </span>
              </h1>
              <p>Configurez votre assistant virtuel</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={config.actif ? "default" : "outline"}
            size="sm"
            onClick={toggleActif}
            className="gap-2 rounded-xl"
            style={
              config.actif
                ? { background: "rgba(255, 107, 53, 0.15)", color: "#ff6b35", borderColor: "rgba(255, 107, 53, 0.3)" }
                : {}
            }
          >
            {config.actif ? (
              <><XCircle className="h-4 w-4" /> Désactiver</>
            ) : (
              <><CheckCircle2 className="h-4 w-4" /> Activer</>
            )}
          </Button>
          <Button
            onClick={() => { setTestMessages([]); setTestOpen(true) }}
            className="btn-gradient btn-glow gap-2 rounded-xl"
          >
            <MessageSquare className="h-4 w-4" />
            Tester le chatbot
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <span className="stat-label text-xs uppercase tracking-wider font-semibold" style={{ color: "#64647a" }}>
              Messages aujourd&apos;hui
            </span>
            <div className="stat-icon w-9 h-9 rounded-lg">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="stat-value">{stats.messagesToday}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <span className="stat-label text-xs uppercase tracking-wider font-semibold" style={{ color: "#64647a" }}>
              Commandes aujourd&apos;hui
            </span>
            <div className="stat-icon w-9 h-9 rounded-lg">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <div className="stat-value">{stats.ordersToday}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration */}
        <div className="card-premium p-0">
          <div className="p-6 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="stat-icon w-10 h-10 rounded-xl">
                <Paintbrush className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold" style={{ color: "#fcfcfc" }}>Configuration</h3>
                <p className="text-xs" style={{ color: "#64647a" }}>Personnalisez l&apos;apparence et le comportement de votre chatbot</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9d9db5" }}>Photo de profil</Label>
              <div className="flex items-center gap-4">
                {previewUrl || photoUrl ? (
                  <div className="relative group">
                    <img
                      src={previewUrl || photoUrl}
                      alt="Chatbot"
                      className="w-16 h-16 rounded-xl object-cover border-2"
                      style={{ borderColor: "rgba(255, 107, 53, 0.2)" }}
                    />
                    <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageUp className="h-5 w-5 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center border-2" style={{ background: "var(--primaryDim)", borderColor: "rgba(255, 107, 53, 0.2)" }}>
                    <Bot className="h-7 w-7" style={{ color: "#ff6b35" }} />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
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
                    className="rounded-lg gap-2 text-xs"
                  >
                    <ImageUp className="h-3.5 w-3.5" />
                    {uploading ? "Upload..." : "Changer la photo"}
                  </Button>
                  {uploadError && (
                    <p className="text-xs" style={{ color: "#ef4444" }}>{uploadError}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom_chatbot" className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9d9db5" }}>Nom du chatbot</Label>
              <Input
                id="nom_chatbot"
                value={nom_chatbot}
                onChange={(e) => setNomChatbot(e.target.value)}
                className="rounded-lg"
                style={{ background: "#0b0716", borderColor: "var(--border)", color: "#fcfcfc" }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9d9db5" }}>Message de bienvenue</Label>
              <textarea
                id="message"
                value={message_bienvenue}
                onChange={(e) => setMessageBienvenue(e.target.value)}
                className="flex min-h-[90px] w-full rounded-lg border px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                style={{ background: "#0b0716", borderColor: "var(--border)", color: "#fcfcfc", resize: "vertical" }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9d9db5" }}>Langue</Label>
              <Select value={langue} onValueChange={setLangue}>
                <SelectTrigger className="rounded-lg" style={{ background: "#0b0716", borderColor: "var(--border)" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FR">Français</SelectItem>
                  <SelectItem value="AR">العربية</SelectItem>
                  <SelectItem value="EN">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={saveConfig} className="btn-gradient btn-glow w-full gap-2 rounded-xl" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <Check className="h-4 w-4" />
              ) : null}
              {saving ? "Enregistrement..." : saved ? "Enregistré !" : "Enregistrer la configuration"}
            </Button>
          </div>
        </div>

        {/* Connexion N8n */}
        <div className="card-premium p-0">
          <div className="p-6 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="stat-icon w-10 h-10 rounded-xl">
                <Webhook className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold" style={{ color: "#fcfcfc" }}>Connexion N8n</h3>
                <p className="text-xs" style={{ color: "#64647a" }}>Connectez votre chatbot au webhook N8n</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9d9db5" }}>URL du Webhook</Label>
              <div className="glass-light rounded-xl p-2 flex gap-2 items-center">
                <div className="flex-1 flex items-center gap-2 px-3 py-1.5">
                  <Zap className="h-3.5 w-3.5 shrink-0" style={{ color: "#ff6b35" }} />
                  <code className="text-xs font-mono truncate" style={{ color: "#9d9db5" }}>
                    {typeof window !== "undefined" ? `${window.location.origin}/api/webhook` : ""}
                  </code>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      typeof window !== "undefined" ? `${window.location.origin}/api/webhook` : ""
                    )
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9d9db5" }}>Secret Token du Chatbot</Label>
              <div className="glass-light rounded-xl p-2 flex gap-2 items-center">
                <div className="relative flex-1">
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <Key className="h-3.5 w-3.5 shrink-0" style={{ color: "#ff6b35" }} />
                    <code className="text-xs font-mono truncate" style={{ color: showToken ? "#fcfcfc" : "#9d9db5" }}>
                      {showToken ? config.secret_token : "••••••••••••••••"}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-8 rounded-lg"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0" onClick={copyToken}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0" onClick={generateToken}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
              {copied && (
                <p className="text-xs flex items-center gap-1.5" style={{ color: "#ff6b35" }}>
                  <Check className="h-3 w-3" /> Copié dans le presse-papier
                </p>
              )}
            </div>

            <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(124, 58, 237, 0.06)", border: "1px solid rgba(124, 58, 237, 0.12)" }}>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" style={{ color: "#7c3aed" }} />
                <span className="text-sm font-semibold" style={{ color: "#fcfcfc" }}>Comment connecter N8n</span>
              </div>
              <ol className="text-xs space-y-2 list-decimal list-inside" style={{ color: "#9d9db5" }}>
                <li>Créez un webhook dans N8n avec la méthode <strong style={{ color: "#fcfcfc" }}>POST</strong></li>
                <li>Utilisez l&apos;URL ci-dessus comme endpoint</li>
                <li>Ajoutez le token dans le body JSON : <code className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "#0b0716", color: "#ff6b35" }}>{'{ "token": "votre_token", "nom_client": "...", "produits": "..." }'}</code></li>
                <li>Connectez Messenger à N8n pour recevoir les messages</li>
                <li>Testez avec un message : envoyez les données au webhook</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Personnalité & Comportement */}
      <div className="card-premium p-0">
        <div className="p-6 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="stat-icon w-10 h-10 rounded-xl">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ color: "#fcfcfc" }}>Personnalité & Comportement</h3>
              <p className="text-xs" style={{ color: "#64647a" }}>Définissez la personnalité et les règles de votre chatbot</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="glass-light rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setPromptMode("guided")}
              className="flex-1 px-3 py-2 text-sm rounded-lg transition-all duration-200 font-medium"
              style={
                promptMode === "guided"
                  ? { background: "var(--gradientPrimary)", color: "#fff", boxShadow: "0 4px 15px rgba(255, 107, 53, 0.3)" }
                  : { color: "#64647a" }
              }
            >
              Formulaire guidé
            </button>
            <button
              onClick={() => setPromptMode("libre")}
              className="flex-1 px-3 py-2 text-sm rounded-lg transition-all duration-200 font-medium"
              style={
                promptMode === "libre"
                  ? { background: "var(--gradientPrimary)", color: "#fff", boxShadow: "0 4px 15px rgba(255, 107, 53, 0.3)" }
                  : { color: "#64647a" }
              }
            >
              Prompt libre
            </button>
          </div>

          {promptMode === "guided" ? (
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#9d9db5" }}>
                    <Smartphone className="h-3.5 w-3.5" /> Rôle du chatbot
                  </Label>
                  <Input
                    value={prompt_role}
                    onChange={(e) => setPromptRole(e.target.value)}
                    placeholder={`Ex: "Tu es ${nom_chatbot}, conseillère commerciale"`}
                    className="rounded-lg"
                    style={{ background: "#0b0716", borderColor: "var(--border)", color: "#fcfcfc" }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#9d9db5" }}>
                    <Globe className="h-3.5 w-3.5" /> Ton de communication
                  </Label>
                  <Select value={prompt_ton} onValueChange={setPromptTon}>
                    <SelectTrigger className="rounded-lg" style={{ background: "#0b0716", borderColor: "var(--border)" }}>
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
                  <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#9d9db5" }}>
                    <Globe className="h-3.5 w-3.5" /> Langue principale
                  </Label>
                  <Select value={prompt_langue} onValueChange={setPromptLangue}>
                    <SelectTrigger className="rounded-lg" style={{ background: "#0b0716", borderColor: "var(--border)" }}>
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
                  <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#9d9db5" }}>
                    <Shield className="h-3.5 w-3.5" /> Règles importantes
                  </Label>
                  <textarea
                    value={prompt_regles}
                    onChange={(e) => setPromptRegles(e.target.value)}
                    placeholder="Ex: Ne jamais donner de prix sans vérifier le stock"
                    className="flex min-h-[90px] w-full rounded-lg border px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                    style={{ background: "#0b0716", borderColor: "var(--border)", color: "#fcfcfc", resize: "vertical" }}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={generatePromptFinal} variant="outline" className="flex-1 gap-2 rounded-xl">
                  <Zap className="h-4 w-4" />
                  Générer le prompt final
                </Button>
                <Button onClick={handleSavePersonality} className="btn-gradient btn-glow flex-1 gap-2 rounded-xl" disabled={savingPersonality}>
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
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#9d9db5" }}>
                  <Settings2 className="h-3.5 w-3.5" /> Prompt système personnalisé
                </Label>
                <textarea
                  value={prompt_libre}
                  onChange={(e) => { setPromptLibre(e.target.value); setPromptFinal(e.target.value) }}
                  placeholder={`Ex: "Tu es Sarah, assistante virtuelle de la boutique Élégance..."`}
                  className="flex min-h-[180px] w-full rounded-lg border px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                  style={{ background: "#0b0716", borderColor: "var(--border)", color: "#fcfcfc", resize: "vertical" }}
                />
              </div>
              <Button onClick={handleSavePersonality} className="btn-gradient btn-glow w-full gap-2 rounded-xl" disabled={savingPersonality}>
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
            <div className="space-y-2 pt-2">
              <Label className="text-xs font-semibold" style={{ color: "#9d9db5" }}>Aperçu du prompt final</Label>
              <div className="rounded-xl p-4 font-mono text-xs whitespace-pre-wrap max-h-40 overflow-y-auto" style={{ background: "#0b0716", border: "1px solid rgba(124, 58, 237, 0.25)", color: "#a78bfa" }}>
                {prompt_final}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dernières conversations */}
      <div className="card-premium p-0">
        <div className="p-6 pb-4 border-b flex items-center justify-between flex-wrap gap-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="stat-icon w-10 h-10 rounded-xl">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ color: "#fcfcfc" }}>Dernières conversations</h3>
              <p className="text-xs" style={{ color: "#64647a" }}>Les {conversations.length} dernières conversations</p>
            </div>
          </div>
          <Badge variant="outline" className="rounded-lg text-xs" style={{ borderColor: "rgba(255, 107, 53, 0.2)", color: "#9d9db5" }}>
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="p-6">
          <div className="space-y-2 max-h-[420px] overflow-y-auto scrollbar-thin">
            {conversations.slice(0, 10).map((conv) => (
              <div
                key={conv.id}
                className="flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 cursor-pointer"
                style={{ border: "1px solid var(--border)", background: "rgba(11, 7, 22, 0.5)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 107, 53, 0.2)";
                  e.currentTarget.style.background = "rgba(255, 107, 53, 0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.background = "rgba(11, 7, 22, 0.5)";
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--primaryDim)" }}>
                    <User className="h-4 w-4" style={{ color: "#ff6b35" }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#fcfcfc" }}>{conv.sender_id}</p>
                    <p className="text-xs" style={{ color: "#64647a" }}>
                      {conv.messages?.length || 0} message{(conv.messages?.length || 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "#64647a" }}>
                    {format(parseISO(conv.created_at), "dd/MM HH:mm", { locale: fr })}
                  </span>
                </div>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--primaryDim)" }}>
                  <MessageSquare className="h-6 w-6" style={{ color: "#ff6b35" }} />
                </div>
                <p className="text-sm" style={{ color: "#64647a" }}>Aucune conversation pour le moment</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Dialog */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="dialog-content-premium max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg" style={{ color: "#fcfcfc" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--primaryDim)" }}>
                <Bot className="h-4 w-4" style={{ color: "#ff6b35" }} />
              </div>
              Tester {nom_chatbot}
            </DialogTitle>
          </DialogHeader>
          <div className="h-80 overflow-y-auto space-y-3 rounded-xl p-3" style={{ border: "1px solid var(--border)", background: "rgba(11, 7, 22, 0.6)" }}>
            {testMessages.length === 0 && (
              <div className="flex items-start gap-2.5 animate-in fade-in duration-300">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--primaryDim)" }}>
                  <Bot className="h-3.5 w-3.5" style={{ color: "#ff6b35" }} />
                </div>
                <div className="rounded-xl px-3.5 py-2.5 text-sm max-w-[80%]" style={{ background: "rgba(15, 10, 30, 0.8)", border: "1px solid var(--border)", color: "#fcfcfc" }}>
                  {message_bienvenue || `Bonjour ! Je suis ${nom_chatbot}. Comment puis-je vous aider ?`}
                </div>
              </div>
            )}
            {testMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""} animate-in fade-in duration-200`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--primaryDim)" }}>
                  {msg.role === "user" ? (
                    <User className="h-3.5 w-3.5" style={{ color: "#ff6b35" }} />
                  ) : (
                    <Bot className="h-3.5 w-3.5" style={{ color: "#ff6b35" }} />
                  )}
                </div>
                <div
                  className={`rounded-xl px-3.5 py-2.5 text-sm max-w-[80%] leading-relaxed ${
                    msg.role === "user"
                      ? "text-white"
                      : "text-white"
                  }`}
                  style={
                    msg.role === "user"
                      ? { background: "var(--gradientPrimary)", boxShadow: "0 4px 15px rgba(255, 107, 53, 0.25)" }
                      : { background: "rgba(15, 10, 30, 0.8)", border: "1px solid var(--border)" }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {testLoading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--primaryDim)" }}>
                  <Bot className="h-3.5 w-3.5" style={{ color: "#ff6b35" }} />
                </div>
                <div className="rounded-xl px-3.5 py-2.5 text-sm italic" style={{ background: "rgba(15, 10, 30, 0.8)", border: "1px solid var(--border)", color: "#64647a" }}>
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    En train d&apos;écrire...
                  </span>
                </div>
              </div>
            )}
            <div ref={testEndRef} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTestMessages([])}
              className="text-xs rounded-lg"
              style={{ color: "#64647a" }}
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
              className="rounded-xl"
              style={{ background: "rgba(11, 7, 22, 0.8)", borderColor: "var(--border)", color: "#fcfcfc" }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!testInput.trim() || testLoading}
              className="rounded-xl w-10 h-10 shrink-0"
              style={{ background: "var(--gradientPrimary)" }}
            >
              {testLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
