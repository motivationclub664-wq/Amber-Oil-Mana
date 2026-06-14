import { NextRequest, NextResponse } from 'next/server';
import pool, { query } from '../../../lib/db';
import { base64ToBuffer } from '../../../lib/utils';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const search = url.searchParams.get('search');
  const pageParam = url.searchParams.get('page');
  const limitParam = url.searchParams.get('limit');

  if (id) {
    const result = await query('SELECT * FROM stocks WHERE id = $1', [Number(id)]);
    return NextResponse.json(result.rows[0] ?? null);
  }

  const page = pageParam ? Math.max(1, Number(pageParam) || 1) : 1;
  const limit = limitParam ? Math.max(1, Number(limitParam) || 10) : 10;
  const offset = (page - 1) * limit;
  const whereClause = search ? 'WHERE notes ILIKE $1 OR product_name ILIKE $1' : '';
  const params = search ? [`%${search}%`] : [];

  if (pageParam || limitParam || search) {
    const countResult = await query(`SELECT COUNT(*) AS total FROM stocks ${whereClause}`, params);
    const result = await query(`SELECT * FROM stocks ${whereClause} ORDER BY import_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
    const total = Number(countResult.rows[0]?.total ?? 0);
    return NextResponse.json({ data: result.rows, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
  }

  const result = await query('SELECT * FROM stocks ORDER BY import_date DESC');
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { importDate, importPrice, quantity, giftQuantity, notes, relatedImage, productName } = body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Ensure product exists and lock the row for update
    const prodRes = await client.query('SELECT quantity FROM products WHERE name = $1 FOR UPDATE', [productName]);
    if (!prodRes.rows.length) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const addQty = Number(quantity || 0) + Number(giftQuantity || 0);
    // Update product quantity
    await client.query('UPDATE products SET quantity = quantity + $1 WHERE name = $2', [addQty, productName]);

    // Insert stock record
    const insertRes = await client.query(
      'INSERT INTO stocks (import_date, import_price, quantity, gift_quantity, notes, related_image, product_name) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [importDate, importPrice, quantity, giftQuantity, notes, relatedImage ? base64ToBuffer(relatedImage) : null, productName]
    );

    await client.query('COMMIT');
    return NextResponse.json(insertRes.rows[0], { status: 201 });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (err) { /* ignore */ }
    return NextResponse.json({ error: (e as Error).message || 'Error' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, importDate, importPrice, quantity, giftQuantity, notes, relatedImage, productName } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const existing = await query('SELECT * FROM stocks WHERE id = $1', [Number(id)]);
  if (!existing.rows.length) return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
  const stock = existing.rows[0];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const oldTotal = Number(stock.quantity || 0) + Number(stock.gift_quantity || 0);
    const newTotal = Number(quantity || 0) + Number(giftQuantity || 0);

    if (stock.product_name === productName) {
      const diff = newTotal - oldTotal; // positive -> increase product qty, negative -> decrease
      if (diff !== 0) {
        await client.query('UPDATE products SET quantity = GREATEST(quantity + $1, 0) WHERE name = $2', [diff, productName]);
      }
    } else {
      // product changed: subtract oldTotal from old product, add newTotal to new product
      await client.query('UPDATE products SET quantity = GREATEST(quantity - $1, 0) WHERE name = $2', [oldTotal, stock.product_name]);
      await client.query('UPDATE products SET quantity = quantity + $1 WHERE name = $2', [newTotal, productName]);
    }

    await client.query(
      'UPDATE stocks SET import_date = $1, import_price = $2, quantity = $3, gift_quantity = $4, notes = $5, related_image = $6, product_name = $7 WHERE id = $8',
      [
        importDate,
        importPrice,
        quantity,
        giftQuantity,
        notes,
        relatedImage ? base64ToBuffer(relatedImage) : stock.related_image,
        productName,
        Number(id),
      ]
    );

    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (err) { /* ignore */ }
    return NextResponse.json({ error: (e as Error).message || 'Error' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query('SELECT * FROM stocks WHERE id = $1', [Number(id)]);
    if (!res.rows.length) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
    }
    const stock = res.rows[0];
    const total = Number(stock.quantity || 0) + Number(stock.gift_quantity || 0);
    await client.query('UPDATE products SET quantity = GREATEST(quantity - $1, 0) WHERE name = $2', [total, stock.product_name]);
    await client.query('DELETE FROM stocks WHERE id = $1', [Number(id)]);
    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (err) { /* ignore */ }
    return NextResponse.json({ error: (e as Error).message || 'Error' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { action, id } = body;
  if (action !== 'duplicate' || !id) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const source = await query('SELECT * FROM stocks WHERE id = $1', [Number(id)]);
  if (!source.rows.length) return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
  const stock = source.rows[0];

  const result = await query(
    'INSERT INTO stocks (import_date, import_price, quantity, gift_quantity, notes, related_image, product_name) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [stock.import_date, stock.import_price, stock.quantity, stock.gift_quantity, stock.notes, stock.related_image, stock.product_name]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
