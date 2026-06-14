const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_PqgN1jGUMH9p@ep-dark-frost-atph3pv4.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require' });
(async ()=>{
  const productName = 'Gen 1';
  const importDate = new Date().toISOString();
  const importPrice = 123;
  const quantity = 5;
  const giftQuantity = 2;
  const notes = 'simulate';
  try{
    const before = await pool.query('SELECT quantity FROM products WHERE name=$1', [productName]);
    console.log('before', before.rows[0]);
    const client = await pool.connect();
    try{
      await client.query('BEGIN');
      const prodRes = await client.query('SELECT quantity FROM products WHERE name=$1 FOR UPDATE', [productName]);
      if (!prodRes.rows.length) throw new Error('product not found');
      const addQty = Number(quantity)+Number(giftQuantity);
      await client.query('UPDATE products SET quantity = quantity + $1 WHERE name = $2', [addQty, productName]);
      const insert = await client.query('INSERT INTO stocks (import_date, import_price, quantity, gift_quantity, notes, related_image, product_name) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [importDate, importPrice, quantity, giftQuantity, notes, null, productName]);
      await client.query('COMMIT');
      console.log('inserted stock id', insert.rows[0].id);
    }catch(e){ await client.query('ROLLBACK'); throw e; } finally{ client.release(); }
    const after = await pool.query('SELECT quantity FROM products WHERE name=$1', [productName]);
    console.log('after', after.rows[0]);
  }catch(e){ console.error('err', e.message); process.exitCode=1 } finally{ await pool.end(); }
})();
