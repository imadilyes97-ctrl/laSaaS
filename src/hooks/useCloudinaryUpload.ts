"use client"

import { useState, useCallback } from "react"

interface UploadState {
  uploading: boolean
  progress: number
  error: string
  url: string
}

interface UseCloudinaryUploadReturn {
  upload: (file: File) => Promise<string>
  state: UploadState
  reset: () => void
}

export function useCloudinaryUpload(): UseCloudinaryUploadReturn {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: "",
    url: "",
  })

  const reset = useCallback(() => {
    setState({ uploading: false, progress: 0, error: "", url: "" })
  }, [])

  const upload = useCallback(async (file: File): Promise<string> => {
    setState({ uploading: true, progress: 0, error: "", url: "" })

    try {
      // 1. Récupérer la signature
      const signRes = await fetch("/api/cloudinary/sign", { method: "POST" })
      if (!signRes.ok) {
        const err = await signRes.json()
        throw new Error(err.error || "Erreur de signature Cloudinary")
      }

      const { signature, timestamp, folder, cloudName, apiKey, uploadPreset } = await signRes.json()

      if (!cloudName || !apiKey) {
        throw new Error("Configuration Cloudinary manquante. Vérifiez vos variables d'environnement.")
      }

      // 2. Upload direct vers Cloudinary via XHR (progress réel)
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`

      const formData = new FormData()
      formData.append("file", file)
      formData.append("api_key", apiKey)
      formData.append("timestamp", String(timestamp))
      formData.append("signature", signature)
      formData.append("folder", folder)
      if (uploadPreset) {
        formData.append("upload_preset", uploadPreset)
      }

      const uploadResult = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("POST", url)

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100)
            setState((prev) => ({ ...prev, progress: pct }))
          }
        })

        xhr.addEventListener("load", () => {
          try {
            const result = JSON.parse(xhr.responseText)
            if (result.error) {
              reject(new Error(result.error.message || "Erreur Cloudinary"))
              return
            }
            resolve(result.secure_url as string)
          } catch {
            reject(new Error("Réponse Cloudinary invalide"))
          }
        })

        xhr.addEventListener("error", () => {
          reject(new Error("Erreur réseau lors de l'upload Cloudinary"))
        })

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload annulé"))
        })

        xhr.send(formData)
      })

      setState({ uploading: false, progress: 100, error: "", url: uploadResult })
      return uploadResult
    } catch (err: any) {
      const message = err?.message || "Erreur lors de l'upload"
      setState((prev) => ({ ...prev, uploading: false, progress: 0, error: message, url: "" }))
      return ""
    }
  }, [])

  return { upload, state, reset }
}
