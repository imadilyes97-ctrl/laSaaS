-- Ensure config_chatbot table exists with all required columns
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

CREATE POLICY "Users can view own config"
  ON config_chatbot FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own config"
  ON config_chatbot FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own config"
  ON config_chatbot FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('produits', 'produits', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'produits');

CREATE POLICY "Authenticated Upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'produits');

CREATE POLICY "Authenticated Delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'produits');
