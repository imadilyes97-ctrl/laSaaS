// Test Supabase connection
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wbuscpclgihrynqkezxt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndidXNjcGNsZ2locnlucWtlenh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3ODMyMDYsImV4cCI6MjA5NjM1OTIwNn0.FeiuYfXHt9WrfrHuCJnzeHuxg4yZSAs0PjjBkjVeU_0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');

  try {
    // Test database connection
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Database error:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('✅ Database connection successful!');
      console.log('Sample data:', data);
    }

    // Test auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Auth error:', authError.message);
    } else {
      console.log('✅ Auth connection successful!');
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();