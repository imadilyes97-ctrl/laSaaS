// Test if the handle_new_user trigger is causing issues
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wbuscpclgihrynqkezxt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndidXNjcGNsZ2locnlucWtlenh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc4MzIwNiwiZXhwIjoyMDk2MzU5MjA2fQ.qe-MeIWhUEd63mP51yMLwUZyL6_8oJaHdKxK_Alp5YY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTrigger() {
  console.log('Testing trigger and direct profile insertion...\n');

  // Test 1: Try to insert directly into profiles table
  console.log('1️⃣ Testing direct profile insertion...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        full_name: 'Test User',
        username: 'testuser',
        boutique_name: 'testuser',
      });

    if (error) {
      console.error('❌ Direct insertion failed:', error.message);
      console.error('Details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Direct insertion successful');
    }
  } catch (err) {
    console.error('❌ Direct insertion error:', err.message);
  }

  // Test 2: Check if the trigger exists and has proper permissions
  console.log('\n2️⃣ Checking trigger...');
  try {
    const { data, error } = await supabase
      .rpc('handle_new_user');

    if (error) {
      console.error('❌ Trigger test failed:', error.message);
    } else {
      console.log('✅ Trigger exists and is callable');
    }
  } catch (err) {
    console.error('❌ Trigger test error:', err.message);
  }

  // Test 3: Check RLS policies on profiles table
  console.log('\n3️⃣ Checking RLS policies...');
  try {
    // Try to read from profiles without authentication
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.log('✅ RLS is working (blocks unauthorized access)');
    } else {
      console.log('⚠️  RLS might not be properly configured');
    }
  } catch (err) {
    console.error('❌ RLS check error:', err.message);
  }
}

testTrigger();