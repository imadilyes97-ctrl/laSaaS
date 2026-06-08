import pg from 'pg';

const { Client } = pg;
const ports = [5432, 6543];

for (const port of ports) {
  try {
    const c = new Client({
      host: 'db.wbuscpclgihrynqkezxt.supabase.co',
      port,
      database: 'postgres',
      user: 'postgres',
      password: process.env.DATABASE_PASSWORD,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    await c.connect();
    const r = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log(`PORT ${port} CONNECTED! Tables:`, r.rows.map(x => x.table_name).join(', '));
    await c.end();
    process.exit(0);
  } catch (e) {
    console.log(`PORT ${port} FAIL:`, e.message.substring(0, 100));
  }
}
console.log('All ports failed');
