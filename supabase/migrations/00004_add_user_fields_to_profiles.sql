-- Add missing user fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT DEFAULT '';

-- Update RLS policies to include new fields
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Update the trigger to include new fields
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, secret_token, full_name, username)
  VALUES (NEW.id, gen_random_uuid(), '', '');
  INSERT INTO public.config_chatbot (user_id, nom_chatbot, message_bienvenue, langue)
  VALUES (NEW.id, 'Yasmine', 'Bonjour ! Je suis Yasmine, votre assistante virtuelle. Comment puis-je vous aider aujourd''hui ?', 'FR');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;