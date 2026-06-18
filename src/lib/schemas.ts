/**
 * Schémas de validation pour les payloads API
 * Utilise Zod pour une validation robuste et typée
 */

import { z } from 'zod'

// Schéma pour le payload du webhook
export const WebhookPayloadSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  imageUrl: z.string().url('URL invalide').optional(),
  nom_client: z.string().optional(),
  telephone: z.string().optional(),
  wilaya: z.string().optional(),
  commune: z.string().optional(),
  produits: z.string().optional(),
  couleur: z.string().optional(),
  taille: z.string().optional(),
  total: z.number().optional(),
  statut: z.string().optional(),
  date: z.string().optional()
})

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>

// Schéma pour l'analyse d'image
export const ChatbotAnalyzeSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  imageUrl: z.string().url('URL invalide')
})

export type ChatbotAnalyzePayload = z.infer<typeof ChatbotAnalyzeSchema>

// Schéma pour le payload de transcription
export const TranscribePayloadSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  audioUrl: z.string().url('URL invalide'),
  metaToken: z.string().min(1, 'Meta token requis')
})

export type TranscribePayload = z.infer<typeof TranscribePayloadSchema>

// Schéma pour la description de produit
export const ProductDescriptionSchema = z.object({
  type: z.string().optional(),
  couleur_principale: z.string().optional(),
  couleurs: z.array(z.string()).optional(),
  matiere: z.string().optional(),
  style: z.string().optional(),
  details_visuels: z.string().optional(),
  mots_cles: z.array(z.string()).optional()
})

export type ProductDescription = z.infer<typeof ProductDescriptionSchema>

// Schéma pour le résultat de matching
export const ProductMatchResultSchema = z.object({
  trouve: z.boolean(),
  similarite: z.enum(['exact', 'proche', 'non']).optional(),
  produit: z.object({
    id: z.string(),
    nom: z.string(),
    description: z.string().optional(),
    photo_url: z.string().optional(),
    prix: z.number(),
    devise: z.string(),
    stock: z.number()
  }).optional(),
  clientDescription: ProductDescriptionSchema.optional(),
  message: z.string().optional()
})

export type ProductMatchResult = z.infer<typeof ProductMatchResultSchema>