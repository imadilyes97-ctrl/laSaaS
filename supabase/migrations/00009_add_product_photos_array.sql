-- Ajouter une colonne photos (tableau d'URLs) à la table produits
-- pour supporter plusieurs images par produit
ALTER TABLE produits
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

-- Mettre à jour les produits existants : si photo_url est défini,
-- l'ajouter comme premier élément du tableau photos
UPDATE produits
SET photos = ARRAY[photo_url]
WHERE photo_url != '' AND (photos IS NULL OR photos = '{}');
