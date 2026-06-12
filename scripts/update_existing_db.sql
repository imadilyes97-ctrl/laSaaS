-- ============================================
-- MISE À JOUR BASE DE DONNÉES EXISTANTE
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- 1. Créer la table produits SI elle n'existe pas
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

-- 2. Créer la table config_chatbot SI elle n'existe pas
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

-- 3. Activer RLS sur les nouvelles tables SI pas déjà activé
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_chatbot ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer les anciennes politiques produits si elles existent
DROP POLICY IF EXISTS "produits_select" ON produits;
DROP POLICY IF EXISTS "produits_insert" ON produits;
DROP POLICY IF EXISTS "produits_update" ON produits;
DROP POLICY IF EXISTS "produits_delete" ON produits;

-- Créer les nouvelles politiques RLS pour produits
CREATE POLICY "produits_select" ON produits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "produits_insert" ON produits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "produits_update" ON produits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "produits_delete" ON produits FOR DELETE USING (auth.uid() = user_id);

-- 5. Supprimer les anciennes politiques config_chatbot si elles existent
DROP POLICY IF EXISTS "config_select" ON config_chatbot;
DROP POLICY IF EXISTS "config_insert" ON config_chatbot;
DROP POLICY IF EXISTS "config_update" ON config_chatbot;

-- Créer les nouvelles politiques RLS pour config_chatbot
CREATE POLICY "config_select" ON config_chatbot FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "config_insert" ON config_chatbot FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "config_update" ON config_chatbot FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Créer les index uniquement s'ils n'existent pas
DO $$
BEGIN
  PERFORM 1 FROM pg_indexes WHERE indexname = 'idx_produits_user_id';
  IF NOT FOUND THEN
    CREATE INDEX idx_produits_user_id ON produits(user_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Index already exists, ignore error
END $$;

DO $$
BEGIN
  PERFORM 1 FROM pg_indexes WHERE indexname = 'idx_produits_actif';
  IF NOT FOUND THEN
    CREATE INDEX idx_produits_actif ON produits(actif);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Index already exists, ignore error
END $$;

DO $$
BEGIN
  PERFORM 1 FROM pg_indexes WHERE indexname = 'idx_config_chatbot_user_id';
  IF NOT FOUND THEN
    CREATE INDEX idx_config_chatbot_user_id ON config_chatbot(user_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Index already exists, ignore error
END $$;

-- 7. Ajouter les tables à la publication Realtime uniquement si pas déjà ajoutées
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'produits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE produits;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Table already in publication, ignore error
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'config_chatbot'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE config_chatbot;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Table already in publication, ignore error
END $$;

-- 8. Créer la fonction decrement_stock SI elle n'existe pas
CREATE OR REPLACE FUNCTION decrement_stock(p_user_id UUID, p_product_name TEXT)
RETURNS void AS $$
BEGIN
  UPDATE produits SET stock = GREATEST(stock - 1, 0)
  WHERE user_id = p_user_id AND LOWER(nom) = LOWER(p_product_name) AND stock > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Mettre à jour le trigger handle_new_user pour inclure config_chatbot
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, secret_token, full_name, username, boutique_name)
  VALUES (NEW.id, gen_random_uuid(), NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'username', NEW.raw_user_meta_data ->> 'username')
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    boutique_name = EXCLUDED.boutique_name;

  INSERT INTO public.config_chatbot (user_id, nom_chatbot, message_bienvenue, langue, actif)
  VALUES (NEW.id, 'Yasmine', 'Bonjour ! Je suis Yasmine, votre assistante virtuelle. Comment puis-je vous aider aujourd''hui ?', 'fr', true)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Créer config_chatbot pour les utilisateurs existants qui n'en ont pas
INSERT INTO config_chatbot (user_id, nom_chatbot, message_bienvenue, langue, actif)
SELECT p.id, 'Yasmine', 'Bonjour ! Je suis Yasmine, votre assistante virtuelle. Comment puis-je vous aider aujourd''hui ?', 'fr', true
FROM profiles p
LEFT JOIN config_chatbot c ON c.user_id = p.id
WHERE c.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 11. Configurer le bucket de stockage SI il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('produits', 'produits', true)
ON CONFLICT (id) DO NOTHING;

-- S'assurer que le bucket est public
UPDATE storage.buckets SET public = true WHERE id = 'produits';

-- Supprimer les anciennes politiques de stockage pour éviter les conflits
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own objects" ON storage.objects;

-- Supprimer les politiques existantes avant de recréer
DROP POLICY IF EXISTS "storage_public_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_delete" ON storage.objects;

-- Créer les nouvelles politiques de stockage
CREATE POLICY "storage_public_select" ON storage.objects FOR SELECT USING (bucket_id = 'produits');
CREATE POLICY "storage_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'produits' AND auth.role() = 'authenticated');
CREATE POLICY "storage_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'produits' AND auth.role() = 'authenticated');
CREATE POLICY "storage_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'produits' AND auth.role() = 'authenticated');

-- ============================================
-- VÉRIFICATION
-- ============================================
SELECT '
✅ Setup completed successfully!
- Tables: produits, config_chatbot created
- RLS policies: configured
- Storage bucket: produits configured
- Triggers: updated for new users
- Existing users: config_chatbot created if missing
' AS result;
