import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const secret_token = body.secret_token || body.token
    const sender_id = body.sender_id || "n8n"
    const messages = body.messages || []

    if (!secret_token) {
      return NextResponse.json(
        { error: "secret_token manquant" },
        { status: 401 }
      )
    }

    const { secret_token: _, token: _t, ...orderData } = body

    const supabase = await createClient()

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("secret_token", secret_token)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 401 }
      )
    }

    const { data: order, error: orderError } = await supabase
      .from("commandes")
      .insert({
        user_id: profile.id,
        nom_client: orderData.nom_client || orderData.nom || "",
        telephone: orderData.telephone || orderData.tel || "",
        wilaya: orderData.wilaya || "",
        commune: orderData.commune || "",
        produits: orderData.produits || orderData.produit || "",
        couleur: orderData.couleur || "",
        taille: orderData.taille || "",
        total: orderData.total || 0,
        statut: orderData.statut || "en_attente",
        date: orderData.date || new Date().toISOString(),
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json(
        { error: "Erreur lors de l'insertion de la commande" },
        { status: 500 }
      )
    }

    if (orderData.statut === "confirmée") {
      const productNames = (orderData.produits || orderData.produit || "")
        .split(",")
        .map((p: string) => p.trim())
        .filter(Boolean)

      for (const name of productNames) {
        await supabase.rpc("decrement_stock", {
          p_user_id: profile.id,
          p_product_name: name,
        })
      }
    }

    await supabase.from("conversations").insert({
      user_id: profile.id,
      sender_id,
      messages,
      date: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, order }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
