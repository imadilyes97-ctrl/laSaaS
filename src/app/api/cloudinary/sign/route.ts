import { cloudinary } from "@/lib/cloudinary"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const timestamp = Math.round(Date.now() / 1000)
    const folder = "produits"
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!uploadPreset) {
      // Mode signature-only (sans unsigned preset)
      const params = {
        timestamp,
        folder,
      }

      const signature = cloudinary.utils.api_sign_request(
        params,
        process.env.CLOUDINARY_API_SECRET!
      )

      return NextResponse.json({
        signature,
        timestamp,
        folder,
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
      })
    }

    // Mode upload preset (unsigned ou signed)
    const params = {
      timestamp,
      folder,
      upload_preset: uploadPreset,
    }

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET!
    )

    return NextResponse.json({
      signature,
      timestamp,
      folder,
      uploadPreset,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erreur de signature Cloudinary : " + (error?.message || error) },
      { status: 500 }
    )
  }
}
