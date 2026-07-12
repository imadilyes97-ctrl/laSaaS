"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Copy, Eye, EyeOff, RefreshCw, Store, Mail, Webhook, Key, Check, Loader2, Shield, Sparkles } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

export default function SettingsPage() {
  const [secretToken, setSecretToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [boutiqueName, setBoutiqueName] = useState("")
  const [email, setEmail] = useState("")
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tokenCopied, setTokenCopied] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email || "")

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profile) {
        setSecretToken(profile.secret_token || "")
        setBoutiqueName(profile.boutique_name || "")
      } else {
        const newToken = uuidv4()
        setSecretToken(newToken)
        await supabase.from("profiles").insert({
          id: user.id,
          secret_token: newToken,
          boutique_name: "",
        })
      }
    }
    loadSettings()
  }, [])

  const generateToken = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const newToken = uuidv4()
    setSecretToken(newToken)
    await supabase
      .from("profiles")
      .update({ secret_token: newToken })
      .eq("id", user.id)
  }

  const copyToken = () => {
    navigator.clipboard.writeText(secretToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    setTokenCopied(true)
    setTimeout(() => setTokenCopied(false), 2000)
  }

  const saveBoutiqueName = async () => {
    setSaving(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    await supabase
      .from("profiles")
      .update({ boutique_name: boutiqueName })
      .eq("id", user.id)

    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2000)
  }

  const [webhookUrl, setWebhookUrl] = useState("")

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/webhook`)
  }, [])

  return (
    <div className="space-y-8 pb-8 max-w-2xl">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="stat-icon w-12 h-12 rounded-2xl">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1>Paramètres</h1>
            <p>Gérez votre boutique et vos identifiants de connexion</p>
          </div>
        </div>
      </div>

      {/* Webhook N8n */}
      <div className="card-premium p-0">
        <div className="p-6 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="stat-icon w-10 h-10 rounded-xl">
              <Webhook className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ color: "#fcfcfc" }}>Webhook N8n</h3>
              <p className="text-xs" style={{ color: "#64647a" }}>
                Utilisez ces informations pour connecter N8n à votre dashboard
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9d9db5" }}>
              URL du Webhook
            </Label>
            <div className="glass-light rounded-xl p-2 flex gap-2 items-center">
              <div className="flex-1 flex items-center gap-2 px-3 py-1.5">
                <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ background: "var(--primaryDim)" }}>
                  <Webhook className="h-3 w-3" style={{ color: "#ff6b35" }} />
                </div>
                <code className="text-xs font-mono truncate" style={{ color: "#9d9db5" }}>
                  {webhookUrl}
                </code>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg shrink-0"
                onClick={copyWebhookUrl}
              >
                {tokenCopied ? <Check className="h-3.5 w-3.5" style={{ color: "#22c55e" }} /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            {tokenCopied && (
              <p className="text-xs flex items-center gap-1.5" style={{ color: "#22c55e" }}>
                <Check className="h-3 w-3" /> URL copiée
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9d9db5" }}>
              Secret Token
            </Label>
            <div className="glass-light rounded-xl p-2 flex gap-2 items-center">
              <div className="relative flex-1">
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <Key className="h-3.5 w-3.5 shrink-0" style={{ color: "#ff6b35" }} />
                  <code className="text-xs font-mono truncate" style={{ color: showToken ? "#fcfcfc" : "#64647a" }}>
                    {showToken ? secretToken : "••••••••••••••••"}
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
                {copied ? <Check className="h-3.5 w-3.5" style={{ color: "#22c55e" }} /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0" onClick={generateToken}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            {copied && (
              <p className="text-xs flex items-center gap-1.5" style={{ color: "#22c55e" }}>
                <Check className="h-3 w-3" /> Token copié dans le presse-papier
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Boutique */}
      <div className="card-premium p-0">
        <div className="p-6 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="stat-icon w-10 h-10 rounded-xl">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ color: "#fcfcfc" }}>Boutique</h3>
              <p className="text-xs" style={{ color: "#64647a" }}>
                Personnalisez le nom de votre boutique
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="boutiqueName" className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9d9db5" }}>
              Nom de la boutique
            </Label>
            <Input
              id="boutiqueName"
              value={boutiqueName}
              onChange={(e) => setBoutiqueName(e.target.value)}
              placeholder="Ma Boutique"
              className="rounded-lg"
              style={{ background: "#0b0716", borderColor: "var(--border)", color: "#fcfcfc" }}
            />
          </div>
          <Button
            onClick={saveBoutiqueName}
            className="btn-gradient btn-glow gap-2 rounded-xl"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : null}
            {saving ? "Enregistrement..." : saved ? "Enregistré !" : "Enregistrer"}
          </Button>
        </div>
      </div>

      {/* Email */}
      <div className="card-premium p-0">
        <div className="p-6 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="stat-icon w-10 h-10 rounded-xl">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ color: "#fcfcfc" }}>Email</h3>
              <p className="text-xs" style={{ color: "#64647a" }}>
                Votre adresse email connectée à ce compte
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-3">
          <div className="glass-light rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--primaryDim)" }}>
              <Mail className="h-4 w-4" style={{ color: "#ff6b35" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "#fcfcfc" }}>{email}</p>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "#64647a" }}>Email principal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
