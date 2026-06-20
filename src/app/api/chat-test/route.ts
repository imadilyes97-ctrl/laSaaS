import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const OPENCODE_API = "https://opencode.ai/zen/v1/chat/completions"

export async function POST(request: Request) {
  try {
    const { message, userId, conversationHistory, stream } = await request.json()

    console.log("🤖 Chat test - message reçu:", message?.slice(0, 80))

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

    if (!process.env.OPENCODE_API_KEY) {
      console.error("❌ OPENCODE_API_KEY manquante")
      return NextResponse.json(
        { reply: "Je ne peux pas répondre — la clé API OpenCode n'est pas configurée." },
        { status: 200 }
      )
    }

    const systemPrompt = config?.prompt_final || `Tu es ${config?.nom_chatbot || 'Yasmine'}, une assistante commerciale. Tu aides les clients à commander des produits.`

    const produitsContext = produits?.length
      ? `\n\nProduits disponibles :\n${produits.map((p: any) => `- ${p.nom} : ${p.prix} DZD | Tailles: ${p.tailles?.join(',')} | Couleurs: ${p.couleurs?.join(',')}`).join('\n')}`
      : '\n\nAucun produit disponible pour le moment.'

    console.log(`🔑 Appel OpenCode API (${stream ? 'streaming' : 'standard'})...`)

    const response = await fetch(OPENCODE_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENCODE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash-free',
        messages: [
          {
            role: 'system',
            content: systemPrompt + produitsContext
          },
          ...conversationHistory,
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
        stream: stream === true
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error(`❌ OpenCode API error (${response.status}):`, errText.slice(0, 500))
      return NextResponse.json(
        { reply: "Désolée, je n'ai pas pu répondre pour le moment." },
        { status: 200 }
      )
    }

    // Mode streaming
    if (stream === true) {
      const encoder = new TextEncoder()
      const decoder = new TextDecoder()

      const streamed = new ReadableStream({
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
                // Ignorer les lignes non-JSON
              }
            }
          }
        }
      })

      return new Response(streamed, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      })
    }

    // Mode standard (non-streaming)
    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'Désolée, je n\'ai pas pu répondre.'
    console.log("✅ Réponse reçue:", reply.slice(0, 80))

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('❌ Chat test error:', error)
    const errMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { reply: `Erreur: ${errMsg.slice(0, 100)}` },
      { status: 200 }
    )
  }
}
