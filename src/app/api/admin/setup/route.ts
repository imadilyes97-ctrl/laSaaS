import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Pool } from "pg"

const SQL = `
-- Produits
CREATE TABLE IF NOT EXISTS produits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  nom TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  prix NUMERIC DEFAULT 0,
  devise TEXT DEFAULT 'DZD',
  tailles TEXT[] DEFAULT '{}',
  couleurs TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE produits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own produits" ON produits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own produits" ON produits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own produits" ON produits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own produits" ON produits FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_produits_user_id ON produits(user_id);
CREATE INDEX IF NOT EXISTS idx_produits_actif ON produits(actif);

ALTER PUBLICATION supabase_realtime ADD TABLE produits;

-- Config chatbot
CREATE TABLE IF NOT EXISTS config_chatbot (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_chatbot TEXT DEFAULT 'Yasmine',
  message_bienvenue TEXT DEFAULT 'Bonjour ! Comment puis-je vous aider ?',
  langue TEXT DEFAULT 'fr',
  photo_profil_url TEXT,
  actif BOOLEAN DEFAULT true,
  secret_token TEXT DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE config_chatbot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own config" ON config_chatbot FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own config" ON config_chatbot FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own config" ON config_chatbot FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_config_chatbot_user_id ON config_chatbot(user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE config_chatbot;

-- Storage policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'produits');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'produits');
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'produits');

-- Decrement stock function
CREATE OR REPLACE FUNCTION decrement_stock(p_user_id UUID, p_product_name TEXT)
RETURNS void AS $$
BEGIN
  UPDATE produits SET stock = GREATEST(stock - 1, 0)
  WHERE user_id = p_user_id AND LOWER(nom) = LOWER(p_product_name) AND stock > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Config for existing users
INSERT INTO public.config_chatbot (user_id, nom_chatbot, message_bienvenue, langue)
SELECT p.id, 'Yasmine', 'Bonjour ! Je suis Yasmine, votre assistante virtuelle. Comment puis-je vous aider aujourd''hui ?', 'fr'
FROM public.profiles p
LEFT JOIN public.config_chatbot c ON c.user_id = p.id
WHERE c.id IS NULL
ON CONFLICT DO NOTHING;
`

export async function POST() {
  const results: { table: string; status: string; error?: string }[] = []

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { data: b } = await supabase.storage.getBucket("produits")
    if (!b) {
      await supabase.storage.createBucket("produits", { public: true })
      results.push({ table: "storage.bucket", status: "created" })
    } else {
      results.push({ table: "storage.bucket", status: "exists" })
    }
  } catch {
    results.push({ table: "storage.bucket", status: "error", error: "Impossible de créer le bucket" })
  }

  const tables = ["profiles", "commandes", "conversations", "produits", "config_chatbot"]
  for (const table of tables) {
    const { error } = await supabase.from(table).select("id", { count: "exact", head: true })
    results.push({
      table: `db.${table}`,
      status: error ? "missing" : "exists",
      error: error ? (error.code === "PGRST116" ? undefined : error.message) : undefined,
    })
  }

  const pool = new Pool({
    host: `db.${process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/https:\/\/(.+)\.supabase\.co/)![1]}.supabase.co`,
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: process.env.DATABASE_PASSWORD,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  })

  try {
    const client = await pool.connect()
    await client.query(SQL)
    client.release()
    results.push({ table: "sql.execution", status: "success" })
  } catch (e: any) {
    results.push({ table: "sql.execution", status: "failed", error: e.message?.substring(0, 150) })
  }

  await pool.end()

  return NextResponse.json({ results })
}
