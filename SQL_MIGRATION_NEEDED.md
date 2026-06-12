# SQL Migration Required for Groq Integration

## ⚠️ ACTION REQUIRED

**One SQL migration needs to be run for the Groq integration to work properly.**

## Migration Details

### File: `supabase/migrations/00007_add_description_visuelle.sql`

### SQL Command:
```sql
ALTER TABLE produits
ADD COLUMN IF NOT EXISTS description_visuelle JSONB DEFAULT '{}';
```

### Purpose:
Adds the `description_visuelle` column to store Groq's visual analysis of product images.

## How to Apply

### Quick Method (Recommended)
1. Go to Supabase Dashboard: https://app.supabase.com/
2. Select project: `wbuscpclgihrynqkezxt`
3. Click "SQL Editor" in left sidebar
4. Paste the SQL:
```sql
ALTER TABLE produits
ADD COLUMN IF NOT EXISTS description_visuelle JSONB DEFAULT '{}';
```
5. Click "Run"
6. Verify success message

### Alternative Method (CLI)
```bash
supabase migration up
```

### Manual Method (psql)
```bash
psql postgresql://postgres:[YOUR-PASSWORD]@db.wbuscpclgihrynqkezxt.supabase.co:5432/postgres -c \
"ALTER TABLE produits ADD COLUMN IF NOT EXISTS description_visuelle JSONB DEFAULT '{}';"
```

## Verification

After running, verify the column exists:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'produits' 
AND column_name = 'description_visuelle';
```

Expected result:
```
column_name       | data_type
-------------------+-----------
description_visuelle | jsonb
```

## Why This is Needed

The Groq integration stores visual descriptions of products in this column:
- When a product is added, its image is analyzed
- The JSON description is saved to `description_visuelle`
- The chatbot uses these pre-computed descriptions for fast matching

Without this column:
- ❌ Product analysis will fail
- ❌ Visual descriptions won't be saved
- ❌ Chatbot matching won't work

## Safety Notes

✅ **Safe to run multiple times** - `IF NOT EXISTS` prevents errors
✅ **No data loss** - Only adds a new column
✅ **Backward compatible** - Existing code continues to work
✅ **Default value** - New rows get empty JSON object

## Next Steps

1. ✅ Run the SQL migration
2. ✅ Verify column was added
3. ✅ Test product addition with image analysis
4. ✅ Test chatbot image matching
5. ✅ Deploy to production

## Need Help?

If you're unsure how to run this migration, you have options:

1. **Ask me** - I can guide you through the process
2. **Supabase docs** - https://supabase.com/docs/guides/database
3. **Contact support** - Supabase support can help

The migration is simple and safe to run! 🚀
