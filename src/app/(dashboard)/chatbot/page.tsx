"use client"

import { useEffect, useState, useRef } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Copy, Eye, EyeOff, RefreshCw, Bot, ImageUp, MessageSquare, User, CheckCircle2, XCircle } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import type { ChatbotConfig, Conversation } from "@/lib/types"

export default function ChatbotPage() {
  const [config, setConfig] = useState<ChatbotConfig | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [showToken, setShowToken] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [nom_chatbot, setNomChatbot] = useState("Yasmine")
  const [message_bienvenue, setMessageBienvenue] = useState("")
  const [langue, setLangue] = useState("FR")
  const [photoUrl, setPhotoUrl] = useState("")

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: cfg } = await supabase
        .from("config_chatbot")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (cfg) {
        setConfig(cfg)
        setNomChatbot(cfg.nom_chatbot)
        setMessageBienvenue(cfg.message_bienvenue)
        setLangue(cfg.langue)
        setPhotoUrl(cfg.photo_profil_url)
      } else {
        const { data: newCfg, error } = await supabase
          .from("config_chatbot")
          .insert({
            user_id: user.id,
            nom_chatbot: "Yasmine",
            message_bienvenue: "Bonjour ! Je suis Yasmine, votre assistante virtuelle. Comment puis-je vous aider aujourd'hui ?",
            langue: "FR",
          })
          .select()
          .single()
        if (newCfg) {
          setConfig(newCfg)
          setNomChatbot(newCfg.nom_chatbot)
          setMessageBienvenue(newCfg.message_bienvenue)
          setLangue(newCfg.langue)
          setPhotoUrl(newCfg.photo_profil_url)
        }
      }

      const { data: convs } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (convs) setConversations(convs)
    }
    load()

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
            }
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const uploadPhoto = async (file: File) => {
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ""

    const ext = file.name.split(".").pop()
    const path = `chatbot/${user.id}/profile.${ext}`

    await supabase.storage.from("produits").upload(path, file, { upsert: true })

    const { data: urlData } = supabase.storage.from("produits").getPublicUrl(path)
    setUploading(false)
    return urlData?.publicUrl || ""
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadPhoto(file)
    if (url) setPhotoUrl(url)
  }

  const saveConfig = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !config) return

    await supabase
      .from("config_chatbot")
      .update({
        nom_chatbot,
        message_bienvenue,
        langue,
        photo_profil_url: photoUrl,
      })
      .eq("id", config.id)

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const generateToken = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !config) return

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

  const toggleActif = async () => {
    if (!config) return
    const supabase = createClient()
    await supabase
      .from("config_chatbot")
      .update({ actif: !config.actif })
      .eq("id", config.id)

    setConfig((prev) => prev ? { ...prev, actif: !prev.actif } : null)
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chatbot</h1>
        <p className="text-muted-foreground">Configurez votre assistant virtuel</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Configuration du chatbot
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
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Chatbot"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Upload..." : "Changer la photo"}
                </Button>
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

            <Button onClick={saveConfig} className="w-full">
              {saved ? "Enregistré !" : "Enregistrer"}
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
              Utilisez ce token pour connecter votre chatbot au webhook
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>URL du Webhook</Label>
              <Input
                value={typeof window !== "undefined" ? `${window.location.origin}/api/webhook` : ""}
                readOnly
                className="font-mono text-xs"
              />
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
              {copied && <p className="text-xs text-green-600">Copié !</p>}
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label className="text-base">Étapes de connexion</Label>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Copiez l&apos;URL du webhook et le token ci-dessus</li>
                <li>Dans N8n, créez un webhook avec la méthode POST</li>
                <li>Configurez le webhook avec l&apos;URL ci-dessus</li>
                <li>Ajoutez le token dans le body de la requête</li>
                <li>Connectez Messenger à N8n pour recevoir les messages</li>
                <li>Testez la connexion en envoyant un message</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dernières conversations
          </CardTitle>
          <CardDescription>
            Les {conversations.length} dernières conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
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
    </div>
  )
}
