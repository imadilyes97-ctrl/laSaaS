/**
 * Module partagé pour l'analyse d'images avec Groq
 * Utilisé par les endpoints analyze-image et chatbot-analyze
 */

import { GroqCache } from "./cache"
import { fetchWithTimeout } from "./fetch-with-timeout"
import { Product } from "./types"

export async function analyzeImageWithGroq(imageUrl: string) {
  console.log('🔍 Analyse Groq pour:', imageUrl)

  // Utiliser le cache pour éviter les appels API répétitifs
  return GroqCache.getOrFetch(imageUrl, async () => {
    try {
      const groqResp = await fetchWithTimeout(
        "https://api.groq.com/openai/v1/chat/completions",
        {
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
        },
        30000 // 30 secondes de timeout
      )

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
    } catch (error) {
      console.error('⚠️ Erreur lors de l\'appel Groq:', error)
      return null
    }
  })
}

function motsEnCommun(a: string, b: string): number {
  const motsA = new Set(a.toLowerCase().split(/\s+/))
  const motsB = new Set(b.toLowerCase().split(/\s+/))
  let communs = 0
  for (const m of motsA) {
    if (motsB.has(m)) communs++
  }
  return communs
}

function normaliser(v: string): string {
  return v?.toLowerCase().trim().replace(/[^a-z0-9]/g, "") || ""
}

export async function findMatchingProduct(
  clientDescription: any,
  supabase: any,
  userId: string,
  pageSize = 50
) {
  console.log('🔎 Recherche de produit correspondant pour:', clientDescription)

  let bestScore = 0
  let bestMatch: any = null
  let offset = 0
  let hasMore = true

  // Pagination pour éviter de charger tous les produits en mémoire
  while (hasMore) {
    const { data: produits, error } = await supabase
      .from("produits")
      .select("*")
      .eq("user_id", userId)
      .eq("actif", true)
      .gt("stock", 0)
      .order("nom")
      .range(offset, offset + pageSize - 1)
      .returns<Product[]>()

    if (error) {
      console.error('❌ Erreur Supabase:', error)
      return { trouve: false, error: "Erreur de base de données" }
    }

    if (!produits || produits.length === 0) {
      hasMore = false
      if (offset === 0) {
        console.log('⚠️ Aucun produit disponible')
        return { trouve: false, error: "Aucun produit disponible" }
      }
      break
    }

    console.log(`📋 Traitement de la page ${Math.floor(offset/pageSize) + 1}: ${produits.length} produits`)

    // Traiter chaque produit de la page
    for (let i = 0; i < produits.length; i++) {
      const produit = produits[i]
      const prodDesc = produit.description_visuelle || {}
      let score = 0

      const clientType = normaliser(clientDescription.type || "")
      const prodType = normaliser(prodDesc.type || "")

      if (clientType && prodType) {
        if (clientType === prodType) score += 30
        else if (clientType.includes(prodType) || prodType.includes(clientType)) score += 20
        else if (motsEnCommun(clientType, prodType) > 0) score += 10
      }

      const clientCouleur = normaliser(clientDescription.couleur_principale || "")
      const prodCouleur = normaliser(prodDesc.couleur_principale || "")

      if (clientCouleur && prodCouleur && clientCouleur === prodCouleur) score += 25

      const clientCouleurs = (clientDescription.couleurs || []).map((c: string) => normaliser(c))
      const prodCouleurs = (prodDesc.couleurs || []).map((c: string) => normaliser(c))
      const communs = clientCouleurs.filter((c: string) => prodCouleurs.includes(c))
      score += Math.min(communs.length, 3) * 10

      const clientMatiere = normaliser(clientDescription.matiere || "")
      const prodMatiere = normaliser(prodDesc.matiere || "")
      if (clientMatiere && prodMatiere && (clientMatiere === prodMatiere || clientMatiere.includes(prodMatiere) || prodMatiere.includes(clientMatiere))) score += 20

      const clientStyle = normaliser(clientDescription.style || "")
      const prodStyle = normaliser(prodDesc.style || "")
      if (clientStyle && prodStyle && (clientStyle === prodStyle || clientStyle.includes(prodStyle) || prodStyle.includes(clientStyle))) score += 10

      if (produit.nom && clientDescription.type) {
        const clientMots = clientDescription.type.toLowerCase().split(/\s+/)
        for (const mot of clientMots) {
          if (mot.length > 2 && produit.nom.toLowerCase().includes(mot)) {
            score += 5
            break
          }
        }
      }

      console.log(`📊 Produit ${offset + i}: ${produit.nom} - Score: ${score}`)

      if (score > bestScore) {
        bestScore = score
        bestMatch = { index: offset + i, produit, score }

        // Early exit si score excellent
        if (bestScore >= 90) {
          console.log('🚀 Correspondance excellente trouvée en early exit:', produit.nom)
          return {
            trouve: true,
            index: bestMatch.index,
            similarite: "exact",
            produit: bestMatch.produit
          }
        }
      }
    }

    offset += pageSize
    hasMore = produits.length === pageSize
  }

  const SEUIL = 40
  if (bestMatch && bestMatch.score >= SEUIL) {
    console.log('✅ Correspondance trouvée:', bestMatch.produit.nom, `Score: ${bestMatch.score}`)
    return {
      trouve: true,
      index: bestMatch.index,
      similarite: bestMatch.score > 70 ? "exact" : "proche",
      produit: bestMatch.produit
    }
  }

  console.log('❌ Aucune correspondance trouvée (meilleur score: ' + bestScore + ')')
  return { trouve: false, similarite: "non", bestScore }
}