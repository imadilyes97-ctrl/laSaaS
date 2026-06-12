import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { photoUrl } = await request.json()

    if (!photoUrl) {
      return NextResponse.json({ error: "photoUrl requis" }, { status: 400 })
    }

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
              { type: "image_url", image_url: { url: photoUrl } },
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

    if (!groqResp.ok) {
      const errText = await groqResp.text()
      return NextResponse.json({ error: "Erreur Groq", details: errText }, { status: 502 })
    }

    const groqData = await groqResp.json()
    const rawContent = groqData.choices?.[0]?.message?.content

    if (!rawContent) {
      return NextResponse.json({ error: "Réponse vide de Groq" }, { status: 502 })
    }

    const cleaned = rawContent.replace(/```json|```/g, "").trim()
    const description = JSON.parse(cleaned)

    return NextResponse.json({ description })
  } catch (err) {
    return NextResponse.json(
      { error: "Erreur serveur", details: String(err) },
      { status: 500 }
    )
  }
}
