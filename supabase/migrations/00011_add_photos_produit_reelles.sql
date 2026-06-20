-- Ajouter deux colonnes pour séparer les photos officielles des photos réelles
ALTER TABLE produits
ADD COLUMN IF NOT EXISTS photos_produit TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS photos_reelles TEXT[] DEFAULT '{}';

-- Migrer les photos existantes vers photos_produit
UPDATE produits
SET photos_produit = ARRAY[photo_url]
WHERE photo_url != '' AND (photos_produit IS NULL OR photos_produit = '{}');

-- Copier l'ancien champ photos vers photos_produit si photos_produit est vide
UPDATE produits
SET photos_produit = photos
WHERE photos IS NOT NULL AND photos != '{}' AND (photos_produit IS NULL OR photos_produit = '{}');
