import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { analyzeImageWithGroq, findMatchingProduct } from "@/lib/groq-analyzer"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const token = body.token

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 401 })
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

    // Si une imageUrl est fournie → reconnaître le produit
    if (body.imageUrl) {
      const clientDescription = await analyzeImageWithGroq(body.imageUrl)
      if (!clientDescription) {
        return NextResponse.json({ erreur: "Impossible d'analyser l'image" }, { status: 502 })
      }

      const { data: produits } = await supabase
        .from("produits")
        .select("id, nom, description, photo_url, prix, devise, tailles, couleurs, stock, description_visuelle")
        .eq("user_id", config.user_id)
        .eq("actif", true)
        .gt("stock", 0)

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
    const { token: _t, imageUrl: _i, ...orderData } = body

    const { error: orderError } = await supabase
      .from("commandes")
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
