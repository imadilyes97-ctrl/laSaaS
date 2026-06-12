#!/usr/bin/env node

/**
 * Script pour tester l'endpoint /api/analyze-products
 * Utilisation: node scripts/test_analyze_products.js
 */

const fetch = require('node-fetch');

async function testAnalyzeProducts() {
  try {
    const response = await fetch('http://localhost:3000/api/analyze-products?token=yasmine_secret_2026');
    const data = await response.json();

    console.log('Réponse de l\'API:', data);

    if (response.ok) {
      console.log('\n✅ Analyse terminée avec succès!');
      console.log(`- Produits totaux: ${data.produits_totaux || 0}`);
      console.log(`- Produits mis à jour: ${data.produits_mis_a_jour || 0}`);
      console.log(`- Erreurs: ${data.erreurs || 0}`);
    } else {
      console.error('\n❌ Erreur lors de l\'analyse:', data.error);
    }
  } catch (error) {
    console.error('\n❌ Erreur lors de la requête:', error.message);
  }
}

// Exécuter le test
if (require.main === module) {
  console.log('🔍 Test de l\'endpoint /api/analyze-products...');
  testAnalyzeProducts();
}

module.exports = { testAnalyzeProducts };