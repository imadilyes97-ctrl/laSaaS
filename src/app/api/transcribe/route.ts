import { NextResponse } from "next/server"
import { getSupabaseServiceClient } from "@/lib/supabase-service"
import { TranscribePayloadSchema } from "@/lib/schemas"

const supabase = getSupabaseServiceClient()

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validation avec Zod
    const result = TranscribePayloadSchema.safeParse(body)
    if (!result.success) {
      console.error('❌ Validation échouée:', result.error.flatten())
      return NextResponse.json(
        { error: "Payload invalide", details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { token, audioUrl, metaToken } = result.data

    // Vérifier le token
    const { data: config } = await supabase
      .from('config_chatbot')
      .select('user_id')
      .eq('secret_token', token)
      .single()

    if (!config) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }

    // Télécharger l'audio depuis Meta
    const audioResp = await fetch(audioUrl, {
      headers: { 'Authorization': `Bearer ${metaToken}` }
    })

    if (!audioResp.ok) {
      return NextResponse.json({ error: 'Impossible de télécharger l audio' }, { status: 400 })
    }

    const audioBuffer = await audioResp.arrayBuffer()
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mp4' })

    // Envoyer à Groq Whisper via FormData
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.mp4')
    formData.append('model', 'whisper-large-v3')
    formData.append('language', 'fr')
    formData.append('response_format', 'json')

    const groqResp = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: formData
    })

    const groqData = await groqResp.json()

    return NextResponse.json({
      text: groqData.text || 'Message vocal non compris.',
      success: true
    })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
