import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

    const { token: _t, ...orderData } = body

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
