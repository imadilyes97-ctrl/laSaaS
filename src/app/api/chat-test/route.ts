import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { message, userId, conversationHistory } = await request.json()

    console.log("🤖 Chat test - message reçu:", message?.slice(0, 50))

    const { data: config } = await supabase
      .from('config_chatbot')
      .select('prompt_final, nom_chatbot, langue')
      .eq('user_id', userId)
      .single()

    const { data: produits } = await supabase
      .from('produits')
      .select('nom, prix, tailles, couleurs, stock')
      .eq('user_id', userId)
      .eq('actif', true)
      .gt('stock', 0)

    if (!process.env.DEEPSEEK_API_KEY) {
      console.error("❌ DEEPSEEK_API_KEY manquante")
      return NextResponse.json(
        { reply: "Je ne peux pas répondre — la clé API DeepSeek n'est pas configurée. Ajoutez DEEPSEEK_API_KEY dans les variables d'environnement." },
        { status: 200 }
      )
    }

    const systemPrompt = config?.prompt_final || `Tu es ${config?.nom_chatbot || 'Yasmine'}, une assistante commerciale. Tu aides les clients à commander des produits.`

    const produitsContext = produits?.length
      ? `\n\nProduits disponibles :\n${produits.map((p: any) => `- ${p.nom} : ${p.prix} DZD | Tailles: ${p.tailles?.join(',')} | Couleurs: ${p.couleurs?.join(',')}`).join('\n')}`
      : '\n\nAucun produit disponible pour le moment.'

    console.log("🔑 Appel DeepSeek API...")

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt + produitsContext
          },
          ...conversationHistory,
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error(`❌ DeepSeek API error (${response.status}):`, errText.slice(0, 500))
      return NextResponse.json(
        {
          reply: `Désolée, je n'ai pas pu répondre. (Erreur API: ${response.status})`,
          error: errText.slice(0, 500)
        },
        { status: 200 }
      )
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'Désolée, je n\'ai pas pu répondre.'

    console.log("✅ DeepSeek réponse reçue:", reply.slice(0, 80))

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('❌ Chat test error:', error)
    const errMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { reply: `Erreur de connexion: ${errMsg}` },
      { status: 200 }
    )
  }
}
