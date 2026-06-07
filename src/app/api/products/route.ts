import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token || token !== process.env.SECRET_TOKEN) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    const { data: produits } = await supabase
      .from("produits")
      .select("id, nom, description, photo_url, prix, devise, tailles, couleurs, stock")
      .eq("actif", true)
      .gt("stock", 0)
      .order("nom")

    const { data: chatbot } = await supabase
      .from("config_chatbot")
      .select("nom_chatbot, message_bienvenue, langue")
      .eq("actif", true)
      .single()

    return NextResponse.json({
      produits: produits || [],
      config: chatbot || null,
    })
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
