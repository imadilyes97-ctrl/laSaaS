import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("secret_token", token)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 401 }
      )
    }

    const { data: produits } = await supabase
      .from("produits")
      .select("*")
      .eq("user_id", profile.id)
      .eq("actif", true)
      .gt("stock", 0)
      .order("nom")

    const { data: chatbot } = await supabase
      .from("config_chatbot")
      .select("*")
      .eq("user_id", profile.id)
      .single()

    return NextResponse.json({
      produits: produits || [],
      chatbot: chatbot || null,
    })
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
