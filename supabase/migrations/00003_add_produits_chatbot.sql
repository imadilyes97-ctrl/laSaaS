-- Table des produits
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

-- Table de configuration du chatbot
CREATE TABLE IF NOT EXISTS config_chatbot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  nom_chatbot TEXT DEFAULT 'Yasmine',
  message_bienvenue TEXT DEFAULT 'Bonjour ! Comment puis-je vous aider ?',
  langue TEXT DEFAULT 'FR' CHECK (langue IN ('FR', 'AR', 'EN')),
  photo_profil_url TEXT DEFAULT '',
  actif BOOLEAN DEFAULT true,
  secret_token UUID DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ajouter colonne messages à conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS messages JSONB DEFAULT '[]'::jsonb;

-- Index
CREATE INDEX IF NOT EXISTS idx_produits_user_id ON produits(user_id);
CREATE INDEX IF NOT EXISTS idx_produits_actif ON produits(actif);
CREATE INDEX IF NOT EXISTS idx_config_chatbot_user_id ON config_chatbot(user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE produits;
ALTER PUBLICATION supabase_realtime ADD TABLE config_chatbot;

-- RLS
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_chatbot ENABLE ROW LEVEL SECURITY;

-- Politiques produits
CREATE POLICY "Users can view own produits"
  ON produits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own produits"
  ON produits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own produits"
  ON produits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own produits"
  ON produits FOR DELETE
  USING (auth.uid() = user_id);

-- Politiques config_chatbot
CREATE POLICY "Users can view own config_chatbot"
  ON config_chatbot FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own config_chatbot"
  ON config_chatbot FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own config_chatbot"
  ON config_chatbot FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger: créer config_chatbot automatiquement à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, secret_token, full_name, username)
  VALUES (NEW.id, gen_random_uuid(), '', '');
  INSERT INTO public.config_chatbot (user_id, nom_chatbot, message_bienvenue, langue)
  VALUES (NEW.id, 'Yasmine', 'Bonjour ! Je suis Yasmine, votre assistante virtuelle. Comment puis-je vous aider aujourd''hui ?', 'FR');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remplacer l'ancien trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Fonction pour décrémenter le stock
CREATE OR REPLACE FUNCTION decrement_stock(p_user_id UUID, p_product_name TEXT)
RETURNS void AS $$
BEGIN
  UPDATE produits
  SET stock = GREATEST(stock - 1, 0)
  WHERE user_id = p_user_id
    AND LOWER(nom) = LOWER(p_product_name)
    AND stock > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer config_chatbot pour les utilisateurs existants
INSERT INTO public.config_chatbot (user_id, nom_chatbot, message_bienvenue, langue)
SELECT p.id, 'Yasmine', 'Bonjour ! Je suis Yasmine, votre assistante virtuelle. Comment puis-je vous aider aujourd''hui ?', 'FR'
FROM public.profiles p
LEFT JOIN public.config_chatbot c ON c.user_id = p.id
WHERE c.id IS NULL
ON CONFLICT DO NOTHING;

-- Créer le bucket de stockage pour les images
INSERT INTO storage.buckets (id, name, public)
VALUES ('produits', 'produits', true)
ON CONFLICT (id) DO NOTHING;

-- Politique pour le bucket de stockage (lecture publique)
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'produits');

-- Politique pour l'upload (authentifié uniquement)
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'produits' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own objects"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'produits' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own objects"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'produits' AND auth.role() = 'authenticated');
