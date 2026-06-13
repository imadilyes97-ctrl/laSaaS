"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Camera, Upload, Search, Package, Loader2 } from "lucide-react"

export default function ReconnaitreProduitPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError("")
  }

  const handleSearch = async () => {
    if (!file) return
    setLoading(true)
    setError("")

    try {
      // 1. Upload la photo vers Supabase
      const formData = new FormData()
      formData.append("file", file)

      const uploadResp = await fetch("/api/upload-temp", { method: "POST", body: formData })
      const uploadData = await uploadResp.json()
      if (!uploadResp.ok) throw new Error(uploadData.error)

      // 2. Analyser avec Groq et chercher le produit
      const resp = await fetch("/api/chatbot-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: new URLSearchParams(window.location.search).get("token") || "",
          imageUrl: uploadData.url
        })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error)

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">📸 Reconnaître un produit</CardTitle>
          <CardDescription>
            Prenez ou upload une photo d&apos;un produit pour voir s&apos;il est disponible
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition"
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
            {preview ? (
              <img src={preview} alt="Prévisualisation" className="max-h-64 mx-auto rounded-lg" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Camera className="h-12 w-12" />
                <p>Cliquez pour prendre une photo ou uploader</p>
              </div>
            )}
          </div>

          {file && !loading && (
            <Button onClick={handleSearch} className="w-full gap-2" size="lg">
              <Search className="h-4 w-4" />
              Rechercher le produit
            </Button>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyse en cours...
            </div>
          )}

          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}

          {result && (
            <div className="space-y-3">
              {result.trouve ? (
                <Card className="border-green-500">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-green-600 font-semibold">
                      <Package className="h-5 w-5" />
                      ✅ Produit trouvé !
                    </div>
                    <div className="flex gap-4">
                      {result.produit.photo_url && (
                        <img
                          src={result.produit.photo_url}
                          alt={result.produit.nom}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-semibold">{result.produit.nom}</p>
                        <p className="text-sm text-muted-foreground">{result.produit.description}</p>
                        <p className="text-lg font-bold mt-1">
                          {result.produit.prix} {result.produit.devise}
                        </p>
                        <p className="text-sm text-green-600">
                          {result.produit.stock > 0 ? `En stock (${result.produit.stock})` : "Rupture"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-yellow-500">
                  <CardContent className="p-4 text-center">
                    <p className="text-yellow-600 font-semibold">❌ Aucun produit trouvé</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ce produit n&apos;est pas dans notre catalogue
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
