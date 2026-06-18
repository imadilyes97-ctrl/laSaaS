/**
 * Tests unitaires pour le module groq-analyzer
 */

import { findMatchingProduct, motsEnCommun, normaliser } from "../groq-analyzer"

describe('groq-analyzer utilities', () => {
  describe('normaliser', () => {
    it('should normalize strings correctly', () => {
      expect(normaliser('  T-Shirt BLUE  ')).toBe('tshirtblue')
      expect(normaliser('Pullover ROUGE!')).toBe('pulloverrouge')
      expect(normaliser('')).toBe('')
      expect(normaliser(null as any)).toBe('')
      expect(normaliser(undefined as any)).toBe('')
    })
  })

  describe('motsEnCommun', () => {
    it('should count common words correctly', () => {
      expect(motsEnCommun('t-shirt bleu', 't-shirt rouge')).toBe(1)
      expect(motsEnCommun('pullover bleu marine', 'pullover bleu')).toBe(2)
      expect(motsEnCommun('robe rouge', 'jupe bleue')).toBe(0)
    })
  })
})

describe('findMatchingProduct', () => {
  // Mock Supabase client
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          nom: 'T-shirt bleu',
          description_visuelle: {
            type: 't-shirt',
            couleur_principale: 'bleu',
            couleurs: ['bleu'],
            matiere: 'coton'
          }
        },
        {
          id: '2',
          nom: 'Pullover rouge',
          description_visuelle: {
            type: 'pullover',
            couleur_principale: 'rouge',
            couleurs: ['rouge'],
            matiere: 'laine'
          }
        }
      ]
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should find exact match', async () => {
    const clientDescription = {
      type: 't-shirt',
      couleur_principale: 'bleu',
      couleurs: ['bleu'],
      matiere: 'coton'
    }

    const result = await findMatchingProduct(clientDescription, mockSupabase, 'user1')

    expect(result.trouve).toBe(true)
    expect(result.similarite).toBe('exact')
    expect(result.produit?.nom).toBe('T-shirt bleu')
  })

  it('should find close match', async () => {
    const clientDescription = {
      type: 't-shirt',
      couleur_principale: 'bleu',
      couleurs: ['bleu'],
      matiere: 'laine' // Matière différente
    }

    const result = await findMatchingProduct(clientDescription, mockSupabase, 'user1')

    expect(result.trouve).toBe(true)
    expect(result.similarite).toBe('proche')
    expect(result.produit?.nom).toBe('T-shirt bleu')
  })

  it('should return no match when no products available', async () => {
    const emptySupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [] })
    }

    const result = await findMatchingProduct(
      { type: 't-shirt' },
      emptySupabase,
      'user1'
    )

    expect(result.trouve).toBe(false)
  })

  it('should handle early exit for perfect score', async () => {
    const perfectMatchSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            nom: 'T-shirt bleu coton', // Nom contient tous les mots-clés
            description_visuelle: {
              type: 't-shirt',
              couleur_principale: 'bleu',
              couleurs: ['bleu'],
              matiere: 'coton'
            }
          }
        ]
      })
    }

    const clientDescription = {
      type: 't-shirt bleu coton',
      couleur_principale: 'bleu',
      couleurs: ['bleu'],
      matiere: 'coton'
    }

    const result = await findMatchingProduct(clientDescription, perfectMatchSupabase, 'user1')

    expect(result.trouve).toBe(true)
    expect(result.similarite).toBe('exact')
  })

  it('should use pagination for large datasets', async () => {
    const largeDatasetSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn()
        .mockResolvedValueOnce({
          data: Array(50).fill(null).map((_, i) => ({
            id: `${i}`,
            nom: `Produit ${i}`,
            description_visuelle: { type: 'autre' }
          }))
        })
        .mockResolvedValueOnce({
          data: [
            {
              id: '51',
              nom: 'T-shirt parfait',
              description_visuelle: {
                type: 't-shirt',
                couleur_principale: 'bleu'
              }
            }
          ]
        })
    }

    const clientDescription = {
      type: 't-shirt',
      couleur_principale: 'bleu'
    }

    const result = await findMatchingProduct(clientDescription, largeDatasetSupabase, 'user1', 50)

    expect(result.trouve).toBe(true)
    expect(result.produit?.nom).toBe('T-shirt parfait')
    expect(largeDatasetSupabase.range).toHaveBeenCalledTimes(2) // 2 pages
  })
})