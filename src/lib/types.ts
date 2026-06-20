export type Product = {
  id: string
  user_id: string
  nom: string
  description: string
  photo_url: string
  photos: string[]
  prix: number
  devise: string
  tailles: string[]
  couleurs: string[]
  stock: number
  actif: boolean
  description_visuelle: Record<string, unknown>
  created_at: string
}

export type ChatbotConfig = {
  id: string
  user_id: string
  nom_chatbot: string
  message_bienvenue: string
  langue: string
  photo_profil_url: string
  actif: boolean
  secret_token: string
  prompt_libre: string
  prompt_role: string
  prompt_ton: string
  prompt_regles: string
  prompt_langue: string
  prompt_final: string
  created_at: string
}

export type Order = {
  id: string
  user_id: string
  nom_client: string
  telephone: string
  wilaya: string
  commune: string
  produits: string
  couleur: string
  taille: string
  total: number
  statut: string
  date: string
  created_at: string
}

export type Conversation = {
  id: string
  user_id: string
  sender_id: string
  messages: Message[]
  date: string
  created_at: string
}

export type Message = {
  role: "user" | "assistant"
  content: string
  timestamp: string
}
