"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

export default function SettingsPage() {
  const [secretToken, setSecretToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [boutiqueName, setBoutiqueName] = useState("")
  const [email, setEmail] = useState("")
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

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

  const saveBoutiqueName = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from("profiles")
      .update({ boutique_name: boutiqueName })
      .eq("id", user.id)

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const [webhookUrl, setWebhookUrl] = useState("")
  
  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/webhook`)
  }, [])

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez votre boutique et vos identifiants
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhook N8n</CardTitle>
          <CardDescription>
            Utilisez ce token et cette URL pour connecter N8n à votre dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL du Webhook</Label>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-xs" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl)
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Secret Token</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={secretToken}
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
                  {showToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button variant="outline" size="icon" onClick={copyToken}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={generateToken}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            {copied && (
              <p className="text-xs text-green-600">Copié !</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Boutique</CardTitle>
          <CardDescription>
            Personnalisez le nom de votre boutique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="boutiqueName">Nom de la boutique</Label>
            <Input
              id="boutiqueName"
              value={boutiqueName}
              onChange={(e) => setBoutiqueName(e.target.value)}
              placeholder="Ma Boutique"
            />
          </div>
          <Button onClick={saveBoutiqueName}>
            {saved ? "Enregistré !" : "Enregistrer"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
          <CardDescription>
            Votre adresse email connectée à ce compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input value={email} readOnly className="max-w-sm" />
        </CardContent>
      </Card>
    </div>
  )
}
