import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  // Vérification du token contre la table config_chatbot (comme le chatbot)
  if (!token) {
    return NextResponse.json({ error: "Token requis" }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()

  // Chercher le user_id par secret_token
  const { data: config, error: configError } = await supabase
    .from('config_chatbot')
    .select('user_id')
    .eq('secret_token', token)
    .eq('actif', true)
    .single()

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
      .not("photo_url", "eq", "")

    if (error) {
      console.error("Erreur lors de la récupération des produits:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des produits" }, { status: 500 })
    }

    if (!produits || produits.length === 0) {
      return NextResponse.json({ message: "Aucun produit avec photo_url trouvé" }, { status: 200 })
    }

    let updatedCount = 0
    let errorCount = 0

    // Analyser chaque produit
    for (const produit of produits) {
      try {
        console.log(`Analyse du produit ${produit.id}: ${produit.photo_url}`)

        // Appeler l'API Groq pour analyser l'image
        const groqResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.2-11b-vision-preview",
            messages: [
              {
                role: "user",
                content: [
                  { type: "image_url", image_url: { url: produit.photo_url } },
                  {
                    type: "text",
                    text: `Décris ce produit en JSON:
{
  "type": "type de vêtement ou produit",
  "couleur_principale": "couleur dominante",
  "couleurs": ["toutes les couleurs visibles"],
  "matiere": "tissu ou matière apparente",
  "style": "style vestimentaire",
  "details_visuels": "détails importants comme logo, broderie, coupe, etc.",
  "mots_cles": ["mot1", "mot2", "mot3"]
}
Réponds UNIQUEMENT avec le JSON.`,
                  },
                ],
              },
            ],
            max_tokens: 400,
          }),
        })

        console.log(`Réponse Groq status pour produit ${produit.id}:`, groqResp.status)

        if (!groqResp.ok) {
          const errText = await groqResp.text()
          console.error(`Erreur Groq pour produit ${produit.id}:`, errText)
          errorCount++
          continue
        }

        const groqData = await groqResp.json()
        console.log(`Réponse Groq data pour produit ${produit.id}:`, groqData)

        const rawContent = groqData.choices?.[0]?.message?.content

        if (!rawContent) {
          console.error(`Réponse vide de Groq pour produit ${produit.id}`)
          errorCount++
          continue
        }

        const cleaned = rawContent.replace(/```json|```/g, "").trim()
        const description = JSON.parse(cleaned)

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
      erreurs: errorCount
    }, { status: 200 })

  } catch (err) {
    console.error("Erreur serveur:", err)
    return NextResponse.json(
      { error: "Erreur serveur", details: String(err) },
      { status: 500 }
    )
  }
}