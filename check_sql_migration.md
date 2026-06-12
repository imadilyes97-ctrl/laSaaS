# SQL Migration Check for Groq Integration

## Database Schema Status

### Required Migration

The Groq integration requires the `description_visuelle` column on the `produits` table.

**Migration File:** `supabase/migrations/00007_add_description_visuelle.sql`

**SQL:**
```sql
ALTER TABLE produits
ADD COLUMN IF NOT EXISTS description_visuelle JSONB DEFAULT '{}';
```

### How to Check if Migration is Needed

#### Option 1: Check via Supabase Dashboard
1. Go to https://app.supabase.com/
2. Select your project (wbuscpclgihrynqkezxt)
3. Click on "Table Editor"
4. Select the `produits` table
5. Check if `description_visuelle` column exists

#### Option 2: Check via SQL Query
Run this query in the Supabase SQL editor:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'produits' 
AND column_name = 'description_visuelle';
```

- If it returns a row → Column exists ✅
- If it returns nothing → Column missing ❌

#### Option 3: Check via psql
```bash
psql postgresql://postgres:[YOUR-PASSWORD]@db.wbuscpclgihrynqkezxt.supabase.co:5432/postgres

\dt produits
\d+ produits
```

### How to Apply the Migration

#### Option 1: Run via Supabase Dashboard
1. Go to SQL Editor
2. Paste the SQL:
```sql
ALTER TABLE produits
ADD COLUMN IF NOT EXISTS description_visuelle JSONB DEFAULT '{}';
```
3. Click "Run"

#### Option 2: Run via supabase CLI
```bash
supabase migration up
```

#### Option 3: Run manually via psql
```bash
psql postgresql://postgres:[YOUR-PASSWORD]@db.wbuscpclgihrynqkezxt.supabase.co:5432/postgres -c \
"ALTER TABLE produits ADD COLUMN IF NOT EXISTS description_visuelle JSONB DEFAULT '{}';"
```

### Verification

After running the migration, verify it worked:

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

### Notes

1. **IF NOT EXISTS** - The migration uses `IF NOT EXISTS` so it's safe to run multiple times
2. **DEFAULT '{}'** - New rows will have an empty JSON object by default
3. **JSONB type** - Efficient for querying and indexing JSON data
4. **Existing data** - Existing rows will have NULL or default value (depending on your Supabase version)

### Current Status

Based on the git history and file timestamps:
- Migration file was created on June 12, 2026
- The file is only 87 bytes (simple ALTER TABLE)
- Uses `IF NOT EXISTS` for safety

**Recommendation:** Run the migration to ensure the column exists, even if you think it might already be there. The `IF NOT EXISTS` clause makes it safe to run multiple times.

### SQL to Run

```sql
ALTER TABLE produits
ADD COLUMN IF NOT EXISTS description_visuelle JSONB DEFAULT '{}';
```

This is the ONLY SQL migration needed for the Groq integration to work properly.
