/**
 * Tests unitaires pour le module de cache
 */

import { GroqCache } from "../cache"

describe('GroqCache', () => {
  beforeEach(() => {
    // Nettoyer le cache avant chaque test
    GroqCache.clear()
  })

  describe('getOrFetch', () => {
    it('should call fetchFn when cache is empty', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ test: 'data' })

      const result = await GroqCache.getOrFetch('test-key', fetchFn)

      expect(fetchFn).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ test: 'data' })
    })

    it('should return cached data on second call', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ test: 'data' })

      // Premier appel - devrait appeler fetchFn
      await GroqCache.getOrFetch('test-key', fetchFn)

      // Deuxième appel - devrait utiliser le cache
      const result = await GroqCache.getOrFetch('test-key', fetchFn)

      expect(fetchFn).toHaveBeenCalledTimes(1) // Toujours 1 appel
      expect(result).toEqual({ test: 'data' })
    })

    it('should respect TTL and fetch again after expiration', async () => {
      jest.useFakeTimers()

      const fetchFn = jest.fn()
        .mockResolvedValueOnce({ first: 'call' })
        .mockResolvedValueOnce({ second: 'call' })

      // Premier appel
      const firstResult = await GroqCache.getOrFetch('ttl-key', fetchFn, 1000)
      expect(firstResult).toEqual({ first: 'call' })
      expect(fetchFn).toHaveBeenCalledTimes(1)

      // Deuxième appel avant expiration - devrait utiliser le cache
      const cachedResult = await GroqCache.getOrFetch('ttl-key', fetchFn, 1000)
      expect(cachedResult).toEqual({ first: 'call' })
      expect(fetchFn).toHaveBeenCalledTimes(1)

      // Avancer le temps de 1001ms pour expirer le cache
      jest.advanceTimersByTime(1001)

      // Troisième appel après expiration - devrait appeler fetchFn à nouveau
      const expiredResult = await GroqCache.getOrFetch('ttl-key', fetchFn, 1000)
      expect(expiredResult).toEqual({ second: 'call' })
      expect(fetchFn).toHaveBeenCalledTimes(2)

      jest.useRealTimers()
    })

    it('should handle null/undefined from fetchFn', async () => {
      const fetchFn = jest.fn().mockResolvedValue(null)

      const result = await GroqCache.getOrFetch('null-key', fetchFn)

      expect(result).toBeNull()
      expect(GroqCache.get('null-key')).toBeNull()
    })
  })

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ data: 'test' })

      await GroqCache.getOrFetch('key1', fetchFn)
      await GroqCache.getOrFetch('key2', fetchFn)

      const stats = GroqCache.getStats()

      expect(stats.size).toBe(2)
      expect(stats.keys).toContain('key1')
      expect(stats.keys).toContain('key2')
    })
  })

  describe('clear', () => {
    it('should clear the cache', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ data: 'test' })

      await GroqCache.getOrFetch('clear-key', fetchFn)
      expect(GroqCache.getStats().size).toBe(1)

      GroqCache.clear()
      expect(GroqCache.getStats().size).toBe(0)
    })
  })
})