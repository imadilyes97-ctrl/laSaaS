import { NextResponse } from "next/server"
import { getSupabaseServiceClient } from "@/lib/supabase-service"
import { analyzeImageWithGroq } from "@/lib/groq-analyzer"
import { ChatbotConfig, Product } from "@/lib/types"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  // Vérification du token contre la table config_chatbot (comme le chatbot)
  if (!token) {
    return NextResponse.json({ error: "Token requis" }, { status: 401 })
  }

  const supabase = getSupabaseServiceClient()

  // Chercher le user_id par secret_token
  const { data: config, error: configError } = await supabase
    .from('config_chatbot')
    .select('user_id')
    .eq('secret_token', token)
    .eq('actif', true)
    .single<ChatbotConfig>()

  if (configError || !config) {
    console.log("Token invalide ou config introuvable:", configError?.message)
    return NextResponse.json({ error: "Token invalide" }, { status: 401 })
  }

  try {
    // Récupérer les produits de ce user_id uniquement
    const { data: produits, error } = await supabase
      .from("produits")
      .select("*")
      .eq("user_id", config.user_id)
      .not("photo_url", "is", null)
      .not("photo_url", "eq", "") as { data: Product[], error: any }

    if (error) {
      console.error("Erreur lors de la récupération des produits:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des produits" }, { status: 500 })
    }

    if (!produits || produits.length === 0) {
      return NextResponse.json({ message: "Aucun produit avec photo_url trouvé" }, { status: 200 })
    }

    let updatedCount = 0
    let errorCount = 0
    const erreurs_details: string[] = []

    // Analyser chaque produit
    for (const produit of produits) {
      try {
        console.log(`Analyse du produit ${produit.id}: ${produit.photo_url}`)

        // Utiliser la fonction partagée avec cache
        const clientDescription = await analyzeImageWithGroq(produit.photo_url)

        if (!clientDescription) {
          console.error(`❌ Échec de l'analyse Groq pour produit ${produit.id}`)
          errorCount++
          erreurs_details.push(`Produit #${produit.id} ${produit.nom}: Échec de l'analyse Groq`)
          continue
        }

        const description = clientDescription

        // Mettre à jour le produit avec la description visuelle
        const { error: updateError } = await supabase
          .from("produits")
          .update({ description_visuelle: description })
          .eq("id", produit.id)

        if (updateError) {
          console.error(`Erreur lors de la mise à jour du produit ${produit.id}:`, updateError)
          errorCount++
        } else {
          console.log(`Produit ${produit.id} mis à jour avec succès`)
          updatedCount++
        }

      } catch (err) {
        console.error(`Erreur lors de l'analyse du produit ${produit.id}:`, err)
        errorCount++
      }
    }

    return NextResponse.json({
      message: "Analyse terminée",
      produits_totaux: produits.length,
      produits_mis_a_jour: updatedCount,
      erreurs: errorCount,
      details_erreurs: erreurs_details
    }, { status: 200 })

  } catch (err) {
    console.error("Erreur serveur:", err)
    return NextResponse.json(
      { error: "Erreur serveur", details: String(err) },
      { status: 500 }
    )
  }
}