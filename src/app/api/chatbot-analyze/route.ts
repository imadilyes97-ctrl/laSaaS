import { NextResponse } from "next/server"
import { getSupabaseServiceClient } from "@/lib/supabase-service"
import { analyzeImageWithGroq, findMatchingProduct } from "@/lib/groq-analyzer"
import { ChatbotAnalyzeSchema } from "@/lib/schemas"
import { ChatbotConfig, Product } from "@/lib/types"

const supabase = getSupabaseServiceClient()

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validation avec Zod
    const result = ChatbotAnalyzeSchema.safeParse(body)
    if (!result.success) {
      console.error('❌ Validation échouée:', result.error.flatten())
      return NextResponse.json(
        { error: "Payload invalide", details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { token, imageUrl } = result.data

    const { data: config, error: configError } = await supabase
      .from("config_chatbot")
      .select("user_id")
      .eq("secret_token", token)
      .eq("actif", true)
      .single<ChatbotConfig>()

    if (configError || !config) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 })
    }

    const clientDescription = await analyzeImageWithGroq(imageUrl)
    if (!clientDescription) {
      return NextResponse.json({ error: "Impossible d'analyser l'image" }, { status: 502 })
    }

    const { data: produits } = await (supabase.from("produits") as any)
      .select("id, nom, description, photo_url, prix, devise, tailles, couleurs, stock, description_visuelle")
      .eq("user_id", config.user_id)
      .eq("actif", true)
      .gt("stock", 0)
      .order("nom")

    if (!produits || produits.length === 0) {
      return NextResponse.json({ trouve: false, error: "Aucun produit disponible" })
    }

    console.log('🔎 Recherche de produit correspondant...')
    const matchResult = await findMatchingProduct(clientDescription, supabase, config.user_id)

    if (!matchResult.trouve) {
      console.log('⚠️ Aucun produit correspondant')
      return NextResponse.json({
        trouve: false,
        similarite: matchResult.similarite,
        clientDescription,
        message: "Aucun produit ne correspond à cette image"
      })
    }

    console.log('✅ Produit trouvé:', matchResult.produit?.nom)
    return NextResponse.json({
      trouve: true,
      similarite: matchResult.similarite,
      produit: matchResult.produit,
      clientDescription
    })
  } catch (err) {
    return NextResponse.json(
      { error: "Erreur serveur", details: String(err) },
      { status: 500 }
    )
  }
}
