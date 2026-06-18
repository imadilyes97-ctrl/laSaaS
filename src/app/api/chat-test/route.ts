import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { message, userId, conversationHistory } = await request.json()

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

    const systemPrompt = config?.prompt_final || `Tu es ${config?.nom_chatbot || 'Yasmine'}, une assistante commerciale. Tu aides les clients à commander des produits.`

    const produitsContext = produits?.length
      ? `\n\nProduits disponibles :\n${produits.map(p => `- ${p.nom} : ${p.prix} DZD | Tailles: ${p.tailles?.join(',')} | Couleurs: ${p.couleurs?.join(',')}`).join('\n')}`
      : '\n\nAucun produit disponible pour le moment.'

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
        max_tokens: 500
      })
    })

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'Désolée, je n\'ai pas pu répondre.'

    return NextResponse.json({ reply, success: true })
  } catch (error) {
    console.error('Chat test error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
