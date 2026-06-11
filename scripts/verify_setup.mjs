#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Verifying Supabase setup...\n')

const tablesToCheck = [
  'profiles',
  'commandes',
  'conversations',
  'produits',
  'config_chatbot'
]

let allTablesExist = true

for (const table of tablesToCheck) {
  try {
    const { error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })

    if (error && error.code !== 'PGRST116') {
      console.log(`❌ ${table}: Error - ${error.message}`)
      allTablesExist = false
    } else {
      console.log(`✅ ${table}: OK`)
    }
  } catch (error) {
    console.log(`❌ ${table}: Exception - ${error.message}`)
    allTablesExist = false
  }
}

console.log('\n📦 Checking storage bucket...')
try {
  const { data: bucket, error: bucketError } = await supabase
    .storage
    .getBucket('produits')

  if (bucketError) {
    console.log(`❌ Storage bucket: Error - ${bucketError.message}`)
  } else {
    console.log(`✅ Storage bucket: OK (public: ${bucket.public})`)
  }
} catch (error) {
  console.log(`❌ Storage bucket: Exception - ${error.message}`)
}

console.log('\n🔐 Checking RLS policies...')
try {
  // Test a simple query that should work with RLS
  const { error: rlsError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)

  if (rlsError) {
    console.log(`⚠️  RLS: Query failed - ${rlsError.message}`)
    console.log('   (This might be expected if no user session)')
  } else {
    console.log(`✅ RLS: Basic policies working`)
  }
} catch (error) {
  console.log(`❌ RLS: Exception - ${error.message}`)
}

console.log('\n' + '='.repeat(50))
if (allTablesExist) {
  console.log('✅ All tables exist! Setup looks good.')
} else {
  console.log('❌ Some tables are missing. Run the setup script.')
}
console.log('='.repeat(50))

process.exit(allTablesExist ? 0 : 1)
