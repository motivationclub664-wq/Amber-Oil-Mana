import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/db';
import pool from '../../../lib/db';
import { base64ToBuffer as convertBase64, bufferToBase64, parseOptionalInt, parseOptionalNumber } from '../../../lib/utils';

function serializeOrderRow(order: Record<string, unknown>) {
  return {
    ...order,
    related_image: order.related_image ? bufferToBase64(order.related_image as Buffer) : '',
  };
}

async function loadOrderProducts(orderId: number) {
  const result = await query('SELECT product_name, quantity FROM order_products WHERE order_id = $1', [orderId]);
  return result.rows.map((r) => ({ productName: r.product_name, quantity: r.quantity }));
}

async function attachOrderItems(orders: Record<string, unknown>[]) {
  const orderIds = orders.map((order) => order.id).filter(Boolean);
  if (orderIds.length === 0) {
    return orders.map((order) => ({ ...serializeOrderRow(order), productItems: [] }));
  }

  const itemsResult = await query('SELECT order_id, product_name, quantity FROM order_products WHERE order_id = ANY($1)', [orderIds]);
  const itemsByOrder = new Map<number, Array<{ productName: string; quantity: number }>>();
  for (const item of itemsResult.rows) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push({ productName: item.product_name, quantity: item.quantity });
    itemsByOrder.set(item.order_id, list);
  }

  return orders.map((order) => ({
    ...serializeOrderRow(order),
    productItems: itemsByOrder.get(order.id as number) ?? [],
  }));
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
    return NextResponse.json(serializeOrderRow(order));
  }

  const page = pageParam ? Math.max(1, Number(pageParam) || 1) : 1;
  const limit = limitParam ? Math.max(1, Number(limitParam) || 10) : 10;
  const offset = (page - 1) * limit;
  const whereClause = search ? 'WHERE notes ILIKE $1' : '';
  const params = search ? [`%${search}%`] : [];

  if (pageParam || limitParam || search) {
    const countResult = await query(`SELECT COUNT(*) AS total FROM orders ${whereClause}`, params);
    const result = await query(`SELECT * FROM orders ${whereClause} ORDER BY order_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
    const ordersWithItems = await attachOrderItems(result.rows);
    const total = Number(countResult.rows[0]?.total ?? 0);
    return NextResponse.json({ data: ordersWithItems, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
  }

  const result = await query('SELECT * FROM orders ORDER BY order_date DESC');
  return NextResponse.json(await attachOrderItems(result.rows));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { orderDate, purchaseDate, shipCost = 0, surcharge = 0, notes, relatedImage, customerId, productItems, discount = 0 } = body;

  const orderDateText = String(orderDate ?? '').trim();
  const customerIdInt = parseOptionalInt(customerId);
  const shipCostInt = parseOptionalInt(shipCost);
  const surchargeInt = parseOptionalInt(surcharge);
  const discountNum = parseOptionalNumber(discount);

  if (!orderDateText) return NextResponse.json({ error: 'Missing orderDate' }, { status: 400 });
  if (customerIdInt === null) return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
  if (shipCost !== undefined && shipCost !== '' && shipCostInt === null) return NextResponse.json({ error: 'Ship cost phải là số nguyên' }, { status: 400 });
  if (surcharge !== undefined && surcharge !== '' && surchargeInt === null) return NextResponse.json({ error: 'Phụ phí phải là số nguyên' }, { status: 400 });
  if (discount !== undefined && discount !== '' && discountNum === null) return NextResponse.json({ error: 'Discount phải là số' }, { status: 400 });
  if (!Array.isArray(productItems) || productItems.length === 0) return NextResponse.json({ error: 'Missing productItems' }, { status: 400 });

  const shipCostValue = shipCostInt ?? 0;
  const surchargeValue = surchargeInt ?? 0;
  const discountValue = discountNum ?? 0;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validate items, lock product rows and compute sums
    let sumSale = 0;
    let sumCost = 0;
    for (const item of productItems) {
      const { productName, quantity } = item;
      const qty = parseOptionalInt(quantity) ?? 0;
      if (!productName) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Missing productName' }, { status: 400 });
      }
      if (qty <= 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: `Invalid quantity for ${productName}` }, { status: 400 });
      }
      const p = await client.query('SELECT quantity, sale_price, net_price FROM products WHERE name = $1 FOR UPDATE', [productName]);
      if (!p.rows.length) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: `Product not found: ${productName}` }, { status: 400 });
      }
      const prod = p.rows[0];
      const avail = Number(prod.quantity ?? 0);
      if (avail < qty) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: `Insufficient stock for ${productName}` }, { status: 400 });
      }
      const sale = Number(prod.sale_price ?? 0);
      const cost = Number(prod.net_price ?? 0);
      sumSale += sale * qty;
      sumCost += cost * qty;
    }

    // compute total after discount
    const total = Math.round(sumSale * (100 - discountValue) / 100);

    // compute referrer fee from customer's referer offer_rate
    const custRes = await client.query('SELECT referer_id FROM customers WHERE id = $1', [customerIdInt]);
    let refFee = 0;
    if (custRes.rows.length && custRes.rows[0].referer_id) {
      const refId = custRes.rows[0].referer_id;
      const refRes = await client.query('SELECT offer_rate FROM referers WHERE id = $1', [refId]);
      if (refRes.rows.length) {
        const rate = Number(refRes.rows[0].offer_rate || 0);
        refFee = Math.round(total * rate / 100);
      }
    }

    const netProfit = Math.round(total - sumCost - refFee - shipCostValue + surchargeValue);
    const netProfitMargin = total ? Number((netProfit / total).toFixed(4)) : 0;

    // insert order with computed values
    const res = await client.query(
      'INSERT INTO orders (order_date, purchase_date, ship_cost, surcharge, total, discount, net_profit, net_profit_margin, referrer_fee, notes, related_image, customer_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id',
      [orderDateText, purchaseDate, shipCostValue, surchargeValue, total, discountValue, netProfit, netProfitMargin, refFee, notes, relatedImage ? convertBase64(relatedImage) : null, customerIdInt]
    );

    const orderId = res.rows[0].id;

    // insert items and decrement stock
    for (const item of productItems) {
      const { productName, quantity } = item;
      const qty = parseOptionalInt(quantity) ?? 0;
      await client.query('INSERT INTO order_products (order_id, product_name, quantity) VALUES ($1, $2, $3)', [orderId, productName, qty]);
      await client.query('UPDATE products SET quantity = quantity - $1 WHERE name = $2', [qty, productName]);
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true, id: orderId }, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Order POST error:', errMsg, err);
    return NextResponse.json({ error: `Database error: ${errMsg}` }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, orderDate, purchaseDate, shipCost = 0, surcharge = 0, notes, relatedImage, customerId, productItems, discount = 0 } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const orderDateText = String(orderDate ?? '').trim();
  const customerIdInt = parseOptionalInt(customerId);
  const shipCostInt = parseOptionalInt(shipCost);
  const surchargeInt = parseOptionalInt(surcharge);
  const discountNum = parseOptionalNumber(discount);

  if (!orderDateText) return NextResponse.json({ error: 'Missing orderDate' }, { status: 400 });
  if (customerIdInt === null) return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
  if (shipCost !== undefined && shipCost !== '' && shipCostInt === null) return NextResponse.json({ error: 'Ship cost phải là số nguyên' }, { status: 400 });
  if (surcharge !== undefined && surcharge !== '' && surchargeInt === null) return NextResponse.json({ error: 'Phụ phí phải là số nguyên' }, { status: 400 });
  if (discount !== undefined && discount !== '' && discountNum === null) return NextResponse.json({ error: 'Discount phải là số' }, { status: 400 });
  if (!Array.isArray(productItems) || productItems.length === 0) return NextResponse.json({ error: 'Missing productItems' }, { status: 400 });

  const shipCostValue = shipCostInt ?? 0;
  const surchargeValue = surchargeInt ?? 0;
  const discountValue = discountNum ?? 0;

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
    // validate customer exists
    const custCheck = await client.query('SELECT id FROM customers WHERE id = $1', [customerIdInt]);
    if (!custCheck.rows.length) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Customer not found' }, { status: 400 });
    }
    // validate and compute sums, lock rows
    let sumSale = 0;
    let sumCost = 0;
    for (const item of productItems) {
      const { productName, quantity } = item;
      const qty = parseOptionalInt(quantity) ?? 0;
      if (!productName) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Missing productName' }, { status: 400 });
      }
      if (qty <= 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: `Invalid quantity for ${productName}` }, { status: 400 });
      }
      const p = await client.query('SELECT quantity, sale_price, net_price FROM products WHERE name = $1 FOR UPDATE', [productName]);
      if (!p.rows.length) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: `Product not found: ${productName}` }, { status: 400 });
      }
      const prod = p.rows[0];
      const avail = Number(prod.quantity ?? 0);
      if (avail < qty) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: `Insufficient stock for ${productName}` }, { status: 400 });
      }
      const sale = Number(prod.sale_price ?? 0);
      const cost = Number(prod.net_price ?? 0);
      sumSale += sale * qty;
      sumCost += cost * qty;
    }

    const total = Math.round(sumSale * (100 - discountValue) / 100);

    // compute referrer fee
    const custRes = await client.query('SELECT referer_id FROM customers WHERE id = $1', [customerIdInt]);
    let refFee = 0;
    if (custRes.rows.length && custRes.rows[0].referer_id) {
      const refId = custRes.rows[0].referer_id;
      const refRes = await client.query('SELECT offer_rate FROM referers WHERE id = $1', [refId]);
      if (refRes.rows.length) {
        const rate = Number(refRes.rows[0].offer_rate || 0);
        refFee = Math.round(total * rate / 100);
      }
    }

    const netProfit = Math.round(total + surchargeValue - refFee - shipCostValue);
    const netProfitMargin = total ? Number((netProfit / total).toFixed(4)) : 0;

    // insert new items and decrement stock
    for (const item of productItems) {
      const { productName, quantity } = item;
      const qty = parseOptionalInt(quantity) ?? 0;
      await client.query('INSERT INTO order_products (order_id, product_name, quantity) VALUES ($1, $2, $3)', [Number(id), productName, qty]);
      await client.query('UPDATE products SET quantity = quantity - $1 WHERE name = $2', [qty, productName]);
    }

    // update order fields with computed values
    await client.query('UPDATE orders SET order_date = $1, purchase_date = $2, ship_cost = $3, surcharge = $4, total = $5, discount = $6, net_profit = $7, net_profit_margin = $8, referrer_fee = $9, notes = $10, related_image = $11, customer_id = $12 WHERE id = $13',
      [orderDateText, purchaseDate, shipCostValue, surchargeValue, total, discountValue, netProfit, netProfitMargin, refFee, notes, relatedImage ? convertBase64(relatedImage) : existing.rows[0].related_image, customerIdInt, Number(id)]);

    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Order PUT error:', errMsg, err);
    return NextResponse.json({ error: `Database error: ${errMsg}` }, { status: 500 });
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
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Order DELETE error:', errMsg, err);
    return NextResponse.json({ error: `Database error: ${errMsg}` }, { status: 500 });
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
      'INSERT INTO orders (order_date, purchase_date, ship_cost, surcharge, total, discount, net_profit, net_profit_margin, referrer_fee, notes, related_image, customer_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id',
      [order.order_date, order.purchase_date, order.ship_cost, order.surcharge, order.total, order.discount, order.net_profit, order.net_profit_margin, order.referrer_fee, order.notes, order.related_image, order.customer_id]
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
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Order PATCH error:', errMsg, err);
    return NextResponse.json({ error: `Database error: ${errMsg}` }, { status: 500 });
  } finally {
    client.release();
  }
}
