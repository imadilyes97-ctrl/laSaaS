import { NextResponse } from "next/server"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

export async function GET() {
  const results: any[] = []

  // Test 1 : Vérifier que le endpoint Storage répond
  try {
    const resp = await fetch(`${SUPABASE_URL}/storage/v1/object/public/produits/`, {
      method: "HEAD"
    })
    results.push({
      test: "Endpoint Storage produits",
      ok: true,
      detail: `Répond (${resp.status})`
    })
  } catch {
    results.push({
      test: "Endpoint Storage produits",
      ok: false,
      detail: "Ne répond pas"
    })
  }

  // Test 2 : Vérifier si le bucket accepte les requêtes publiques
  const testUrl = `${SUPABASE_URL}/storage/v1/object/public/produits/.folder_probe_test`
  try {
    const resp = await fetch(testUrl)
    // 404 = bucket existe (fichier inexistant), 403 = bucket privé
    if (resp.status === 404) {
      results.push({
        test: "Bucket accessibilité publique",
        ok: true,
        detail: "Bucket public ✅ (404 attendu pour fichier inexistant)"
      })
    } else if (resp.status === 403) {
      results.push({
        test: "Bucket accessibilité publique",
        ok: false,
        detail: "Bucket PRIVÉ ❌ → Dashboard Supabase → Storage → bucket produits → Public bucket"
      })
    } else {
      results.push({
        test: "Bucket accessibilité publique",
        ok: true,
        detail: `Statut: ${resp.status}`
      })
    }
  } catch {
    results.push({
      test: "Bucket accessibilité publique",
      ok: false,
      detail: "Erreur réseau"
    })
  }

  // Test 3 : Vérifier les photos en base
  try {
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(
      SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: produits } = await supabase
      .from("produits")
      .select("id, nom, photo_url")
      .not("photo_url", "is", null)
      .not("photo_url", "eq", "")
      .limit(10)

    if (!produits?.length) {
      results.push({
        test: "Produits avec photo",
        ok: false,
        detail: "Aucune photo_url en base"
      })
    } else {
      results.push({
        test: "Produits avec photo",
        ok: true,
        detail: `${produits.length} photo(s) trouvée(s)`
      })
      for (const p of produits) {
        try {
          const resp = await fetch(p.photo_url, { method: "HEAD" })
          results.push({
            test: `Photo #${p.id}`,
            ok: resp.ok,
            detail: `${resp.status} ${resp.statusText}`,
            url: p.photo_url.length > 80 ? p.photo_url.substring(0, 80) + "..." : p.photo_url
          })
        } catch (err: any) {
          results.push({
            test: `Photo #${p.id}`,
            ok: false,
            detail: err.message
          })
        }
      }
    }
  } catch (err: any) {
    results.push({
      test: "Erreur technique",
      ok: false,
      detail: err.message
    })
  }

  const failed = results.filter(r => !r.ok).length
  const total = results.length
  return NextResponse.json({
    diagnostic: results,
    conclusion: failed === 0
      ? "✅ Tout est OK"
      : `${failed}/${total} échecs`,
    conseil: failed > 0 && results.some(r => r.detail?.includes("PRIVÉ"))
      ? "Va sur https://supabase.com/dashboard → Storage → bucket 'produits' → active 'Public bucket'"
      : undefined
  })
}
