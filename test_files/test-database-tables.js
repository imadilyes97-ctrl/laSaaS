// Test if required tables exist
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wbuscpclgihrynqkezxt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndidXNjcGNsZ2locnlucWtlenh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3ODMyMDYsImV4cCI6MjA5NjM1OTIwNn0.FeiuYfXHt9WrfrHuCJnzeHuxg4yZSAs0PjjBkjVeU_0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  console.log('Testing required database tables...\n');

  const tablesToTest = ['profiles', 'config_chatbot', 'produits'];

  for (const table of tablesToTest) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`❌ Table ${table}: ${error.message}`);
        if (error.message.includes('relation')) {
          console.log(`   → Table ${table} does not exist!`);
        }
      } else {
        console.log(`✅ Table ${table}: exists (${data.count || 0} rows)`);
      }
    } catch (err) {
      console.error(`❌ Table ${table}: ${err.message}`);
    }
  }

  console.log('\n📋 Summary:');
  console.log('- If any tables are missing, run scripts/update_existing_db.sql in Supabase SQL Editor');
  console.log('- If all tables exist but registration still fails, check RLS policies');
}

testTables();