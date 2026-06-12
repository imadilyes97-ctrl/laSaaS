-- ============================================
-- SCRIPT D'INSTALLATION COMPLET
-- À exécuter DANS LE SQL EDITOR de Supabase
-- Dashboard Supabase > SQL Editor > Coller > Run
-- ============================================

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  secret_token UUID DEFAULT gen_random_uuid() UNIQUE,
  boutique_name TEXT DEFAULT '',
  full_name TEXT DEFAULT '',
  username TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Commandes
CREATE TABLE IF NOT EXISTS commandes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  nom_client TEXT NOT NULL DEFAULT '',
  telephone TEXT DEFAULT '',
  wilaya TEXT DEFAULT '',
  commune TEXT DEFAULT '',
  produits TEXT DEFAULT '',
  couleur TEXT DEFAULT '',
  taille TEXT DEFAULT '',
  total NUMERIC DEFAULT 0,
  statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'confirmée', 'livrée', 'annulée')),
  date TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;

-- 3. Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id TEXT DEFAULT '',
  messages JSONB DEFAULT '[]'::jsonb,
  date TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 4. Produits
CREATE TABLE IF NOT EXISTS produits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  nom TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  prix NUMERIC DEFAULT 0,
  devise TEXT DEFAULT 'DZD',
  tailles TEXT[] DEFAULT '{}',
  couleurs TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE produits ENABLE ROW LEVEL SECURITY;

-- 5. Config chatbot
CREATE TABLE IF NOT EXISTS config_chatbot (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_chatbot TEXT DEFAULT 'Yasmine',
  message_bienvenue TEXT DEFAULT 'Bonjour ! Comment puis-je vous aider ?',
  langue TEXT DEFAULT 'fr',
  photo_profil_url TEXT,
  actif BOOLEAN DEFAULT true,
  secret_token TEXT DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE config_chatbot ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_commandes_user_id ON commandes(user_id);
CREATE INDEX IF NOT EXISTS idx_commandes_created_at ON commandes(created_at);
CREATE INDEX IF NOT EXISTS idx_commandes_statut ON commandes(statut);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_produits_user_id ON produits(user_id);
CREATE INDEX IF NOT EXISTS idx_produits_actif ON produits(actif);
CREATE INDEX IF NOT EXISTS idx_config_chatbot_user_id ON config_chatbot(user_id);

-- ============================================
-- REALTIME
-- ============================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE commandes;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'commandes already in publication';
END;
$$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'conversations already in publication';
END;
$$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE produits;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'produits already in publication';
END;
$$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE config_chatbot;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'config_chatbot already in publication';
END;
$$;

-- ============================================
-- RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "commandes_select" ON commandes;
DROP POLICY IF EXISTS "commandes_insert" ON commandes;
DROP POLICY IF EXISTS "commandes_update" ON commandes;
CREATE POLICY "commandes_select" ON commandes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "commandes_insert" ON commandes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "commandes_update" ON commandes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "conversations_select" ON conversations;
DROP POLICY IF EXISTS "conversations_insert" ON conversations;
CREATE POLICY "conversations_select" ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "conversations_insert" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "produits_select" ON produits;
DROP POLICY IF EXISTS "produits_insert" ON produits;
DROP POLICY IF EXISTS "produits_update" ON produits;
DROP POLICY IF EXISTS "produits_delete" ON produits;
CREATE POLICY "produits_select" ON produits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "produits_insert" ON produits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "produits_update" ON produits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "produits_delete" ON produits FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "config_select" ON config_chatbot;
DROP POLICY IF EXISTS "config_insert" ON config_chatbot;
DROP POLICY IF EXISTS "config_update" ON config_chatbot;
CREATE POLICY "config_select" ON config_chatbot FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "config_insert" ON config_chatbot FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "config_update" ON config_chatbot FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FONCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION decrement_stock(p_user_id UUID, p_product_name TEXT)
RETURNS void AS $$
BEGIN
  UPDATE produits SET stock = GREATEST(stock - 1, 0)
  WHERE user_id = p_user_id AND LOWER(nom) = LOWER(p_product_name) AND stock > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER AUTO-CRÉATION PROFIL + CONFIG
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, secret_token, full_name, username, boutique_name)
  VALUES (NEW.id, gen_random_uuid(), NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'username', NEW.raw_user_meta_data ->> 'username');
  INSERT INTO public.config_chatbot (user_id, nom_chatbot, message_bienvenue, langue, actif)
  VALUES (NEW.id, 'Yasmine', 'Bonjour ! Je suis Yasmine, votre assistante virtuelle. Comment puis-je vous aider aujourd''hui ?', 'fr', true)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Créer config pour utilisateurs existants qui n'en ont pas
INSERT INTO config_chatbot (user_id, nom_chatbot, message_bienvenue, langue, actif)
SELECT p.id, 'Yasmine', 'Bonjour ! Je suis Yasmine, votre assistante virtuelle. Comment puis-je vous aider aujourd''hui ?', 'fr', true
FROM profiles p
LEFT JOIN config_chatbot c ON c.user_id = p.id
WHERE c.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('produits', 'produits', true)
ON CONFLICT (id) DO NOTHING;

-- S'assurer que le bucket est public
UPDATE storage.buckets SET public = true WHERE id = 'produits';

-- Supprimer toutes les politiques storage pour éviter les conflits
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own objects" ON storage.objects;
DROP POLICY IF EXISTS "storage_public_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_delete" ON storage.objects;

-- Lecture publique
CREATE POLICY "storage_public_select" ON storage.objects FOR SELECT USING (bucket_id = 'produits');
-- Upload authentifié
CREATE POLICY "storage_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'produits' AND auth.role() = 'authenticated');
-- Update authentifié
CREATE POLICY "storage_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'produits' AND auth.role() = 'authenticated');
-- Delete authentifié
CREATE POLICY "storage_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'produits' AND auth.role() = 'authenticated');
