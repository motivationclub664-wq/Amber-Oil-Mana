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
    await client.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS surcharge INT');
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='orders' ORDER BY ordinal_position");
    console.log('orders columns', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('ERR', err);
  } finally {
    client.release();
    process.exit();
  }
})();