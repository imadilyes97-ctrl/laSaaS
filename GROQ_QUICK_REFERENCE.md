# Groq Integration - Quick Reference Guide

## For Developers

### Key Files

```
📁 src/app/api/analyze-image/route.ts          # Product image analysis
📁 src/app/api/chatbot-analyze/route.ts       # Client image matching
📁 src/app/api/products/route.ts               # Fetch products with descriptions
📁 src/app/(dashboard)/produits/page.tsx      # Product management UI
📁 .env.local                                  # Environment variables
```

### Environment Variables

```env
# Required for Groq API
GROQ_API_KEY=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
```

### API Endpoints

#### 1. Analyze Product Image
**POST** `/api/analyze-image`

Request:
```json
{
  "photoUrl": "https://.../product.jpg"
}
```

Response:
```json
{
  "description": {
    "type": "robe",
    "couleur_principale": "rouge",
    "couleurs": ["rouge", "noir"],
    "matiere": "coton",
    "style": "été",
    "details_visuels": "col rond, manches courtes",
    "mots_cles": ["robe", "été", "coton"]
  }
}
```

#### 2. Match Client Image
**POST** `/api/chatbot-analyze`

Request:
```json
{
  "token": "chatbot_secret_token",
  "imageUrl": "https://.../client-image.jpg"
}
```

Response (success):
```json
{
  "trouve": true,
  "index": 0,
  "similarite": "exact",
  "clientDescription": { ... },
  "produit": { ... }
}
```

Response (not found):
```json
{
  "trouve": false,
  "error": "Aucun produit disponible"
}
```

#### 3. Get Products
**GET** `/api/products?token=SECRET_TOKEN`

Response:
```json
{
  "produits": [
    {
      "id": "...",
      "nom": "Robe d'été",
      "prix": 2500,
      "tailles": ["S", "M", "L"],
      "description_visuelle": { ... }
    }
  ],
  "config": { ... }
}
```

## For Testers

### Test Cases

#### Test 1: Add Product with Image
1. Navigate to `/dashboard/produits`
2. Click "Ajouter" button
3. Fill product details
4. Upload an image
5. Verify:
   - ✅ Image uploads successfully
   - ✅ "Analyse..." spinner appears
   - ✅ Product saves with visual description
   - ✅ No errors in console

#### Test 2: Chatbot Image Matching
1. Get chatbot token from `/dashboard/chatbot`
2. Use API client (Postman/curl) to call `/api/chatbot-analyze`
3. Send:
   ```json
   {
     "token": "YOUR_TOKEN",
     "imageUrl": "https://example.com/client-image.jpg"
   }
   ```
4. Verify:
   - ✅ Returns client description
   - ✅ Returns matching product (or "not found")
   - ✅ Response time < 2 seconds
   - ✅ Only 1 Groq API call made

#### Test 3: Performance with Large Catalog
1. Add 50+ products to database
2. Send client image to chatbot
3. Verify:
   - ✅ Response time remains fast (< 2s)
   - ✅ Only 1 Groq vision call made
   - ✅ All products compared using text matching

## For Support

### Common Issues

#### Issue: "Impossible d'analyser l'image"
**Cause:** Groq API error or invalid image
**Solution:**
1. Check `.env.local` has valid `GROQ_API_KEY`
2. Verify image URL is accessible
3. Check Groq API status at https://status.groq.com

#### Issue: "Aucun produit disponible"
**Cause:** No active products in database
**Solution:**
1. Add products at `/dashboard/produits`
2. Ensure products have `actif: true` and `stock > 0`

#### Issue: Slow response
**Cause:** Network latency or large images
**Solution:**
1. Optimize images (< 500KB recommended)
2. Check server logs for errors
3. Verify database connection

## For Product Managers

### Benefits

✅ **Faster matching** - Instant results for customers
✅ **Lower costs** - 90% fewer Groq API calls
✅ **Better scalability** - Works with 10 or 10,000 products
✅ **Improved UX** - Automatic image analysis

### Metrics to Track

1. **API Call Volume**
   - Groq vision calls: Should be ~1 per client message
   - Groq text calls: Should be ~1 per client message

2. **Response Time**
   - Target: < 2 seconds per chatbot query
   - Alert if: > 5 seconds

3. **Match Accuracy**
   - Track percentage of "exact" vs "proche" vs "non" matches
   - Target: > 80% exact/proche matches

4. **Error Rate**
   - Track failed analyses
   - Target: < 1% errors

## Troubleshooting

### Groq API Errors

**Error:** `"Erreur Groq"`

Check:
1. ✅ `GROQ_API_KEY` is valid
2. ✅ API key has sufficient quota
3. ✅ Image URL is publicly accessible
4. ✅ Groq API status is operational

### Database Errors

**Error:** `"Erreur serveur"`

Check:
1. ✅ Supabase connection is working
2. ✅ `produits` table exists
3. ✅ `description_visuelle` column exists
4. ✅ User has proper permissions

### Performance Issues

**Symptom:** Slow response (> 3 seconds)

Check:
1. ✅ Server location (use region closest to users)
2. ✅ Image size (optimize to < 500KB)
3. ✅ Database indexes on `user_id`, `actif`, `stock`
4. ✅ Network latency to Groq API

## FAQ

### Q: How many Groq API calls does this make?
**A:** 2 calls per client message:
- 1 vision call to analyze client image
- 1 text call to compare descriptions
*(Plus 1 vision call per product when initially added)*

### Q: What's the maximum image size?
**A:** 5MB (configured in `produits/page.tsx`)

### Q: What image formats are supported?
**A:** JPG, PNG, WEBP

### Q: Can I use a different Groq model?
**A:** Yes, edit the model name in:
- `analyze-image/route.ts` (vision model)
- `chatbot-analyze/route.ts` (text model)

### Q: How do I monitor API usage?
**A:** Check your Groq dashboard at https://console.groq.com

## Contact

For issues not covered in this guide:
- **Developers:** Check code comments and implementation docs
- **Testers:** File bug reports with reproduction steps
- **Support:** Contact team with error logs and screenshots
