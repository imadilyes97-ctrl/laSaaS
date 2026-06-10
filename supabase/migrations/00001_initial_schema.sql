-- Table des profils clients
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  secret_token UUID DEFAULT gen_random_uuid() UNIQUE,
  boutique_name TEXT DEFAULT '',
  full_name TEXT DEFAULT '',
  username TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des commandes
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

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id TEXT DEFAULT '',
  date TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_commandes_user_id ON commandes(user_id);
CREATE INDEX IF NOT EXISTS idx_commandes_created_at ON commandes(created_at);
CREATE INDEX IF NOT EXISTS idx_commandes_statut ON commandes(statut);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Activer Realtime sur les tables
ALTER PUBLICATION supabase_realtime ADD TABLE commandes;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Politiques RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs ne voient que leurs propres données
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own commandes"
  ON commandes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commandes"
  ON commandes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commandes"
  ON commandes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger: créer automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, secret_token, full_name, username)
  VALUES (NEW.id, gen_random_uuid(), '', '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
