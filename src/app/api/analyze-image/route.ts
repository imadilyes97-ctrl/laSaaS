import { NextResponse } from "next/server"
import { analyzeImageWithGroq } from "@/lib/groq-analyzer"

export async function POST(request: Request) {
  try {
    const { photoUrl } = await request.json()

    console.log('📤 Reçu demande d\'analyse pour:', photoUrl)

    if (!photoUrl) {
      console.log('❌ photoUrl manquant')
      return NextResponse.json({ error: "photoUrl requis" }, { status: 400 })
    }

    // Utiliser la fonction partagée qui fonctionne (même code que le chatbot)
    const description = await analyzeImageWithGroq(photoUrl)

    if (!description) {
      console.error('❌ Échec de l\'analyse Groq')
      return NextResponse.json(
        { error: "Impossible d\'analyser l\'image avec Groq" },
        { status: 502 }
      )
    }

    console.log('✅ Analyse réussie:', description)
    return NextResponse.json({ description })

  } catch (err) {
    console.error('⚠️ Erreur serveur:', err)
    return NextResponse.json(
      { error: "Erreur serveur", details: String(err) },
      { status: 500 }
    )
  }
}
