const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_PqgN1jGUMH9p@ep-dark-frost-atph3pv4.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require' });
(async () => {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='order_products'");
    console.log(res.rows);
  } catch (e) {
    console.error('Error:', e.message || e);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
