// Simple test to check if tables exist
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wbuscpclgihrynqkezxt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndidXNjcGNsZ2locnlucWtlenh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3ODMyMDYsImV4cCI6MjA5NjM1OTIwNn0.FeiuYfXHt9WrfrHuCJnzeHuxg4yZSAs0PjjBkjVeU_0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  console.log('Testing database tables existence...\n');

  const tablesToTest = ['profiles', 'config_chatbot', 'produits'];

  for (const table of tablesToTest) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`❌ Table ${table}: ${error.message}`);
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log(`   → Table ${table} does not exist in database!`);
        }
      } else {
        console.log(`✅ Table ${table}: exists`);
      }
    } catch (err) {
      console.error(`❌ Table ${table}: ${err.message}`);
    }
  }
}

testTables();