import { NextResponse } from "next/server"
import { getSupabaseServiceClient } from "@/lib/supabase-service"
import { TranscribePayloadSchema } from "@/lib/schemas"
import OpenAI from "openai"
import fs from "fs"
import os from "os"
import path from "path"

const supabase = getSupabaseServiceClient()

// Client Groq compatible OpenAI SDK
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null
  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validation avec Zod
    const result = TranscribePayloadSchema.safeParse(body)
    if (!result.success) {
      console.error("❌ Validation échouée:", result.error.flatten())
      return NextResponse.json(
        { error: "Payload invalide", details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { token, audioUrl, metaToken } = result.data

    // Vérifier le token
    const { data: config } = await supabase
      .from("config_chatbot")
      .select("user_id")
      .eq("secret_token", token)
      .single()

    if (!config) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 })
    }

    console.log(`[Transcribe] Downloading audio from Meta CDN...`)

    // Télécharger l'audio depuis Meta
    const audioResp = await fetch(audioUrl, {
      headers: { Authorization: `Bearer ${metaToken}` },
    })

    if (!audioResp.ok) {
      console.error(`[Transcribe] Meta CDN download failed: ${audioResp.status}`)
      return NextResponse.json(
        { error: "Impossible de télécharger l audio" },
        { status: 400 }
      )
    }

    const audioBuffer = await audioResp.arrayBuffer()
    const audioBytes = Buffer.from(audioBuffer)
    console.log(`[Transcribe] Audio downloaded: ${audioBytes.length} bytes`)

    // Déterminer le format réel depuis le Content-Type de la réponse
    const contentType = audioResp.headers.get("content-type") || ""
    let format = "mp4"
    if (contentType.includes("ogg") || contentType.includes("opus")) format = "ogg"
    else if (contentType.includes("wav") || contentType.includes("wave")) format = "wav"
    else if (contentType.includes("m4a") || contentType.includes("mp4")) format = "m4a"
    else if (contentType.includes("webm")) format = "webm"
    else if (contentType.includes("mp3")) format = "mp3"
    else if (contentType.includes("aac")) format = "aac"
    else if (contentType.includes("flac")) format = "flac"
    // Fallback : détection par extension dans l'URL
    else if (audioUrl.includes(".ogg")) format = "ogg"
    else if (audioUrl.includes(".wav")) format = "wav"
    else if (audioUrl.includes(".mp3")) format = "mp3"
    else if (audioUrl.includes(".m4a")) format = "m4a"
    else if (audioUrl.includes(".webm")) format = "webm"

    console.log(`[Transcribe] Detected format: ${format}, content-type: ${contentType}`)

    // Sauvegarder temporairement sur le disque pour l'envoyer à Groq
    const tmpFile = path.join(os.tmpdir(), `audio_${Date.now()}.${format}`)
    fs.writeFileSync(tmpFile, audioBytes)

    try {
      // Utiliser le SDK OpenAI avec l'URL de Groq
      const groq = getGroqClient()
      if (!groq) {
        return NextResponse.json({ error: "GROQ_API_KEY non configurée" }, { status: 500 })
      }

      console.log(`[Transcribe] Sending to Groq Whisper (whisper-large-v3-turbo)...`)

      const result = await groq.audio.transcriptions.create({
        model: "whisper-large-v3-turbo",
        file: fs.createReadStream(tmpFile),
        language: "fr",
        response_format: "json",
      })

      const transcription = result.text?.trim() || ""
      console.log(`[Transcribe] Groq transcription: "${transcription.substring(0, 120)}..."`)

      return NextResponse.json({
        text: transcription || "Message vocal non compris.",
        success: true,
      })
    } finally {
      // Nettoyer le fichier temporaire
      try {
        fs.unlinkSync(tmpFile)
      } catch (_) {}
    }
  } catch (error) {
    console.error("[Transcribe] Error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
