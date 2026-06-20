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

    if (!process.env.DEEPSEEK_API_KEY) {
      console.error('❌ DEEPSEEK_API_KEY is not configured')
      return NextResponse.json(
        { error: "Clé API DeepSeek manquante. Configurez DEEPSEEK_API_KEY dans les variables d'environnement.", reply: "Je ne peux pas répondre pour le moment — la clé API n'est pas configurée." },
        { status: 500 }
      )
    }

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
        max_tokens: 500,
        stream: true
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error(`❌ DeepSeek API error (${response.status}):`, errText)
      return NextResponse.json(
        { error: `Erreur DeepSeek: ${response.status}`, reply: "Désolée, je n'ai pas pu répondre." },
        { status: 502 }
      )
    }

    // Transformer le flux SSE de DeepSeek en notre propre format JSON lines
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader()

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            controller.close()
            break
          }

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

          for (const line of lines) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ''
              if (content) {
                controller.enqueue(encoder.encode(JSON.stringify({ content }) + '\n'))
              }
            } catch {
              // Ignorer les morceaux JSON invalides
            }
          }
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })
  } catch (error) {
    console.error('❌ Chat test error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', reply: "Erreur de connexion. Vérifiez que le serveur est disponible." },
      { status: 500 }
    )
  }
}
