#!/usr/bin/env node

/**
 * Script pour tester l'intégration Groq avec un produit de test
 * Ce script crée un produit avec une photo, puis teste l'analyse
 */

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function testGroqIntegration() {
  try {
    console.log('🔍 Test de l\'intégration Groq avec un produit...\n');

    // D'abord, vérifions si nous avons des produits existants
    console.log('1️⃣ Vérification des produits existants...');
    const checkResponse = await fetch('http://localhost:3000/api/analyze-products?token=yasmine_secret_2026');
    const checkData = await checkResponse.json();
    console.log('   Résultat:', checkData.message);

    // Si aucun produit, créons-en un de test
    if (checkData.message.includes('Aucun produit')) {
      console.log('\n2️⃣ Création d\'un produit de test...');

      // Utilisons une URL de photo publique pour le test
      const testPhotoUrl = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';

      console.log('   URL de la photo:', testPhotoUrl);
      console.log('   Appel à l\'API d\'analyse d\'image...');

      const analyzeResponse = await fetch('http://localhost:3000/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoUrl: testPhotoUrl }),
      });

      const analyzeData = await analyzeResponse.json();
      console.log('   Réponse de l\'analyse:', analyzeData);

      if (analyzeResponse.ok && analyzeData.description) {
        console.log('\n✅ Succès! L\'analyse Groq a fonctionné.');
        console.log('   Description visuelle:', JSON.stringify(analyzeData.description, null, 2));
      } else {
        console.error('\n❌ Erreur lors de l\'analyse:', analyzeData.error || 'Erreur inconnue');
      }
    } else {
      console.log('\n✅ Des produits existent déjà. Vous pouvez tester l\'endpoint manuel:');
      console.log('   curl "http://localhost:3000/api/analyze-products?token=yasmine_secret_2026"');
    }

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    console.error('   Détails:', error.stack);
  }
}

// Exécuter le test
if (require.main === module) {
  testGroqIntegration();
}

module.exports = { testGroqIntegration };