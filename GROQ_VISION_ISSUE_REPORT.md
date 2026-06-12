# Rapport sur le problème d'intégration Groq Vision

## Problème identifié

L'intégration Groq pour l'analyse visuelle des produits ne fonctionne pas car **Groq ne supporte plus les modèles avec capacités de vision** à partir de juin 2026.

## Preuves

### 1. Erreur du modèle original
```json
{
  "error": {
    "message": "The model `llama-3.2-11b-vision-preview` has been decommissioned and is no longer supported. Please refer to https://console.groq.com/docs/deprecations for a recommendation on which model to use instead.",
    "type": "invalid_request_error",
    "code": "model_decommissioned"
  }
}
```

### 2. Tentative avec un autre modèle
```json
{
  "error": {
    "message": "The model `llama-3-70b-8192` does not exist or you do not have access to it.",
    "type": "invalid_request_error",
    "code": "model_not_found"
  }
}
```

### 3. Recherche de documentation
D'après la [documentation officielle Groq](https://console.groq.com/docs/models) en juin 2026 :
- Aucun modèle avec capacités de vision n'est explicitement listé
- La section "OCR and Image Recognition" est mentionnée comme une fonctionnalité principale, mais aucun modèle spécifique n'est associé à cette capacité

## Solutions proposées

### Option 1: Changer de fournisseur d'IA Vision
Remplacer Groq par un autre fournisseur qui supporte l'analyse d'images :

**Fournisseurs alternatifs:**
- **OpenAI**: Modèle `gpt-4-vision-preview` ou `gpt-4o`
- **Google AI**: Modèle `gemini-pro-vision`
- **Anthropic**: Modèle `claude-3-opus` (capacités multimodales)
- **AWS**: Amazon Rekognition

**Avantages:**
- Solutions matures et bien documentées
- Bonne précision pour l'analyse d'images

**Inconvénients:**
- Coût potentiellement plus élevé
- Nécessite de migrer le code

### Option 2: Utiliser une approche hybride
Combiner Groq (pour le texte) avec un service d'analyse d'image dédié :

**Architecture proposée:**
1. Utiliser un service spécialisé pour extraire les caractéristiques de l'image (couleurs, formes, etc.)
2. Envoyer ces caractéristiques à Groq pour générer la description textuelle

**Services d'analyse d'image:**
- Cloudinary
- Imagga
- Clarifai
- Google Cloud Vision API

### Option 3: Implémenter une solution maison (moins recommandée)
Utiliser des bibliothèques open-source pour l'analyse d'images :
- OpenCV pour la détection de couleurs et formes
- TensorFlow.js pour des modèles légers
- Combiner avec Groq pour la génération textuelle

## Recommandation

**Solution recommandée: Option 1 avec OpenAI GPT-4o**

**Raisons:**
1. GPT-4o est un modèle multimodal de pointe (juin 2026)
2. Excellente documentation et support
3. Capable de générer des descriptions structurées en JSON
4. Intégration simple avec l'architecture existante

## Étapes pour migrer vers OpenAI

### 1. Installer le package OpenAI
```bash
npm install openai
```

### 2. Mettre à jour `src/app/api/analyze-image/route.ts`
```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Remplacer l'appel Groq par:
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: photoUrl } },
        {
          type: "text",
          text: `Décris ce produit en JSON: {"type": ..., "couleur_principale": ..., ...}`
        },
      ],
    },
  ],
  max_tokens: 400,
});

const description = JSON.parse(response.choices[0].message.content);
```

### 3. Mettre à jour les variables d'environnement
Ajouter dans `.env.local`:
```
OPENAI_API_KEY=votre_clé_openai
```

### 4. Mettre à jour l'endpoint manuel
Appliquer les mêmes changements à `src/app/api/analyze-products/route.ts`

## Coût estimé

**OpenAI GPT-4o (juin 2026):**
- Entrée: ~$5 par million de tokens
- Sortie: ~$15 par million de tokens
- Pour une image + 400 tokens de sortie: ~$0.001 par analyse

**Comparaison avec Groq (avant désactivation):**
- Groq était moins cher (~$0.20 par million de tokens)
- Mais la précision et les capacités multimodales de GPT-4o justifient le coût

## Migration progressive

Pour minimiser l'impact:

1. **Conserver l'architecture actuelle** (mêmes endpoints, même structure de données)
2. **Ajouter un flag de fonctionnalité** pour basculer entre Groq et OpenAI
3. **Migrer progressivement** les produits existants
4. **Monitorer les coûts** avec des alertes

## Code de migration suggéré

```typescript
// Dans src/app/api/analyze-image/route.ts
const ANALYSIS_PROVIDER = process.env.ANALYSIS_PROVIDER || "openai"; // "groq" ou "openai"

if (ANALYSIS_PROVIDER === "groq") {
  // Code existant avec Groq
} else {
  // Nouveau code avec OpenAI
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [/* ... */],
  });
  return JSON.parse(response.choices[0].message.content);
}
```

## Conclusion

L'intégration Groq pour la vision doit être remplacée par une solution alternative. **OpenAI GPT-4o est la solution recommandée** pour sa maturité, ses capacités multimodales et sa facilité d'intégration.

**Prochaines étapes:**
1. [ ] Créer un compte OpenAI et obtenir une clé API
2. [ ] Mettre à jour le code selon les recommandations ci-dessus
3. [ ] Tester avec des produits réels
4. [ ] Déployer en production avec monitoring des coûts
5. [ ] Documenter la nouvelle intégration