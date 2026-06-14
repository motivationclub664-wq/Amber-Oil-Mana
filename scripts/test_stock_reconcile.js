const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // create a product
    await client.query("INSERT INTO products (name, quantity) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET quantity = EXCLUDED.quantity", ['ReconcileTest', 10]);
    // insert stock
    const res = await client.query("INSERT INTO stocks (import_date, import_price, quantity, gift_quantity, notes, product_name) VALUES (now(), 10, 5, 0, 'initial', 'ReconcileTest') RETURNING id");
    const id = res.rows[0].id;
    await client.query('COMMIT');

    console.log('Inserted stock id', id);

    // update stock to increase quantity
    // call your API endpoint would be better, but we'll emulate direct DB update flow
    // increase stock from 5 to 8
    console.log('Now updating stock to +3');
    await pool.query('BEGIN');
    const old = await pool.query('SELECT * FROM stocks WHERE id = $1', [id]);
    const oldTotal = Number(old.rows[0].quantity) + Number(old.rows[0].gift_quantity);
    const newTotal = 8;
    const diff = newTotal - oldTotal;
    if (diff !== 0) {
      await pool.query('UPDATE products SET quantity = GREATEST(quantity + $1, 0) WHERE name = $2', [diff, 'ReconcileTest']);
    }
    await pool.query('UPDATE stocks SET quantity = $1 WHERE id = $2', [8, id]);
    await pool.query('COMMIT');

    const p = await pool.query('SELECT * FROM products WHERE name = $1', ['ReconcileTest']);
    console.log('Product after update:', p.rows[0]);

    // delete stock
    console.log('Deleting stock, should subtract total');
    await pool.query('BEGIN');
    const s = await pool.query('SELECT * FROM stocks WHERE id = $1', [id]);
    const total = Number(s.rows[0].quantity) + Number(s.rows[0].gift_quantity);
    await pool.query('UPDATE products SET quantity = GREATEST(quantity - $1, 0) WHERE name = $2', [total, 'ReconcileTest']);
    await pool.query('DELETE FROM stocks WHERE id = $1', [id]);
    await pool.query('COMMIT');

    const p2 = await pool.query('SELECT * FROM products WHERE name = $1', ['ReconcileTest']);
    console.log('Product after delete:', p2.rows[0]);

  } catch (e) {
    console.error(e);
    try { await client.query('ROLLBACK'); } catch (err) {}
  } finally {
    client.release();
    await pool.end();
  }
}

run();
