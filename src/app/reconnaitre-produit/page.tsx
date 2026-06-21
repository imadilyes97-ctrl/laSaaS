"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Camera, Upload, Search, Package, Loader2, CheckCircle2, XCircle, Clock, Info } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading"
import { StepProgress } from "@/components/ui/progress"
import { Progress } from "@/components/ui/progress"

export default function ReconnaitreProduitPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [history, setHistory] = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const steps = ["Upload", "Analyse IA", "Recherche", "Résultat"]

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
    setProgress(0)
    setCurrentStep(0)

    try {
      // Étape 1: Upload
      setCurrentStep(1)
      setProgress(25)

      const formData = new FormData()
      formData.append("file", file)

      const uploadResp = await fetch("/api/upload-temp", { method: "POST", body: formData })
      const uploadData = await uploadResp.json()
      if (!uploadResp.ok) throw new Error(uploadData.error)

      // Étape 2: Analyse IA
      setCurrentStep(2)
      setProgress(50)

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

      // Étape 3: Résultat
      setCurrentStep(3)
      setProgress(100)

      // Sauvegarder dans l'historique
      const newHistory = [
        {
          file: preview,
          result: data,
          timestamp: new Date().toISOString()
        },
        ...history
      ].slice(0, 5)
      setHistory(newHistory)
      localStorage.setItem('searchHistory', JSON.stringify(newHistory))

      setResult(data)
    } catch (err: any) {
      setError(err.message)
      setCurrentStep(0)
      setProgress(0)
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
              <div className="relative group">
                <img src={preview} alt="Prévisualisation" className="max-h-64 mx-auto rounded-lg group-hover:scale-105 transition-transform duration-300" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setPreview("")
                    setFile(null)
                  }}
                  className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1 transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Supprimer l'image"
                >
                  <XCircle className="w-5 h-5" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {file?.name || 'Image sélectionnée'}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="relative">
                  <Camera className="h-12 w-12 text-[#ff6b35]" />
                  <div className="absolute inset-0 bg-[#ff6b35]/10 rounded-full blur-xl animate-pulse"></div>
                </div>
                <p className="font-medium">Cliquez pour prendre une photo ou uploader</p>
                <p className="text-xs text-muted-foreground/70">Formats supportés: JPG, PNG, WEBP</p>
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
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <LoadingSpinner />
                <span>Analyse en cours...</span>
              </div>
              <StepProgress steps={steps} currentStep={currentStep} />
              <Progress value={progress} max={100} />
            </div>
          )}

          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}

          {result && (
            <div className="space-y-4">
              <Card className={result.trouve ? "border-green-500/50 bg-green-500/5" : "border-yellow-500/50 bg-yellow-500/5"}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 font-semibold">
                    {result.trouve ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-green-700">✅ Produit trouvé !</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-yellow-600" />
                        <span className="text-yellow-700">❌ Aucun produit trouvé</span>
                      </>
                    )}
                  </div>

                  {result.trouve ? (
                    <div className="space-y-3">
                      <div className="flex gap-4 items-start">
                        {result.produit.photo_url && (
                          <div className="relative group">
                            <img
                              src={result.produit.photo_url}
                              alt={result.produit.nom}
                              className="w-24 h-24 rounded-lg object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{result.produit.nom}</p>
                          {result.produit.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {result.produit.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xl font-bold text-[#ff6b35]">
                              {result.produit.prix} {result.produit.devise}
                            </span>
                            <span className={`text-sm font-medium ${result.produit.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {result.produit.stock > 0 ? `✓ En stock (${result.produit.stock})` : "✗ Rupture de stock"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#120f1e] rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-4 h-4 text-[#ff6b35]" />
                          <span className="font-medium text-[#ff6b35]">Détails de correspondance</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                          <div>
                            <span className="text-[#a0a0b8]">Type:</span>
                            <span className="font-medium">{result.clientDescription?.type || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[#a0a0b8]">Couleur:</span>
                            <span className="font-medium">{result.clientDescription?.couleur_principale || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[#a0a0b8]">Matière:</span>
                            <span className="font-medium">{result.clientDescription?.matiere || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[#a0a0b8]">Style:</span>
                            <span className="font-medium">{result.clientDescription?.style || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <p className="text-yellow-600 font-medium">
                        Ce produit n&apos;est pas dans notre catalogue
                      </p>
                      <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-700">
                        <p className="font-medium mb-1">Suggestions:</p>
                        <ul className="space-y-1 text-left">
                          <li className="flex items-start gap-2">
                            <span className="mt-0.5">•</span>
                            <span>Vérifiez que la photo est claire et montre bien le produit</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-0.5">•</span>
                            <span>Essayez une autre photo sous un angle différent</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-0.5">•</span>
                            <span>Contactez le support si vous pensez que ce produit devrait être reconnu</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Historique des recherches */}
              {history.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-[#fcfcfc] flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Historique récent
                  </h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {history.map((item, index) => (
                      <div
                        key={index}
                        className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-[rgba(255,107,53,0.12)] cursor-pointer hover:border-[#ff6b35] transition-all"
                        onClick={() => {
                          setPreview(item.file)
                          setFile(null)
                          setResult(item.result)
                        }}
                      >
                        <img
                          src={item.file}
                          alt={`Historique ${index}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-medium">Voir</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
