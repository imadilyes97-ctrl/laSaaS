/**
 * Module partagé pour l'analyse d'images avec Groq
 * Utilisé par les endpoints analyze-image et chatbot-analyze
 */

export async function analyzeImageWithGroq(imageUrl: string) {
  console.log('🔍 Analyse Groq pour:', imageUrl)

  const groqResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageUrl } },
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

  console.log('📡 Réponse Groq status:', groqResp.status)

  if (!groqResp.ok) {
    const errorText = await groqResp.text()
    console.error('❌ Erreur Groq:', errorText)
    return null
  }

  const groqData = await groqResp.json()
  console.log('📦 Réponse Groq complète:', groqData)

  const rawContent = groqData.choices?.[0]?.message?.content
  if (!rawContent) {
    console.error('⚠️ Réponse vide de Groq')
    return null
  }

  const cleaned = rawContent.replace(/```json|```/g, "").trim()
  return JSON.parse(cleaned)
}

export async function findMatchingProduct(
  clientDescription: any,
  supabase: any,
  userId: string
) {
  console.log('🔎 Recherche de produit correspondant pour:', clientDescription)

  const { data: produits } = await supabase
    .from("produits")
    .select("*")
    .eq("user_id", userId)
    .eq("actif", true)
    .gt("stock", 0)
    .order("nom")

  if (!produits || produits.length === 0) {
    console.log('⚠️ Aucun produit disponible')
    return { trouve: false, error: "Aucun produit disponible" }
  }

  console.log('📋 Produits disponibles:', produits.length)

  // Comparer avec chaque produit
  for (let i = 0; i < produits.length; i++) {
    const produit = produits[i]
    const prodDesc = produit.description_visuelle || {}

    // Calculer un score de correspondance simple
    let score = 0

    // Comparer le type
    if (prodDesc.type === clientDescription.type) score += 30
    else if (prodDesc.type?.includes(clientDescription.type)) score += 15
    else if (clientDescription.type?.includes(prodDesc.type)) score += 15

    // Comparer la couleur principale
    if (prodDesc.couleur_principale === clientDescription.couleur_principale) score += 25

    // Comparer les couleurs
    const commonColors = clientDescription.couleurs?.filter((c: string) =>
      prodDesc.couleurs?.includes(c)
    )
    if (commonColors?.length > 0) score += 15 * commonColors.length

    // Comparer la matière
    if (prodDesc.matiere === clientDescription.matiere) score += 20

    // Comparer le style
    if (prodDesc.style === clientDescription.style) score += 10

    console.log(`📊 Produit ${i}: ${produit.nom} - Score: ${score}`)

    if (score > 70) {
      console.log('✅ Correspondance trouvée:', produit.nom)
      return {
        trouve: true,
        index: i,
        similarite: score > 90 ? "exact" : "proche",
        produit: produits[i]
      }
    }
  }

  console.log('❌ Aucune correspondance trouvée')
  return { trouve: false, similarite: "non" }
}