#!/usr/bin/env node
/**
 * Script de diagnostic : vérifie si les URLs des photos produits sont publiques
 *
 * Usage:
 *   1. node scripts/check_photo_urls.js
 *   2. Lire les logs → si 403 → bucket privé
 *
 * Résultat :
 *   - 200 → OK, l'URL est publique
 *   - 400/403 → bucket privé ou mauvaises permissions
 *   - 404 → l'objet n'existe pas à ce path
 */

const SUPABASE_URL = "https://wbuscpclgihrynqkezxt.supabase.co"
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || require("fs").readFileSync(".env.local", "utf8").match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]

if (!SUPABASE_ANON_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY introuvable dans .env.local")
  process.exit(1)
}

async function checkUrl(url, label) {
  try {
    const resp = await fetch(url, { method: "HEAD" })
    const ok = resp.ok ? "✅" : "❌"
    console.log(`  ${ok} ${label}: ${resp.status} ${resp.statusText}`)
    return resp.ok
  } catch (err) {
    console.log(`  ❌ ${label}: ERREUR ${err.message}`)
    return false
  }
}

async function main() {
  console.log("🔍 Diagnostic d'accessibilité des URLs Supabase\n")

  // 1. Tester l'URL du bucket public (doit répondre 200 ou 404 si vide)
  const bucketUrl = `${SUPABASE_URL}/storage/v1/object/public/produits/`
  console.log("1️⃣ Test bucket public :")
  await checkUrl(bucketUrl, "Bucket racine")
  console.log("")

  // 2. Tester avec un fichier qui pourrait exister
  console.log("2️⃣ Test avec un chemin typique :")
  console.log("   (remplacez par un vrai user_id/uuid.jpg si vous en avez un)")
  const sampleUrl = `${SUPABASE_URL}/storage/v1/object/public/produits/sample_test_public.jpg`
  await checkUrl(sampleUrl, "Fichier test (attendu: 404)")
  console.log("")

  // 3. Lire les URLs depuis Supabase et les tester
  console.log("3️⃣ Récupération des URLs depuis la base de données...")
  const { createClient } = require("@supabase/supabase-js")
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data: produits, error } = await supabase
    .from("produits")
    .select("id, nom, photo_url")
    .not("photo_url", "is", null)
    .not("photo_url", "eq", "")
    .limit(20)

  if (error) {
    console.log(`   ❌ Erreur Supabase: ${error.message}`)
    console.log("   → Vérifie que la table 'produits' existe et que l'anon key a accès")
  } else if (!produits || produits.length === 0) {
    console.log("   ⚠️ Aucun produit avec photo_url trouvé")
  } else {
    console.log(`   ${produits.length} produit(s) trouvé(s)\n`)
    let success = 0, failed = 0
    for (const p of produits) {
      const ok = await checkUrl(p.photo_url, `#${p.id} ${p.nom || "sans nom"}`)
      if (ok) success++; else failed++
    }
    console.log(`\n   Résultat: ${success} ✅ / ${failed} ❌`)
  }
  console.log("")

  // 4. Vérifier si le bucket est public via l'API Supabase
  console.log("4️⃣ Configuration du bucket :")
  const { data: bucket, error: bucketError } = await supabase.storage.getBucket("produits")
  if (bucketError) {
    console.log(`   ❌ Erreur: ${bucketError.message}`)
    console.log("   → Le bucket 'produits' n'existe pas ou l'API key n'a pas accès")
  } else {
    console.log(`   ✅ Bucket trouvé: ${bucket.name}`)
    console.log(`   🔓 Public: ${bucket.public ? "✅ OUI" : "❌ NON — à corriger !"}`)
  }

  // Résumé
  console.log("\n📋 Résumé du diagnostic :")
  console.log("   - Les URLs doivent commencer par:", `${SUPABASE_URL}/storage/v1/object/public/produits/`)
  console.log("   - Si 403 → bucket privé → aller dans Supabase Dashboard → Storage → bucket produits → onglet Configuration → cocher 'Public bucket'")
  console.log("   - Si 404 → le fichier n'existe pas au chemin indiqué → vérifier le path dans la base")
}

main().catch(console.error)
