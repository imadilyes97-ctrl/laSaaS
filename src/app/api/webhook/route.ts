import { NextResponse } from "next/server"
import { getSupabaseServiceClient } from "@/lib/supabase-service"
import { analyzeImageWithGroq, findMatchingProduct } from "@/lib/groq-analyzer"
import { WebhookPayloadSchema } from "@/lib/schemas"
import { ChatbotConfig, Product } from "@/lib/types"

const supabase = getSupabaseServiceClient()

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validation avec Zod
    const result = WebhookPayloadSchema.safeParse(body)
    if (!result.success) {
      console.error('❌ Validation échouée:', result.error.flatten())
      return NextResponse.json(
        { error: "Payload invalide", details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { token } = result.data

    const { data: config, error: configError } = await supabase
      .from("config_chatbot")
      .select("user_id")
      .eq("secret_token", token)
      .eq("actif", true)
      .single<ChatbotConfig>()

    if (configError || !config) {
      console.error('❌ Erreur config:', configError?.message)
      return NextResponse.json({ error: "Token invalide" }, { status: 401 })
    }

    // Si une imageUrl est fournie → reconnaître le produit
    if (result.data.imageUrl) {
      const clientDescription = await analyzeImageWithGroq(result.data.imageUrl)
      if (!clientDescription) {
        return NextResponse.json({ erreur: "Impossible d'analyser l'image" }, { status: 502 })
      }

      const { data: produits } = await supabase
        .from("produits")
        .select("id, nom, description, photo_url, prix, devise, tailles, couleurs, stock, description_visuelle")
        .eq("user_id", config.user_id)
        .eq("actif", true)
        .gt("stock", 0)
        .returns<Product[]>()

      if (!produits || produits.length === 0) {
        return NextResponse.json({ trouve: false, message: "Aucun produit disponible" })
      }

      const matchResult = await findMatchingProduct(clientDescription, supabase, config.user_id)

      if (!matchResult.trouve) {
        return NextResponse.json({
          trouve: false,
          message: "Désolé, je n'ai pas trouvé ce produit dans notre catalogue."
        })
      }

      const p = matchResult.produit
      return NextResponse.json({
        trouve: true,
        message: `Oui, nous avons "${p.nom}" en stock ! ${p.prix} ${p.devise}. ${p.stock > 0 ? `Il en reste ${p.stock}.` : ""}`,
        produit: {
          nom: p.nom,
          prix: p.prix,
          devise: p.devise,
          stock: p.stock,
          photo_url: p.photo_url
        }
      })
    }

    // Sinon → créer une commande (comportement existant)
    const { token: _t, imageUrl: _i, ...orderData } = result.data as any

    const { error: orderError } = await (supabase.from("commandes") as any)
      .insert({
        user_id: config.user_id,
        nom_client: orderData.nom_client || orderData.nom || "",
        telephone: orderData.telephone || orderData.tel || "",
        wilaya: orderData.wilaya || "",
        commune: orderData.commune || "",
        produits: orderData.produits || orderData.produit || "",
        couleur: orderData.couleur || "",
        taille: orderData.taille || "",
        total: orderData.total || 0,
        statut: orderData.statut || "en_attente",
        date: orderData.date || new Date().toISOString().split("T")[0],
      })

    if (orderError) {
      return NextResponse.json(
        { error: "Erreur lors de l'insertion de la commande" },
        { status: 500 }
      )
    }

    const productNames = (orderData.produits || orderData.produit || "")
      .split(",")
      .map((p: string) => p.trim())
      .filter(Boolean)

    for (const name of productNames) {
      await supabase.rpc("decrement_stock", {
        p_user_id: config.user_id,
        p_product_name: name,
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
