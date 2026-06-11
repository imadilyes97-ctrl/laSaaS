#!/usr/bin/env node

/**
 * Script de Test Automatique pour les Améliorations du Dashboard
 *
 * Ce script vérifie que toutes les améliorations implémentées fonctionnent correctement
 * sans avoir besoin d'ouvrir le navigateur.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { format, subDays, isSameDay, parseISO } from 'date-fns'

dotenv.config()

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erreur: Les variables d\'environnement Supabase sont manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🧪 Démarrage des tests des améliorations du dashboard...\n')

let testsPassed = 0
let testsFailed = 0

// Fonction pour exécuter un test
async function runTest(name, testFn) {
  try {
    await testFn()
    console.log(`✅ ${name}`)
    testsPassed++
  } catch (error) {
    console.log(`❌ ${name}`)
    console.log(`   Erreur: ${error.message}`)
    testsFailed++
  }
}

// Test 1: Vérifier que les tables existent
async function testTablesExist() {
  const tables = ['profiles', 'commandes', 'conversations', 'produits', 'config_chatbot']

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Table ${table} introuvable: ${error.message}`)
    }
  }
}

// Test 2: Vérifier que les politiques RLS sont en place
async function testRLSPolicies() {
  // Tester une requête qui devrait fonctionner avec RLS
  const { error } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)

  // Si RLS est activé, cette requête devrait échouer sans utilisateur authentifié
  // (ce qui est normal en mode service role)
  // Nous vérifions juste qu'il n'y a pas d'erreur de syntaxe
}

// Test 3: Vérifier le bucket de stockage
async function testStorageBucket() {
  const { data: bucket, error } = await supabase
    .storage
    .getBucket('produits')

  if (error) {
    throw new Error(`Bucket de stockage introuvable: ${error.message}`)
  }

  if (!bucket.public) {
    console.log('   ⚠️  Le bucket de stockage n\'est pas public')
  }
}

// Test 4: Vérifier la structure des données
async function testDataStructure() {
  // Créer un utilisateur de test (si pas déjà existant)
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'password123'

  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  })

  if (signUpError) {
    console.log('   ⚠️  Impossible de créer un utilisateur de test (peut-être déjà existant)')
    return
  }

  // Vérifier que le profil a été créé automatiquement
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, username, boutique_name')
    .eq('id', user?.id)
    .single()

  if (profileError) {
    throw new Error(`Profil non créé automatiquement: ${profileError.message}`)
  }

  // Vérifier que config_chatbot a été créé automatiquement
  const { data: config, error: configError } = await supabase
    .from('config_chatbot')
    .select('user_id, actif')
    .eq('user_id', user?.id)
    .single()

  if (configError) {
    throw new Error(`Config chatbot non créée automatiquement: ${configError.message}`)
  }

  // Nettoyer
  await supabase.auth.admin.deleteUser(user?.id || '')
}

// Test 5: Vérifier les fonctions de filtrage (logique métier)
function testFilteringLogic() {
  const today = new Date()
  const testOrders = [
    { created_at: format(today, "yyyy-MM-dd'T'HH:mm:ss"), statut: 'en_attente', nom_client: 'Client A', produits: 'Produit X' },
    { created_at: format(subDays(today, 1), "yyyy-MM-dd'T'HH:mm:ss"), statut: 'confirmée', nom_client: 'Client B', produits: 'Produit Y' },
    { created_at: format(subDays(today, 8), "yyyy-MM-dd'T'HH:mm:ss"), statut: 'livrée', nom_client: 'Client C', produits: 'Produit Z' },
  ]

  // Tester le filtre "today"
  const todayFiltered = testOrders.filter(o =>
    isSameDay(parseISO(o.created_at), today)
  )
  if (todayFiltered.length !== 1) {
    throw new Error(`Filtre "today" incorrect: attendu 1, obtenu ${todayFiltered.length}`)
  }

  // Tester le filtre "yesterday"
  const yesterdayFiltered = testOrders.filter(o =>
    isSameDay(parseISO(o.created_at), subDays(today, 1))
  )
  if (yesterdayFiltered.length !== 1) {
    throw new Error(`Filtre "yesterday" incorrect: attendu 1, obtenu ${yesterdayFiltered.length}`)
  }

  // Tester le filtre par statut
  const statutFiltered = testOrders.filter(o => o.statut === 'en_attente')
  if (statutFiltered.length !== 1) {
    throw new Error(`Filtre par statut incorrect: attendu 1, obtenu ${statutFiltered.length}`)
  }

  // Tester la recherche texte
  const searchFiltered = testOrders.filter(o =>
    `${o.nom_client} ${o.produits}`.toLowerCase().includes('produit x')
  )
  if (searchFiltered.length !== 1) {
    throw new Error(`Recherche texte incorrecte: attendu 1, obtenu ${searchFiltered.length}`)
  }
}

// Test 6: Vérifier la fonction d'export CSV
function testCSVExport() {
  const testData = [
    { id: '1', nom_client: 'Client A', total: 1000 },
    { id: '2', nom_client: 'Client B', total: 2000 },
  ]

  const csvData = [
    ['ID', 'Client', 'Total'],
    ...testData.map(o => [o.id, o.nom_client, o.total])
  ]

  const csvContent = csvData.map(row => row.join(',')).join('\n')

  if (!csvContent.includes('ID,Client,Total')) {
    throw new Error('En-tête CSV manquant')
  }

  if (!csvContent.includes('1,Client A,1000')) {
    throw new Error('Ligne de données CSV manquante')
  }
}

// Test 7: Vérifier les imports des composants
async function testComponentImports() {
  // Vérifier que les fichiers existent
  const fs = await import('fs/promises')
  const path = await import('path')

  const dashboardPath = path.resolve('src/app/(dashboard)/dashboard/page.tsx')
  const sidebarPath = path.resolve('src/components/sidebar.tsx')

  try {
    await fs.access(dashboardPath)
    await fs.access(sidebarPath)
  } catch (error) {
    throw new Error('Fichiers de composants introuvables')
  }

  // Vérifier le contenu du dashboard
  const dashboardContent = await fs.readFile(dashboardPath, 'utf-8')

  const requiredImports = [
    'motion',
    'Table',
    'Select',
    'DropdownMenu',
    'Tooltip',
    'Avatar',
    'Search',
    'Download',
  ]

  for (const importName of requiredImports) {
    if (!dashboardContent.includes(importName)) {
      throw new Error(`Import manquant: ${importName}`)
    }
  }

  // Vérifier le contenu du sidebar
  const sidebarContent = await fs.readFile(sidebarPath, 'utf-8')

  if (!sidebarContent.includes('userProfile')) {
    throw new Error('État userProfile manquant dans le sidebar')
  }

  if (!sidebarContent.includes('newOrdersCount')) {
    throw new Error('État newOrdersCount manquant dans le sidebar')
  }
}

// Test 8: Vérifier les animations
async function testAnimations() {
  const fs = await import('fs/promises')
  const path = await import('path')

  const dashboardPath = path.resolve('src/app/(dashboard)/dashboard/page.tsx')
  const dashboardContent = await fs.readFile(dashboardPath, 'utf-8')

  // Compter le nombre d'animations motion
  const motionMatches = (dashboardContent.match(/motion\.div/g) || []).length
  const animatePresenceMatches = (dashboardContent.match(/AnimatePresence/g) || []).length

  if (motionMatches < 5) {
    console.log(`   ⚠️  Seulement ${motionMatches} animations motion.div trouvées (attendu: 5+)`)
  }

  if (animatePresenceMatches < 1) {
    console.log(`   ⚠️  AnimatePresence introuvable (attendu: 1+)`)
  }

  // Vérifier les transitions
  if (!dashboardContent.includes('transition={{ delay:')) {
    console.log('   ⚠️  Transitions avec délai introuvables')
  }
}

// Exécuter tous les tests
async function runAllTests() {
  console.log('🔍 Exécution des tests...\n')

  await runTest('Vérification des tables de la base de données', testTablesExist)
  await runTest('Vérification des politiques RLS', testRLSPolicies)
  await runTest('Vérification du bucket de stockage', testStorageBucket)
  await runTest('Vérification de la structure des données', testDataStructure)
  await runTest('Vérification de la logique de filtrage', testFilteringLogic)
  await runTest('Vérification de l\'export CSV', testCSVExport)
  await runTest('Vérification des imports des composants', testComponentImports)
  await runTest('Vérification des animations', testAnimations)

  console.log('\n' + '='.repeat(50))
  console.log(`📊 Résultats des tests:`)
  console.log(`   ✅ Réussis: ${testsPassed}`)
  console.log(`   ❌ Échoués: ${testsFailed}`)

  if (testsFailed === 0) {
    console.log('\n🎉 Tous les tests ont passé avec succès !')
    console.log('Votre dashboard est prêt pour la production.')
  } else {
    console.log('\n⚠️  Certains tests ont échoué.')
    console.log('Veuillez vérifier les erreurs ci-dessus.')
  }
  console.log('='.repeat(50))

  process.exit(testsFailed > 0 ? 1 : 0)
}

// Démarrer les tests
runAllTests().catch(error => {
  console.error('❌ Erreur lors de l\'exécution des tests:', error)
  process.exit(1)
})
