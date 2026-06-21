-- ============================================
-- Ajout des colonnes de livraison pour les produits
-- ============================================

ALTER TABLE produits
ADD COLUMN IF NOT EXISTS livraison_domicile INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS livraison_bureau INTEGER DEFAULT 0;
