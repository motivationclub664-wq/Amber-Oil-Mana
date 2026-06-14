const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = 'stocks'::regclass");
    console.log(res.rows);

    const cols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='stocks' ORDER BY ordinal_position");
    console.log(cols.rows);
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    await pool.end();
  }
}
run();
