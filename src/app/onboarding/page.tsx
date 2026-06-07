"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Check, Store, ImageUp, Bot, ArrowRight, ArrowLeft, Package, LogOut } from "lucide-react"
import Link from "next/link"

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [boutiqueName, setBoutiqueName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [productName, setProductName] = useState("")
  const [productPrice, setProductPrice] = useState("")
  const [productStock, setProductStock] = useState("10")
  const [secretToken, setSecretToken] = useState("")
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const checkProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("boutique_name, secret_token")
        .eq("id", user.id)
        .single()
      if (profile?.boutique_name) {
        router.push("/dashboard")
        return
      }
      if (profile?.secret_token) setSecretToken(profile.secret_token)
      setChecked(true)
    }
    checkProfile()
  }, [router])

  const uploadLogo = async (file: File) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ""

    const ext = file.name.split(".").pop()
    const path = `logos/${user.id}/logo.${ext}`
    await supabase.storage.from("produits").upload(path, file, { upsert: true })
    const { data: urlData } = supabase.storage.from("produits").getPublicUrl(path)
    return urlData?.publicUrl || ""
  }

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadLogo(file)
    if (url) setLogoUrl(url)
  }

  const handleFinish = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from("profiles")
      .update({ boutique_name: boutiqueName })
      .eq("id", user.id)

    if (productName) {
      await supabase.from("produits").insert({
        user_id: user.id,
        nom: productName,
        prix: Number(productPrice) || 0,
        stock: Number(productStock) || 10,
        actif: true,
      })
    }

    setLoading(false)
    router.push("/dashboard")
    router.refresh()
  }

  if (!checked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Vérification...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-2.5 h-2.5 rounded-full ${
                    s <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
          <CardTitle className="text-2xl">Bienvenue sur YasmineStack</CardTitle>
          <CardDescription>
            Configurez votre boutique en quelques étapes
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <Store className="h-12 w-12 mx-auto text-primary mb-2" />
                <h3 className="font-semibold">Nom de votre boutique</h3>
                <p className="text-sm text-muted-foreground">
                  Comment s&apos;appelle votre boutique ?
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="boutique">Nom de la boutique</Label>
                <Input
                  id="boutique"
                  value={boutiqueName}
                  onChange={(e) => setBoutiqueName(e.target.value)}
                  placeholder="Ma Belle Boutique"
                />
              </div>
              <div className="space-y-2">
                <Label>Logo (optionnel)</Label>
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-16 h-16 object-cover rounded-lg" />
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      <ImageUp className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
                  <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                    Upload logo
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <Package className="h-12 w-12 mx-auto text-primary mb-2" />
                <h3 className="font-semibold">Premier produit</h3>
                <p className="text-sm text-muted-foreground">
                  Ajoutez votre premier produit (optionnel)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prodName">Nom du produit</Label>
                <Input
                  id="prodName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ex: Robe d'été"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prodPrice">Prix (DA)</Label>
                  <Input
                    id="prodPrice"
                    type="number"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prodStock">Stock initial</Label>
                  <Input
                    id="prodStock"
                    type="number"
                    value={productStock}
                    onChange={(e) => setProductStock(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <Bot className="h-12 w-12 mx-auto text-primary mb-2" />
                <h3 className="font-semibold">Votre token d&apos;accès</h3>
                <p className="text-sm text-muted-foreground">
                  Ce token unique connecte votre chatbot au dashboard
                </p>
              </div>
              <div className="space-y-2">
                <Label>Secret Token</Label>
                <div className="flex gap-2">
                  <Input value={secretToken} readOnly className="font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(secretToken)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                {copied && <p className="text-xs text-green-600">Copié !</p>}
              </div>
              <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                <p className="font-medium">Étapes pour connecter N8n :</p>
                <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                  <li>Créez un webhook POST dans N8n</li>
                  <li>Utilisez l&apos;URL : <code className="text-xs">/api/webhook</code></li>
                  <li>Ajoutez le token dans le body</li>
                  <li>Connectez Messenger à N8n</li>
                </ol>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg">Configuration terminée !</h3>
              <p className="text-sm text-muted-foreground">
                Votre boutique est prête. Vous pouvez maintenant gérer vos produits, voir vos commandes et configurer votre chatbot.
              </p>
              <div className="flex justify-center gap-2 text-sm text-muted-foreground">
                <Link href="/dashboard" className="text-primary underline-offset-4 hover:underline">
                  Aller au dashboard
                </Link>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => { createClient().auth.signOut(); router.push("/auth/login") }}>
              <LogOut className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          )}
          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !boutiqueName}
            >
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={loading}>
              {loading ? "Configuration..." : "Terminer"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
