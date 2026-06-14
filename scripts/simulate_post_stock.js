const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const productName = 'Gen 1';
    const importDate = new Date().toISOString();
    const importPrice = 0;
    const quantity = 1000;
    const giftQuantity = 2;
    const notes = 'test from simulate_post_stock';
    const relatedImage = null;

    const prodRes = await client.query('SELECT quantity FROM products WHERE name = $1 FOR UPDATE', [productName]);
    if (!prodRes.rows.length) {
      console.error('Product not found');
      await client.query('ROLLBACK');
      return;
    }

    const addQty = Number(quantity || 0) + Number(giftQuantity || 0);
    await client.query('UPDATE products SET quantity = quantity + $1 WHERE name = $2', [addQty, productName]);

    const insertRes = await client.query(
      'INSERT INTO stocks (import_date, import_price, quantity, gift_quantity, notes, related_image, product_name) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [importDate, importPrice, quantity, giftQuantity, notes, null, productName]
    );

    await client.query('COMMIT');
    console.log('Inserted stock:', insertRes.rows[0]);
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (err) {}
    console.error('Error during simulate_post_stock:', e.message || e);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
