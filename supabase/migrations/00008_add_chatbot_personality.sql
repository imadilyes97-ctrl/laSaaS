-- Add personality columns to config_chatbot
ALTER TABLE config_chatbot
ADD COLUMN IF NOT EXISTS prompt_libre TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS prompt_role TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS prompt_ton TEXT DEFAULT 'professionnel',
ADD COLUMN IF NOT EXISTS prompt_regles TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS prompt_langue TEXT DEFAULT 'fr',
ADD COLUMN IF NOT EXISTS prompt_final TEXT DEFAULT '';
