import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/db';
import pool from '../../../lib/db';
import { base64ToBuffer as convertBase64 } from '../../../lib/utils';

async function loadOrderProducts(orderId: number) {
  const result = await query('SELECT product_name, quantity FROM order_products WHERE order_id = $1', [orderId]);
  return result.rows.map((r) => ({ productName: r.product_name, quantity: r.quantity }));
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const search = url.searchParams.get('search');
  const pageParam = url.searchParams.get('page');
  const limitParam = url.searchParams.get('limit');

  if (id) {
    const result = await query('SELECT * FROM orders WHERE id = $1', [Number(id)]);
    const order = result.rows[0];
    if (!order) return NextResponse.json(null);
    order.productItems = await loadOrderProducts(Number(id));
    return NextResponse.json(order);
  }

  const page = pageParam ? Math.max(1, Number(pageParam) || 1) : 1;
  const limit = limitParam ? Math.max(1, Number(limitParam) || 10) : 10;
  const offset = (page - 1) * limit;
  const whereClause = search ? 'WHERE notes ILIKE $1' : '';
  const params = search ? [`%${search}%`] : [];

  if (pageParam || limitParam || search) {
    const countResult = await query(`SELECT COUNT(*) AS total FROM orders ${whereClause}`, params);
    const result = await query(`SELECT * FROM orders ${whereClause} ORDER BY order_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
    const total = Number(countResult.rows[0]?.total ?? 0);
    return NextResponse.json({ data: result.rows, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
  }

  const result = await query('SELECT * FROM orders ORDER BY order_date DESC');
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { orderDate, purchaseDate, shipCost, netProfit, netProfitMargin, referrerFee, notes, relatedImage, customerId, productItems } = body;

  if (!Array.isArray(productItems)) return NextResponse.json({ error: 'Missing productItems' }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query(
      'INSERT INTO orders (order_date, purchase_date, ship_cost, net_profit, net_profit_margin, referrer_fee, notes, related_image, customer_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [orderDate, purchaseDate, shipCost, netProfit, netProfitMargin, referrerFee, notes, relatedImage ? convertBase64(relatedImage) : null, Number(customerId)]
    );

    const orderId = res.rows[0].id;

    for (const item of productItems) {
      const { productName, quantity } = item;
      const qty = Number(quantity);
      const p = await client.query('SELECT quantity FROM products WHERE name = $1 FOR UPDATE', [productName]);
      if (!p.rows.length) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: `Product not found: ${productName}` }, { status: 400 });
      }
      const avail = Number(p.rows[0].quantity ?? 0);
      if (avail < qty) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: `Insufficient stock for ${productName}` }, { status: 400 });
      }
      await client.query('INSERT INTO order_products (order_id, product_name, quantity) VALUES ($1, $2, $3)', [orderId, productName, qty]);
      await client.query('UPDATE products SET quantity = quantity - $1 WHERE name = $2', [qty, productName]);
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true, id: orderId }, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, orderDate, purchaseDate, shipCost, netProfit, netProfitMargin, referrerFee, notes, relatedImage, customerId, productItems } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  if (!Array.isArray(productItems)) return NextResponse.json({ error: 'Missing productItems' }, { status: 400 });

  const existing = await query('SELECT * FROM orders WHERE id = $1', [Number(id)]);
  if (!existing.rows.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // restore stock from existing items
    const oldItemsRes = await client.query('SELECT product_name, quantity FROM order_products WHERE order_id = $1', [Number(id)]);
    for (const oi of oldItemsRes.rows) {
      await client.query('UPDATE products SET quantity = quantity + $1 WHERE name = $2', [oi.quantity, oi.product_name]);
    }

    // delete old items
    await client.query('DELETE FROM order_products WHERE order_id = $1', [Number(id)]);

    // validate and insert new items, decrement stock
    for (const item of productItems) {
      const { productName, quantity } = item;
      const qty = Number(quantity);
      const p = await client.query('SELECT quantity FROM products WHERE name = $1 FOR UPDATE', [productName]);
      if (!p.rows.length) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: `Product not found: ${productName}` }, { status: 400 });
      }
      const avail = Number(p.rows[0].quantity ?? 0);
      if (avail < qty) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: `Insufficient stock for ${productName}` }, { status: 400 });
      }
      await client.query('INSERT INTO order_products (order_id, product_name, quantity) VALUES ($1, $2, $3)', [Number(id), productName, qty]);
      await client.query('UPDATE products SET quantity = quantity - $1 WHERE name = $2', [qty, productName]);
    }

    // update order fields
    await client.query('UPDATE orders SET order_date = $1, purchase_date = $2, ship_cost = $3, net_profit = $4, net_profit_margin = $5, referrer_fee = $6, notes = $7, related_image = $8, customer_id = $9 WHERE id = $10',
      [orderDate, purchaseDate, shipCost, netProfit, netProfitMargin, referrerFee, notes, relatedImage ? convertBase64(relatedImage) : existing.rows[0].related_image, Number(customerId), Number(id)]);

    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
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
    const itemsRes = await client.query('SELECT product_name, quantity FROM order_products WHERE order_id = $1', [Number(id)]);
    for (const it of itemsRes.rows) {
      await client.query('UPDATE products SET quantity = quantity + $1 WHERE name = $2', [it.quantity, it.product_name]);
    }
    await client.query('DELETE FROM order_products WHERE order_id = $1', [Number(id)]);
    await client.query('DELETE FROM orders WHERE id = $1', [Number(id)]);
    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { action, id } = body;
  if (action !== 'duplicate' || !id) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const source = await query('SELECT * FROM orders WHERE id = $1', [Number(id)]);
  if (!source.rows.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  const order = source.rows[0];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query(
      'INSERT INTO orders (order_date, purchase_date, ship_cost, net_profit, net_profit_margin, referrer_fee, notes, related_image, customer_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [order.order_date, order.purchase_date, order.ship_cost, order.net_profit, order.net_profit_margin, order.referrer_fee, order.notes, order.related_image, order.customer_id]
    );
    const newId = res.rows[0].id;
    const items = await loadOrderProducts(Number(id));
    for (const it of items) {
      await client.query('INSERT INTO order_products (order_id, product_name, quantity) VALUES ($1, $2, $3)', [newId, it.productName, it.quantity]);
    }
    await client.query('COMMIT');
    return NextResponse.json({ success: true, id: newId }, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  } finally {
    client.release();
  }
}
