import { NextResponse } from "next/server"
import { getSupabaseServiceClient } from "@/lib/supabase-service"
import { ChatbotConfig } from "@/lib/types"

const supabase = getSupabaseServiceClient()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 401 })
    }

    const { data: config, error: configError } = await supabase
      .from("config_chatbot")
      .select("user_id, nom_chatbot, message_bienvenue, langue, prompt_final")
      .eq("secret_token", token)
      .eq("actif", true)
      .single<ChatbotConfig>()

    if (configError || !config) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 })
    }

    const { data: produits } = await supabase
      .from("produits")
      .select("id, nom, description, photo_url, photos, prix, devise, tailles, couleurs, stock, description_visuelle")
      .eq("user_id", config.user_id)
      .eq("actif", true)
      .gt("stock", 0)
      .order("nom")

    const { data: services } = await supabase
      .from("services")
      .select("id, nom, description, photo_url, photos, prix, devise, type_prix, duree, categorie")
      .eq("user_id", config.user_id)
      .eq("actif", true)
      .order("nom")

    return NextResponse.json({
      produits: produits || [],
      services: services || [],
      config: {
        nom_chatbot: config.nom_chatbot,
        message_bienvenue: config.message_bienvenue,
        langue: config.langue,
        prompt_final: config.prompt_final,
        page_access_token: process.env.MESSENGER_PAGE_ACCESS_TOKEN || "",
      },
    })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
