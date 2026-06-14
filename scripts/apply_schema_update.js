const fs = require('fs');
const { Pool } = require('@neondatabase/serverless');

function loadEnv() {
  const p = '.env.local';
  if (!fs.existsSync(p)) throw new Error('.env.local not found');
  const text = fs.readFileSync(p, 'utf8');
  const obj = Object.fromEntries(
    text.split(/\r?\n/).filter(Boolean).map((line) => {
      const i = line.indexOf('=');
      if (i === -1) return [line, ''];
      return [line.slice(0, i), line.slice(i + 1)];
    })
  );
  return obj;
}

(async function main(){
  try{
    const env = loadEnv();
    if (!env.DATABASE_URL) throw new Error('DATABASE_URL missing in .env.local');
    const pool = new Pool({ connectionString: env.DATABASE_URL });
    const client = await pool.connect();

    const results = [];

    // helper
    async function runSafe(sql, desc){
      try{
        await client.query(sql);
        results.push({ ok: true, desc });
        console.log('OK:', desc);
      }catch(e){
        results.push({ ok: false, desc, error: e.message });
        console.error('ERR:', desc, e.message);
      }
    }

    // 1) Ensure referers unique (name, date)
    const refIdx = await client.query("SELECT indexname FROM pg_indexes WHERE tablename='referers' AND indexdef LIKE '%(name, date)%' AND indexdef LIKE '%UNIQUE%'");
    if (refIdx.rows.length === 0){
      await runSafe("CREATE UNIQUE INDEX IF NOT EXISTS referers_name_date_unique ON referers (name, date)", "Add unique index on referers(name,date)");
    } else {
      console.log('referers unique index present');
    }

    // 2) Ensure customers unique (name, zalo)
    const custIdx = await client.query("SELECT indexname FROM pg_indexes WHERE tablename='customers' AND indexdef LIKE '%(name, zalo)%' AND indexdef LIKE '%UNIQUE%'");
    if (custIdx.rows.length === 0){
      await runSafe("CREATE UNIQUE INDEX IF NOT EXISTS customers_name_zalo_unique ON customers (name, zalo)", "Add unique index on customers(name,zalo)");
    } else {
      console.log('customers unique index present');
    }

    // 3) Alter products.sale_price type to numeric(12,2) if not already
    const prodSale = await client.query("SELECT data_type, numeric_precision, numeric_scale FROM information_schema.columns WHERE table_name='products' AND column_name='sale_price'");
    if (prodSale.rows.length){
      const row = prodSale.rows[0];
      const isNumeric = row.data_type === 'numeric';
      if (!isNumeric){
        await runSafe("ALTER TABLE products ALTER COLUMN sale_price TYPE numeric(12,2) USING sale_price::numeric", "Alter products.sale_price to numeric(12,2)");
      } else {
        console.log('products.sale_price already numeric');
      }
    } else {
      console.log('products.sale_price column not present');
    }

    // 4) Ensure products.net_price numeric(12,2)
    const prodNet = await client.query("SELECT data_type FROM information_schema.columns WHERE table_name='products' AND column_name='net_price'");
    if (prodNet.rows.length){
      if (prodNet.rows[0].data_type !== 'numeric'){
        await runSafe("ALTER TABLE products ALTER COLUMN net_price TYPE numeric(12,2) USING net_price::numeric", "Alter products.net_price to numeric(12,2)");
      } else {
        console.log('products.net_price already numeric');
      }
    }

    // 5) Add products.quantity check constraint if safe
    const qtyMax = await client.query('SELECT MAX(quantity) as maxq FROM products');
    const maxq = qtyMax.rows[0]?.maxq;
    if (maxq == null || Number(maxq) < 1000000){
      // check if constraint exists
      const hasCons = await client.query("SELECT conname FROM pg_constraint WHERE conrelid = 'products'::regclass AND pg_get_constraintdef(oid) LIKE '%quantity >= 0%' OR pg_get_constraintdef(oid) LIKE '%quantity < 1000000%'");
      if (hasCons.rows.length === 0){
        await runSafe("ALTER TABLE products ADD CONSTRAINT products_quantity_check CHECK (quantity >= 0 AND quantity < 1000000)", "Add products.quantity check constraint");
      } else console.log('products.quantity check constraint present');
    } else {
      results.push({ ok:false, desc:'products.quantity values exceed limit', error: 'Max quantity = '+String(maxq) });
      console.error('Cannot add products.quantity check: existing max quantity =', maxq);
    }

    // 6) order_products primary key
    const pk = await client.query("SELECT conname FROM pg_constraint WHERE conrelid = 'order_products'::regclass AND contype='p'");
    if (pk.rows.length === 0){
      const dup = await client.query('SELECT order_id, product_name, count(*) as c FROM order_products GROUP BY order_id, product_name HAVING count(*)>1');
      if (dup.rows.length === 0){
        await runSafe('ALTER TABLE order_products ADD CONSTRAINT order_products_pkey PRIMARY KEY (order_id, product_name)', 'Add PK on order_products(order_id,product_name)');
      } else {
        results.push({ ok:false, desc:'order_products has duplicate rows preventing PK', error: JSON.stringify(dup.rows)});
        console.error('Duplicate order_products rows found:', dup.rows.length);
      }
    } else console.log('order_products primary key present');

    // 7) customers.type check
    const typesRes = await client.query("SELECT DISTINCT type FROM customers WHERE type IS NOT NULL");
    const allowed = ['Grab','Be','Tada','Ahamove','Lalamove','Wholesale Customer','Other'];
    const badTypes = typesRes.rows.map(r=>r.type).filter(v=>!allowed.includes(v));
    if (badTypes.length){
      results.push({ ok:false, desc:'customers.type has invalid values', error: JSON.stringify(badTypes) });
      console.error('customers.type contains values not in allowed list:', badTypes);
    } else {
      // add constraint if not exists
      const consExists = await client.query("SELECT conname FROM pg_constraint WHERE conrelid = 'customers'::regclass AND pg_get_constraintdef(oid) LIKE '%type IN%'");
      if (consExists.rows.length === 0){
        await runSafe("ALTER TABLE customers ADD CONSTRAINT customers_type_check CHECK (type IN ('Grab','Be','Tada','Ahamove','Lalamove','Wholesale Customer','Other'))","Add customers.type CHECK constraint");
      } else console.log('customers.type check present');
    }

    // 8) foreign key customers.referer_id -> referers(id) ON DELETE SET NULL
    const fkCust = await client.query("SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = 'customers'::regclass AND contype='f'");
    const fkCustExists = fkCust.rows.some(r=>r.def.includes('REFERENCES referers') || r.def.includes('REFERENCES public.referers'));
    if (!fkCustExists){
      // attempt to add - may fail if types mismatch
      await runSafe("ALTER TABLE customers ADD CONSTRAINT customers_referer_fk FOREIGN KEY (referer_id) REFERENCES referers(id) ON DELETE SET NULL","Add FK customers.referer_id -> referers(id)");
    } else console.log('customers referer FK present');

    // 9) stocks.product_name FK -> products(name) ON DELETE CASCADE
    const fkStocks = await client.query("SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = 'stocks'::regclass AND contype='f'");
    const fkStocksExists = fkStocks.rows.some(r=>r.def.includes('REFERENCES products') );
    if (!fkStocksExists){
      await runSafe("ALTER TABLE stocks ADD CONSTRAINT stocks_product_fk FOREIGN KEY (product_name) REFERENCES products(name) ON DELETE CASCADE","Add FK stocks.product_name -> products(name)");
    } else console.log('stocks.product_name FK present');

    // done
    console.log('\nSUMMARY');
    console.log(JSON.stringify(results, null, 2));

    await client.release();
    await pool.end();
  }catch(e){
    console.error('FATAL', e.message);
    process.exit(1);
  }
})();
