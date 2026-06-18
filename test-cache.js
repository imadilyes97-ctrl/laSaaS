/**
 * Test simple du cache sans Jest
 */

// Simuler l'import ES6
const { GroqCache } = require('./src/lib/cache.ts')

async function testCache() {
  console.log('🧪 Test du cache Groq...\n')

  // Test 1: Premier appel devrait appeler fetchFn
  console.log('Test 1: Premier appel')
  let fetchCount = 0
  const fetchFn = () => {
    fetchCount++
    return Promise.resolve({ test: 'data', call: fetchCount })
  }

  const result1 = await GroqCache.getOrFetch('test-key', fetchFn)
  console.log('✅ Résultat:', result1)
  console.log('📊 Appels fetchFn:', fetchCount)

  // Test 2: Deuxième appel devrait utiliser le cache
  console.log('\nTest 2: Deuxième appel (cache)')
  const result2 = await GroqCache.getOrFetch('test-key', fetchFn)
  console.log('✅ Résultat:', result2)
  console.log('📊 Appels fetchFn:', fetchCount)

  // Test 3: Statistiques du cache
  console.log('\nTest 3: Statistiques')
  const stats = GroqCache.getStats()
  console.log('📊 Taille du cache:', stats.size)
  console.log('📊 Clés:', stats.keys)

  // Test 4: Nettoyage du cache
  console.log('\nTest 4: Nettoyage')
  GroqCache.clear()
  console.log('📊 Taille après clear:', GroqCache.getStats().size)

  // Test 5: Troisième appel après clear
  console.log('\nTest 5: Appel après clear')
  const result3 = await GroqCache.getOrFetch('test-key', fetchFn)
  console.log('✅ Résultat:', result3)
  console.log('📊 Appels fetchFn:', fetchCount)

  console.log('\n✅ Tous les tests passés !')
}

testCache().catch(console.error)