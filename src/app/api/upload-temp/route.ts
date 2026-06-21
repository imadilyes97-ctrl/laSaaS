import { NextResponse } from "next/server"
import { cloudinary } from "@/lib/cloudinary"

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

    // Convertir le File en buffer pour Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload vers Cloudinary
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "temp",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(new Error(error.message))
          } else if (result) {
            resolve({ secure_url: result.secure_url })
          } else {
            reject(new Error("Échec de l'upload Cloudinary"))
          }
        }
      )
      uploadStream.end(buffer)
    })

    return NextResponse.json({ url: result.secure_url })
  } catch (err: any) {
    return NextResponse.json({ error: "Erreur upload: " + (err?.message || err) }, { status: 500 })
  }
}
