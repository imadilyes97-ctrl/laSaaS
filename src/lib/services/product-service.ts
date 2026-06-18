/**
 * Service layer pour la gestion des produits
 * Centralise la logique métier liée aux produits
 */

import { getSupabaseServiceClient } from "../supabase-service"
import { findMatchingProduct } from "../groq-analyzer"
import { ProductDescription } from "../schemas"

export class ProductService {
  private supabase = getSupabaseServiceClient()

  /**
   * Trouve un produit correspondant à une description
   * @param description - Description du produit à chercher
   * @param userId - ID de l'utilisateur
   * @returns Résultat de matching
   */
  async findMatchingProduct(
    description: ProductDescription,
    userId: string
  ) {
    return findMatchingProduct(description, this.supabase, userId)
  }

  /**
   * Récupère les produits actifs d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @param limit - Limite de résultats
   * @param offset - Offset pour la pagination
   * @returns Liste de produits
   */
  async getActiveProducts(
    userId: string,
    limit = 100,
    offset = 0
  ) {
    const { data: produits } = await this.supabase
      .from("produits")
      .select("*")
      .eq("user_id", userId)
      .eq("actif", true)
      .gt("stock", 0)
      .order("nom")
      .range(offset, offset + limit - 1)

    return produits || []
  }

  /**
   * Récupère un produit par ID
   * @param productId - ID du produit
   * @returns Produit ou null
   */
  async getProductById(productId: string) {
    const { data: produit } = await this.supabase
      .from("produits")
      .select("*")
      .eq("id", productId)
      .single()

    return produit || null
  }

  /**
   * Met à jour la description visuelle d'un produit
   * @param productId - ID du produit
   * @param description - Description visuelle
   * @returns Succès ou non
   */
  async updateProductVisualDescription(
    productId: string,
    description: ProductDescription
  ) {
    const { error } = await this.supabase
      .from("produits")
      .update({ description_visuelle: description })
      .eq("id", productId)

    return !error
  }

  /**
   * Recherche des produits par mots-clés
   * @param userId - ID de l'utilisateur
   * @param keywords - Mots-clés à chercher
   * @param limit - Limite de résultats
   * @returns Liste de produits correspondants
   */
  async searchProductsByKeywords(
    userId: string,
    keywords: string[],
    limit = 10
  ) {
    const { data: produits } = await this.supabase
      .from("produits")
      .select("*")
      .eq("user_id", userId)
      .eq("actif", true)
      .gt("stock", 0)
      .or(
        keywords.map(keyword =>
          `nom.ilike.%${keyword}%`
        )
      )
      .limit(limit)

    return produits || []
  }
}