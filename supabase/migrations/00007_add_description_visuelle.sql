ALTER TABLE produits
ADD COLUMN IF NOT EXISTS description_visuelle JSONB DEFAULT '{}';
