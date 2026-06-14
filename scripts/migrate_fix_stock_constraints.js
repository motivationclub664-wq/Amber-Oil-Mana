const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    console.log('Dropping old constraints if exist...');
    await client.query(`ALTER TABLE stocks DROP CONSTRAINT IF EXISTS stocks_quantity_check`);
    await client.query(`ALTER TABLE stocks DROP CONSTRAINT IF EXISTS stocks_gift_quantity_check`);

    console.log('Adding new constraints...');
    await client.query(`ALTER TABLE stocks ADD CONSTRAINT stocks_quantity_check CHECK (quantity >= 0)`);
    await client.query(`ALTER TABLE stocks ADD CONSTRAINT stocks_gift_quantity_check CHECK (gift_quantity >= 0)`);

    console.log('Done');
  } catch (e) {
    console.error('Migration error:', e);
  } finally {
    client.release();
    await pool.end();
  }
}
run();
