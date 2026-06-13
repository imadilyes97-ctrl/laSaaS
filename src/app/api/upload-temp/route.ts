import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 })
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"]
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Format accepté : JPG, PNG, WEBP" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image trop grande, max 10MB" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const ext = file.name.split(".").pop()
    const path = `temp/client/${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("produits")
      .upload(path, file)

    if (uploadError) {
      return NextResponse.json({ error: "Erreur upload: " + uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from("produits").getPublicUrl(path)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
