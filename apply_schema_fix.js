const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env.local');
const envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const env = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map((line) => {
  const idx = line.indexOf('=');
  if (idx === -1) return [line, ''];
  return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
}));
if (!env.DATABASE_URL) {
  console.error('No DATABASE_URL in .env.local');
  process.exit(1);
}
const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: env.DATABASE_URL });
(async () => {
  const client = await pool.connect();
  try {
    await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price INT');
    console.log('Added sale_price column if missing');
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='products' ORDER BY ordinal_position");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error('ERR', e);
  } finally {
    client.release();
    process.exit();
  }
})();
