# Débogage de l'intégration Groq

## Problème initial
La colonne `description_visuelle` reste vide `{}` quand un produit est ajouté — l'analyse Groq ne se déclenche pas.

## Actions réalisées

### 1. Ajout de logs dans l'API d'analyse d'image
**Fichier modifié:** `src/app/api/analyze-image/route.ts`

Ajout des logs suivants pour déboguer l'appel à l'API Groq :
- `console.log('Appel Groq pour photo:', photoUrl)` - pour vérifier que l'URL de la photo est correcte
- `console.log('Réponse Groq status:', groqResp.status)` - pour vérifier le statut de la réponse
- `console.log('Erreur Groq:', errText)` - pour afficher les erreurs détaillées
- `console.log('Réponse Groq data:', groqData)` - pour afficher la réponse complète

### 2. Vérification de la configuration
**Fichier vérifié:** `.env.local`

La clé API Groq est correctement configurée :
```
GROQ_API_KEY=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
```

### 3. Création d'un endpoint manuel pour l'analyse des produits existants
**Fichier créé:** `src/app/api/analyze-products/route.ts`

Cet endpoint permet d'analyser tous les produits existants qui ont une `photo_url` et de remplir leur `description_visuelle`.

**Fonctionnalités:**
- Vérification du token secret pour la sécurité
- Récupération de tous les produits avec `photo_url`
- Appel à l'API Groq pour chaque produit
- Mise à jour de la base de données avec les descriptions visuelles
- Logs détaillés pour chaque étape

**Utilisation:**
```bash
GET /api/analyze-products?token=SECRET_TOKEN
```

Où `SECRET_TOKEN` est défini dans `.env.local` comme `yasmine_secret_2026`.

### 4. Amélioration du client Supabase
**Fichier modifié:** `src/lib/supabase.ts`

Ajout d'une fonction `createServerSupabaseClient()` pour une utilisation côté serveur dans les endpoints API.

### 5. Script de test
**Fichier créé:** `scripts/test_analyze_products.js`

Script Node.js pour tester l'endpoint manuellement.

## Étapes de vérification

### Pour les nouveaux produits
1. Vérifier les logs dans la console lors de l'ajout d'un produit
2. Vérifier que l'URL de la photo est publique et accessible depuis Internet
3. Vérifier que la réponse de Groq contient bien les données attendues

### Pour les produits existants
1. Exécuter l'endpoint manuel :
   ```bash
   curl "http://localhost:3000/api/analyze-products?token=yasmine_secret_2026"
   ```
   ou utiliser le script Node.js :
   ```bash
   node scripts/test_analyze_products.js
   ```

2. Vérifier les logs pour chaque produit analysé
3. Vérifier dans la base de données que les `description_visuelle` sont bien remplies

## Problèmes potentiels et solutions

### 1. URL de photo non publique
**Symptôme:** Groq retourne une erreur 403 ou 404
**Solution:** Vérifier que le bucket Supabase Storage a les bonnes permissions RLS pour permettre l'accès public en lecture.

### 2. Clé API Groq invalide
**Symptôme:** Groq retourne une erreur 401
**Solution:** Vérifier que `GROQ_API_KEY` est correct dans `.env.local` et sur Vercel.

### 3. Format de réponse inattendu
**Symptôme:** Erreur lors du parsing JSON
**Solution:** Vérifier le format de la réponse de Groq et ajuster le code de parsing si nécessaire.

### 4. Problème de CORS
**Symptôme:** Erreur CORS lors de l'appel à l'API Groq
**Solution:** Vérifier que l'URL de l'API Groq est correcte et que les headers sont bien configurés.

## Déploiement sur Vercel

Assurez-vous que :
1. La variable d'environnement `GROQ_API_KEY` est définie dans les paramètres du projet Vercel
2. La variable d'environnement `SECRET_TOKEN` est définie (pour l'endpoint manuel)
3. Les logs sont activés pour pouvoir déboguer en production

## Commandes utiles

```bash
# Tester l'endpoint manuel
curl "http://localhost:3000/api/analyze-products?token=yasmine_secret_2026"

# Voir les logs
tail -f .next/logs/server.log

# Tester avec le script Node.js
node scripts/test_analyze_products.js
```

## Prochaines étapes

1. Tester l'ajout d'un nouveau produit et vérifier les logs
2. Exécuter l'endpoint manuel pour analyser les produits existants
3. Vérifier dans la base de données que les descriptions visuelles sont bien remplies
4. Si des erreurs persistent, consulter les logs pour identifier la cause racine