// Test the actual registration process
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wbuscpclgihrynqkezxt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndidXNjcGNsZ2locnlucWtlenh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3ODMyMDYsImV4cCI6MjA5NjM1OTIwNn0.FeiuYfXHt9WrfrHuCJnzeHuxg4yZSAs0PjjBkjVeU_0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRegistration() {
  console.log('Testing registration process...\n');

  // Generate a test email
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  const testUsername = 'testuser';
  const testFullName = 'Test User';

  console.log(`Attempting to register: ${testEmail}\n`);

  try {
    // Step 1: Sign up user
    console.log('1️⃣ Creating user account...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testFullName,
          username: testUsername,
        },
      },
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }

    console.log('✅ User account created:', authData.user?.id);

    // Step 2: Try to upsert profile (this is where the error likely occurs)
    console.log('\n2️⃣ Creating/updating profile...');
    const userId = authData.user?.id;

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: testFullName,
        username: testUsername,
        boutique_name: testUsername,
      })
      .select();

    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
      console.error('Error details:', JSON.stringify(profileError, null, 2));
      return;
    }

    console.log('✅ Profile created/updated:', profileData?.id);

    // Step 3: Try to create config_chatbot
    console.log('\n3️⃣ Creating chatbot config...');
    const { error: configError } = await supabase
      .from('config_chatbot')
      .upsert({
        user_id: userId,
        nom_chatbot: 'Yasmine',
        message_bienvenue: 'Bonjour ! Je suis Yasmine, votre assistante virtuelle.',
        langue: 'fr',
        actif: true,
      });

    if (configError) {
      console.error('❌ Config error:', configError.message);
      console.error('Error details:', JSON.stringify(configError, null, 2));
      return;
    }

    console.log('✅ Chatbot config created');
    console.log('\n🎉 Registration process completed successfully!');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.error(err);
  }
}

testRegistration();