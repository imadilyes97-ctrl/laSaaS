/**
 * Client Supabase côté serveur avec singleton pattern pour les opérations service role
 * Évite les reconnexions multiples et centralise la configuration
 */

import { createClient } from '@supabase/supabase-js'

let client: ReturnType<typeof createClient> | null = null

export function getSupabaseServiceClient() {
  if (!client) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase URL or Service Role Key not configured')
    }

    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false }
      }
    )

    console.log('🔄 Nouvelle connexion Supabase (service role) établie')
  }

  return client
}