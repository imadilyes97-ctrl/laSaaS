# 🛠️ INSTRUCTIONS POUR CORRIGER LES PROBLÈMES SUPABASE

## 📌 Ce qui a été corrigé :

### 1️⃣ **Problèmes dans le CODE (fichiers du projet)**
- [x] `supabase/migrations/00001_initial_schema.sql` - Schéma complet
- [x] `src/app/api/admin/setup/route.ts` - Connexion Supabase fixée
- [x] `src/app/auth/register/page.tsx` - Création de config_chatbot ajoutée
- [x] `src/app/onboarding/page.tsx` - Upload de fichiers amélioré

### 2️⃣ **Problèmes dans la BASE DE DONNÉES (Supabase)**
- [ ] Tables manquantes : `produits`, `config_chatbot`
- [ ] Politiques RLS manquantes
- [ ] Trigger à mettre à jour
- [ ] Bucket de stockage à configurer

---

## 🚀 ÉTAPES À SUIVRE (dans l'ordre !)

### Étape 1 : Commit & Push le code sur GitHub

```bash
# Dans votre terminal, à la racine du projet
git add .
git commit -m "fix(supabase): complete schema, fix API routes, improve error handling"
git push origin master
```

✅ **Résultat** : Votre code est à jour sur GitHub

---

### Étape 2 : Exécuter le SQL dans Supabase

1. **Ouvrez votre projet Supabase** :
   - Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sélectionnez votre projet

2. **Ouvrez le SQL Editor** :
   - Dans la barre latérale gauche, cliquez sur **SQL Editor**

3. **Copiez-collez le SQL** :
   - Ouvrez le fichier `scripts/update_existing_db.sql` (que je viens de créer)
   - Copiez TOUT son contenu
   - Collez-le dans l'éditeur SQL de Supabase

4. **Exécutez le SQL** :
   - Cliquez sur le bouton **Run** (ou appuyez sur Ctrl+Entrée)
   - Attendez que l'exécution se termine (quelques secondes)

✅ **Résultat** : Votre base de données est maintenant complète et configurée correctement

---

### Étape 3 : Vérifier que tout fonctionne

```bash
# Dans votre terminal
node scripts/verify_setup.mjs
```

Si tout est OK, vous verrez :
```
✅ All tables exist! Setup looks good.
```

---

### Étape 4 : Tester l'application

1. **Démarrez votre application** :
   ```bash
   npm run dev
   ```

2. **Testez les fonctionnalités** :
   - Créer un nouveau compte (vérifiez que ça redirige vers l'onboarding)
   - Complétez l'onboarding (vérifiez que le logo upload fonctionne)
   - Allez dans le dashboard et vérifiez que tout s'affiche correctement

---

## ❓ Problèmes possibles et solutions

### « La migration Supabase échoue »
→ **Solution** : Exécutez le SQL manuellement comme montré à l'Étape 2

### « Le bucket de stockage n'est pas accessible »
→ **Solution** : Dans Supabase Dashboard, allez dans **Storage**, sélectionnez le bucket `produits`, et vérifiez que l'option « Public » est cochée

### « Les politiques RLS bloquent les requêtes »
→ **Solution** : Vérifiez que vous utilisez le bon client Supabase (avec le bon token) dans votre code

---

## ✨ C'est terminé !

Votre application devrait maintenant fonctionner sans les problèmes de blocage. Si vous rencontrez encore des soucis, dites-moi exactement quel message d'erreur vous obtenez et je vous aiderai à le résoudre.

💡 **Astuce** : Après ces corrections, pensez à faire un backup de votre base de données Supabase (dans les paramètres du projet).
