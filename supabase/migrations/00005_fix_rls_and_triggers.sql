-- ============================================
-- MIGRATION 00005 — Correction RLS + Triggers
-- ============================================

-- ============================================
-- PARTIE 0 : CRÉER LA TABLE SI ELLE N'EXISTE PAS
-- ============================================
CREATE TABLE IF NOT EXISTS config_chatbot (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nom_chatbot TEXT DEFAULT 'Yasmine',
  message_bienvenue TEXT DEFAULT 'Bonjour ! Comment puis-je vous aider ?',
  langue TEXT DEFAULT 'fr',
  photo_profil_url TEXT,
  actif BOOLEAN DEFAULT true,
  secret_token TEXT DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE config_chatbot ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTIE 1 : CONFIG_CHATBOT — Politiques RLS
-- ============================================
DROP POLICY IF EXISTS "Users can view own config" ON config_chatbot;
DROP POLICY IF EXISTS "Users can view own config_chatbot" ON config_chatbot;
DROP POLICY IF EXISTS "Users can insert own config" ON config_chatbot;
DROP POLICY IF EXISTS "Users can insert own config_chatbot" ON config_chatbot;
DROP POLICY IF EXISTS "Users can update own config" ON config_chatbot;
DROP POLICY IF EXISTS "Users can update own config_chatbot" ON config_chatbot;
DROP POLICY IF EXISTS "config_select" ON config_chatbot;
DROP POLICY IF EXISTS "config_insert" ON config_chatbot;
DROP POLICY IF EXISTS "config_update" ON config_chatbot;

CREATE POLICY "config_select" ON config_chatbot FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "config_insert" ON config_chatbot FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "config_update" ON config_chatbot FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PARTIE 2 : STORAGE — Politiques bucket produits
-- ============================================
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

CREATE POLICY "storage_public_select" ON storage.objects FOR SELECT USING (bucket_id = 'produits');
CREATE POLICY "storage_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'produits' AND auth.role() = 'authenticated');
CREATE POLICY "storage_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'produits' AND auth.role() = 'authenticated');
CREATE POLICY "storage_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'produits' AND auth.role() = 'authenticated');

UPDATE storage.buckets SET public = true WHERE id = 'produits';

-- ============================================
-- PARTIE 3 : TRIGGER AUTO-CRÉATION CONFIG
-- ============================================
CREATE OR REPLACE FUNCTION create_default_chatbot_config()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, secret_token, full_name, username, boutique_name)
  VALUES (NEW.id, gen_random_uuid(), NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'username', NEW.raw_user_meta_data ->> 'username')
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    boutique_name = EXCLUDED.boutique_name;

  INSERT INTO config_chatbot (user_id, nom_chatbot, message_bienvenue, langue, actif)
  VALUES (
    NEW.id,
    'Yasmine',
    'Bonjour ! Je suis Yasmine, votre assistante virtuelle. Comment puis-je vous aider aujourd''hui ?',
    'fr',
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_chatbot_config();

-- ============================================
-- PARTIE 4 : CONFIG POUR UTILISATEURS EXISTANTS
-- ============================================
INSERT INTO config_chatbot (user_id, nom_chatbot, message_bienvenue, langue, actif)
SELECT p.id, 'Yasmine', 'Bonjour ! Je suis Yasmine, votre assistante virtuelle. Comment puis-je vous aider aujourd''hui ?', 'fr', true
FROM profiles p
LEFT JOIN config_chatbot c ON c.user_id = p.id
WHERE c.id IS NULL
ON CONFLICT (user_id) DO NOTHING;
