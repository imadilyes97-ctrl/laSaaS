-- Table des services pour les prestataires
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  prix NUMERIC DEFAULT 0,
  devise TEXT DEFAULT 'DZD',
  type_prix TEXT DEFAULT 'fixe' CHECK (type_prix IN ('fixe', 'heure', 'seance', 'devis')),
  duree INTEGER DEFAULT 60,
  categorie TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  photos TEXT[] DEFAULT '{}',
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_select" ON services FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "services_insert" ON services FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "services_update" ON services FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "services_delete" ON services FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_actif ON services(actif);
