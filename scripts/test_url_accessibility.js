#!/usr/bin/env node

/**
 * Script pour tester si Groq peut accéder aux URLs d'images
 * Ce script teste avec une URL publique connue vs une URL Supabase
 */

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function testUrlAccessibility() {
  console.log('🔍 Test d\'accessibilité des URLs pour Groq...\n');

  // Test 1: URL publique connue (devrait fonctionner)
  const publicUrl = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';

  console.log('1️⃣ Test avec URL publique (Unsplash):');
  console.log('   URL:', publicUrl);

  try {
    const response = await fetch('http://localhost:3001/api/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ photoUrl: publicUrl }),
    });

    const data = await response.json();
    console.log('   Statut:', response.status);
    console.log('   Résultat:', response.ok ? '✅ Succès' : '❌ Échec');
    if (!response.ok) {
      console.log('   Erreur:', data.error);
      console.log('   Détails:', data.details);
    }
  } catch (error) {
    console.log('   ❌ Erreur réseau:', error.message);
  }

  console.log('\n2️⃣ Test avec URL Supabase (si disponible):');
  console.log('   À faire: Remplacer par une URL réelle de votre bucket Supabase');
  console.log('   Exemple: https://wbuscpclgihrynqkezxt.supabase.co/storage/v1/object/public/produits/user_id/image.jpg');

  // Test 2: Vérifier si une URL Supabase est accessible publiquement
  const supabaseUrl = 'https://wbuscpclgihrynqkezxt.supabase.co/storage/v1/object/public/produits/test.jpg'; // Remplacer par une vraie URL

  try {
    console.log('   Test d\'accessibilité directe de l\'URL Supabase...');
    const directResponse = await fetch(supabaseUrl);
    console.log('   Statut:', directResponse.status);
    console.log('   Accessible:', directResponse.ok ? '✅ Oui' : '❌ Non');

    if (!directResponse.ok) {
      console.log('   ⚠️  L\'URL Supabase n\'est pas accessible publiquement');
      console.log('   Solution: Vérifier les permissions RLS du bucket Supabase');
    }
  } catch (error) {
    console.log('   ❌ Erreur d\'accès:', error.message);
  }
}

// Exécuter le test
if (require.main === module) {
  testUrlAccessibility();
}

module.exports = { testUrlAccessibility };