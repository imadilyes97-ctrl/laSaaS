import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const token = body.token

    if (!token || token !== process.env.SECRET_TOKEN) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { token: _t, ...orderData } = body

    const supabase = await createClient()

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: "Aucun profil trouvé" },
        { status: 500 }
      )
    }

    const { error: orderError } = await supabase
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
        p_user_id: profile.id,
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
