# Supabase Issues and Fixes

## Issues Found:

1. **Database Schema Mismatch**: The `supabase/migrations/00001_initial_schema.sql` is missing several tables and policies compared to `scripts/setup.sql`

2. **Missing Tables**: The migration file doesn't include `produits` and `config_chatbot` tables

3. **Inconsistent RLS Policies**: Different naming conventions and missing policies

4. **Storage Bucket Issues**: Missing bucket creation and policies in the migration

5. **Trigger Problems**: Missing auto-creation trigger for config_chatbot

6. **Database Connection Issues**: The check_db.mjs script shows connection problems

## Fixes Applied:

### 1. Updated Migration File
Updated `supabase/migrations/00001_initial_schema.sql` to include all tables, proper RLS policies, and storage setup.

### 2. Fixed API Routes
- Fixed `src/app/api/admin/setup/route.ts` to properly handle database setup
- Fixed `src/app/api/products/route.ts` to use proper Supabase client

### 3. Fixed Client-side Issues
- Updated `src/app/auth/register/page.tsx` to handle profile creation properly
- Fixed `src/app/onboarding/page.tsx` to handle storage uploads correctly

### 4. Environment Configuration
Ensured all environment variables are properly referenced in `.env.local`

## Files Modified:
- `supabase/migrations/00001_initial_schema.sql` - Complete schema update
- `src/app/api/admin/setup/route.ts` - Fixed database setup logic
- `src/app/api/products/route.ts` - Fixed Supabase client usage
- `src/app/auth/register/page.tsx` - Fixed profile creation
- `src/app/onboarding/page.tsx` - Fixed storage uploads

## Next Steps:
1. Run the updated migration: `supabase migration up`
2. Test all API endpoints
3. Verify database connectivity
4. Test user registration and onboarding flow
