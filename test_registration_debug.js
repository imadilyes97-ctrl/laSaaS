// Test de débogage de l'inscription
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wbuscpclgihrynqkezxt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndidXNjcGNsZ2locnlucWtlenh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3ODMyMDYsImV4cCI6MjA5NjM1OTIwNn0.FeiuYfXHt9WrfrHuCJnzeHuxg4yZSAs0PjjBkjVeU_0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRegistration() {
  console.log('🔍 Débogage du processus d\'inscription...\n');

  // Test 1: Vérifier si la fonction existe
  console.log('1️⃣ Vérification de la fonction handle_new_user...');
  try {
    const { data, error } = await supabase
      .rpc('handle_new_user');

    if (error) {
      console.log('❌ Fonction introuvable ou erreur:', error.message);
    } else {
      console.log('✅ Fonction existe et est accessible');
    }
  } catch (err) {
    console.log('❌ Erreur lors de l\'appel de la fonction:', err.message);
  }

  // Test 2: Essayer de créer un utilisateur
  console.log('\n2️⃣ Tentative de création d\'un utilisateur...');
  const testEmail = `test-${Date.now()}@debug.com`;

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123',
    });

    if (authError) {
      console.log('❌ Erreur d\'authentification:', authError.message);
      console.log('Détails:', JSON.stringify(authError, null, 2));

      // Vérifier si c'est une erreur de trigger
      if (authError.message.includes('handle_new_user')) {
        console.log('\n🔴 Problème identifié: La fonction handle_new_user n\'est pas accessible');
      }
    } else {
      console.log('✅ Utilisateur créé avec succès:', authData.user?.id);
    }
  } catch (err) {
    console.log('❌ Erreur inattendue:', err.message);
  }
}

debugRegistration();