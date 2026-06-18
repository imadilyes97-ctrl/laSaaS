/**
 * Module de cache en mémoire pour les résultats Groq
 * Réduit les appels API répétitifs et améliore les performances
 */

export class GroqCache {
  private static cache = new Map<string, {
    data: any;
    timestamp: number;
    expires: number;
  }>()

  /**
   * Récupère une entrée du cache si elle existe et n'est pas expirée
   * @param key - Clé de cache (généralement l'URL de l'image)
   * @returns Les données cachées ou null si expiré/inexistant
   */
  static get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry || Date.now() > entry.expires) {
      return null
    }
    return entry.data
  }

  /**
   * Stocke des données dans le cache
   * @param key - Clé de cache
   * @param data - Données à cacher
   * @param ttl - Temps de vie en millisecondes (défaut: 1 heure)
   */
  static set(key: string, data: any, ttl = 3600000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl
    })
  }

  /**
   * Récupère les données du cache ou les récupère via fetchFn si non disponibles
   * @param key - Clé de cache
   * @param fetchFn - Fonction pour récupérer les données si non en cache
   * @param ttl - Temps de vie en millisecondes
   * @returns Les données (du cache ou fraîches)
   */
  static async getOrFetch(
    key: string,
    fetchFn: () => Promise<any>,
    ttl = 3600000
  ): Promise<any> {
    const cached = this.get(key)
    if (cached) {
      console.log('📦 Cache hit pour:', key)
      return cached
    }

    console.log('🔄 Cache miss pour:', key, '- Appel API...')
    const data = await fetchFn()
    if (data) {
      this.set(key, data, ttl)
      console.log('✅ Données cachées pour:', key)
    }
    return data
  }

  /**
   * Vide le cache (utile pour les tests)
   */
  static clear(): void {
    this.cache.clear()
  }

  /**
   * Récupère des statistiques sur le cache
   */
  static getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}