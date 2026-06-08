-- ============================================
-- MIGRATION 00006 — Garantir la table produits
-- ============================================

CREATE TABLE IF NOT EXISTS produits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  prix NUMERIC DEFAULT 0,
  devise TEXT DEFAULT 'DZD',
  tailles TEXT[] DEFAULT '{}',
  couleurs TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE produits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "produits_select" ON produits;
DROP POLICY IF EXISTS "produits_insert" ON produits;
DROP POLICY IF EXISTS "produits_update" ON produits;
DROP POLICY IF EXISTS "produits_delete" ON produits;
DROP POLICY IF EXISTS "Users can view own produits" ON produits;
DROP POLICY IF EXISTS "Users can insert own produits" ON produits;
DROP POLICY IF EXISTS "Users can update own produits" ON produits;
DROP POLICY IF EXISTS "Users can delete own produits" ON produits;

CREATE POLICY "produits_select" ON produits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "produits_insert" ON produits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "produits_update" ON produits FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "produits_delete" ON produits FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_produits_user_id ON produits(user_id);
CREATE INDEX IF NOT EXISTS idx_produits_actif ON produits(actif);
