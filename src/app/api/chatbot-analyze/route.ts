import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function analyzeImageWithGroq(imageUrl: string) {
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

  if (!groqResp.ok) return null

  const groqData = await groqResp.json()
  const rawContent = groqData.choices?.[0]?.message?.content
  if (!rawContent) return null

  const cleaned = rawContent.replace(/```json|```/g, "").trim()
  return JSON.parse(cleaned)
}

function buildPrompt(clientDescription: unknown, produits: unknown[]) {
  return `Client cherche : ${JSON.stringify(clientDescription)}

Produits disponibles :
${(produits as any[])
  .map(
    (p) =>
      `- ${p.nom} | Prix: ${p.prix} DZD | Tailles: ${(p.tailles || []).join(",")}  Description visuelle: ${JSON.stringify(p.description_visuelle)}`
  )
  .join("\n")}

Trouve le produit qui correspond le mieux.
Réponds en JSON: { "trouve": true/false, "index": 0, "similarite": "exact/proche/non" }`
}

export async function POST(request: Request) {
  try {
    const { token, imageUrl } = await request.json()

    if (!token || !imageUrl) {
      return NextResponse.json({ error: "token et imageUrl requis" }, { status: 400 })
    }

    const { data: config, error: configError } = await supabase
      .from("config_chatbot")
      .select("user_id")
      .eq("secret_token", token)
      .eq("actif", true)
      .single()

    if (configError || !config) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 })
    }

    const clientDescription = await analyzeImageWithGroq(imageUrl)
    if (!clientDescription) {
      return NextResponse.json({ error: "Impossible d'analyser l'image" }, { status: 502 })
    }

    const { data: produits } = await supabase
      .from("produits")
      .select("id, nom, description, photo_url, prix, devise, tailles, couleurs, stock, description_visuelle")
      .eq("user_id", config.user_id)
      .eq("actif", true)
      .gt("stock", 0)
      .order("nom")

    if (!produits || produits.length === 0) {
      return NextResponse.json({ trouve: false, error: "Aucun produit disponible" })
    }

    const prompt = buildPrompt(clientDescription, produits)

    const llmResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
      }),
    })

    if (!llmResp.ok) {
      return NextResponse.json({ error: "Erreur LLM comparaison" }, { status: 502 })
    }

    const llmData = await llmResp.json()
    const rawMatch = llmData.choices?.[0]?.message?.content
    const cleanedMatch = rawMatch.replace(/```json|```/g, "").trim()
    const match = JSON.parse(cleanedMatch)

    const result: any = {
      ...match,
      clientDescription,
    }

    if (match.trouve && typeof match.index === "number" && produits[match.index]) {
      result.produit = produits[match.index]
    }

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: "Erreur serveur", details: String(err) },
      { status: 500 }
    )
  }
}
