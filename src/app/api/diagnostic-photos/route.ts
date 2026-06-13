import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const results: any[] = []

  // 1. Vérifier le bucket
  const { data: bucket, error: bucketError } = await supabase.storage.getBucket("produits")
  results.push({
    test: "Bucket 'produits' existe",
    ok: !bucketError,
    detail: bucketError ? bucketError.message : `Public: ${bucket.public}`
  })

  // 2. Récupérer les produits avec photo
  const { data: produits, error: produitsError } = await supabase
    .from("produits")
    .select("id, nom, photo_url")
    .not("photo_url", "is", null)
    .not("photo_url", "eq", "")
    .limit(10)

  if (produitsError) {
    results.push({
      test: "Récupération produits",
      ok: false,
      detail: produitsError.message
    })
  } else if (!produits?.length) {
    results.push({
      test: "Produits avec photo",
      ok: false,
      detail: "Aucun produit avec photo_url trouvé"
    })
  } else {
    results.push({
      test: "Produits avec photo",
      ok: true,
      detail: `${produits.length} trouvé(s)`
    })

    // 3. Tester chaque URL
    for (const p of produits) {
      try {
        const resp = await fetch(p.photo_url, { method: "HEAD" })
        results.push({
          test: `Photo #${p.id} ${p.nom || "?"}`,
          ok: resp.ok,
          detail: `${resp.status} ${resp.statusText}`,
          url: p.photo_url
        })
      } catch (err: any) {
        results.push({
          test: `Photo #${p.id} ${p.nom || "?"}`,
          ok: false,
          detail: `ERREUR: ${err.message}`,
          url: p.photo_url
        })
      }
    }
  }

  const failed = results.filter(r => !r.ok).length
  return NextResponse.json({
    diagnostic: results,
    conclusion: failed === 0
      ? "✅ Toutes les URLs sont accessibles"
      : failed === results.length
        ? "❌ Aucune URL accessible — va dans Supabase → Storage → bucket produits → active Public bucket"
        : `⚠️ ${failed}/${results.length} échecs — vérifie les détails`
  })
}
