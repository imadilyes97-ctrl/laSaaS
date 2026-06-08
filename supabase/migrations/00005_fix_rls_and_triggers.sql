-- ============================================
-- MIGRATION 00005 — Correction RLS + Triggers
-- ============================================

-- ============================================
-- PARTIE 1 : STORAGE — Nettoyer et recréer les politiques
-- ============================================

-- Supprimer toutes les anciennes politiques du bucket produits
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own objects" ON storage.objects;

-- Lecture publique (tout le monde peut voir les images)
CREATE POLICY "storage_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'produits');

-- Upload pour utilisateurs authentifiés uniquement
CREATE POLICY "storage_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'produits'
    AND auth.role() = 'authenticated'
  );

-- Modification pour utilisateurs authentifiés uniquement
CREATE POLICY "storage_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'produits'
    AND auth.role() = 'authenticated'
  );

-- Suppression pour utilisateurs authentifiés uniquement
CREATE POLICY "storage_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'produits'
    AND auth.role() = 'authenticated'
  );

-- S'assurer que le bucket est bien public
UPDATE storage.buckets
SET public = true
WHERE id = 'produits';

-- ============================================
-- PARTIE 2 : CONFIG_CHATBOT — Recréer les politiques
-- ============================================

-- Supprimer anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view own config" ON config_chatbot;
DROP POLICY IF EXISTS "Users can view own config_chatbot" ON config_chatbot;
DROP POLICY IF EXISTS "Users can insert own config" ON config_chatbot;
DROP POLICY IF EXISTS "Users can insert own config_chatbot" ON config_chatbot;
DROP POLICY IF EXISTS "Users can update own config" ON config_chatbot;
DROP POLICY IF EXISTS "Users can update own config_chatbot" ON config_chatbot;

-- Créer les politiques avec des noms uniques
CREATE POLICY "config_select"
  ON config_chatbot FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "config_insert"
  ON config_chatbot FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "config_update"
  ON config_chatbot FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PARTIE 3 : TRIGGER AUTO-CRÉATION CONFIG
-- ============================================

-- Créer ou remplacer la fonction
CREATE OR REPLACE FUNCTION create_default_chatbot_config()
RETURNS TRIGGER AS $$
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_chatbot_config();

-- Créer une config pour les utilisateurs déjà existants qui n'en ont pas
INSERT INTO config_chatbot (user_id, nom_chatbot, message_bienvenue, langue, actif)
SELECT
  id,
  'Yasmine',
  'Bonjour ! Je suis Yasmine, votre assistante virtuelle. Comment puis-je vous aider aujourd''hui ?',
  'fr',
  true
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
