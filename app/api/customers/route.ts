<<<<<<< HEAD
import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/db';
import { base64ToBuffer, bufferToBase64, buildZaloUrl, normalizeLocationForClient, normalizeLocationForServer } from '../../../lib/utils';

function serializeCustomerRow(customer: Record<string, unknown>) {
  return {
    ...customer,
    location: normalizeLocationForClient(customer.location),
    related_image1: customer.related_image1 ? bufferToBase64(customer.related_image1 as Buffer) : '',
    related_image2: customer.related_image2 ? bufferToBase64(customer.related_image2 as Buffer) : '',
    related_image3: customer.related_image3 ? bufferToBase64(customer.related_image3 as Buffer) : '',
    related_image4: customer.related_image4 ? bufferToBase64(customer.related_image4 as Buffer) : '',
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const search = url.searchParams.get('search');
  const pageParam = url.searchParams.get('page');
  const limitParam = url.searchParams.get('limit');

  if (id) {
    const result = await query('SELECT * FROM customers WHERE id = $1', [Number(id)]);
    return NextResponse.json(result.rows[0] ? serializeCustomerRow(result.rows[0]) : null);
  }

  const page = pageParam ? Math.max(1, Number(pageParam) || 1) : 1;
  const limit = limitParam ? Math.max(1, Number(limitParam) || 10) : 10;
  const offset = (page - 1) * limit;
  const whereClause = search ? 'WHERE name ILIKE $1 OR zalo ILIKE $1' : '';
  const params = search ? [`%${search}%`] : [];

  if (pageParam || limitParam || search) {
    const countResult = await query(`SELECT COUNT(*) AS total FROM customers ${whereClause}`, params);
    const result = await query(`SELECT id, name, date, phone, zalo, address, location, type, notes, referer_id FROM customers ${whereClause} ORDER BY date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
    const total = Number(countResult.rows[0]?.total ?? 0);
    return NextResponse.json({ data: result.rows.map((row) => ({ ...row, location: normalizeLocationForClient(row.location) })), total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
  }

  const result = await query('SELECT id, name, date, phone, zalo, address, location, type, notes, referer_id FROM customers ORDER BY date DESC');
  return NextResponse.json(result.rows.map((row) => ({ ...row, location: normalizeLocationForClient(row.location) })));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, date, phone, zalo, address, location, type, notes, relatedImage1, relatedImage2, relatedImage3, relatedImage4, referer_id } = body;
    const point = normalizeLocationForServer(location);

    // Add customer name suffix with yymm_xxx format
    // Parse date string (format: YYYY-MM-DD) without timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const yy = String(year).slice(-2);
    const mm = String(month).padStart(2, '0');
    const yyyymm = `${yy}${mm}`;

    // Count customers created in the same month
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    
    const countResult = await query('SELECT COUNT(*) AS count FROM customers WHERE date >= $1 AND date < $2', [
      monthStart,
      monthEnd,
    ]);
    const count = Number(countResult.rows[0]?.count ?? 0) + 1;
    const xxx = String(count).padStart(3, '0');

    const finalName = `${name}_${yyyymm}_${xxx}`;

    const result = await query(
      'INSERT INTO customers (name, date, phone, zalo, address, location, type, notes, related_image1, related_image2, related_image3, related_image4, referer_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
      [
        finalName,
        date,
        phone,
        buildZaloUrl(zalo),
        address,
        point,
        type,
        notes,
        relatedImage1 ? base64ToBuffer(relatedImage1) : null,
        relatedImage2 ? base64ToBuffer(relatedImage2) : null,
        relatedImage3 ? base64ToBuffer(relatedImage3) : null,
        relatedImage4 ? base64ToBuffer(relatedImage4) : null,
        referer_id ? Number(referer_id) : null,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Customer POST error:', error);
    return NextResponse.json({ error: (error as Error).message || 'Error creating customer' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name, date, phone, zalo, address, location, type, notes, relatedImage1, relatedImage2, relatedImage3, relatedImage4, referer_id } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const point = normalizeLocationForServer(location);
  const existing = await query('SELECT * FROM customers WHERE id = $1', [Number(id)]);
  if (!existing.rows.length) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  const customer = existing.rows[0];

  await query(
    'UPDATE customers SET name = $1, date = $2, phone = $3, zalo = $4, address = $5, location = $6, type = $7, notes = $8, related_image1 = $9, related_image2 = $10, related_image3 = $11, related_image4 = $12, referer_id = $13 WHERE id = $14',
    [
      name,
      date,
      phone,
      buildZaloUrl(zalo),
      address,
      point,
      type,
      notes,
      relatedImage1 ? base64ToBuffer(relatedImage1) : customer.related_image1,
      relatedImage2 ? base64ToBuffer(relatedImage2) : customer.related_image2,
      relatedImage3 ? base64ToBuffer(relatedImage3) : customer.related_image3,
      relatedImage4 ? base64ToBuffer(relatedImage4) : customer.related_image4,
      referer_id ? Number(referer_id) : null,
      Number(id),
    ]
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await query('DELETE FROM customers WHERE id = $1', [Number(id)]);
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { action, id, name, zalo } = body;
  if (action !== 'duplicate' || !id) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const source = await query('SELECT * FROM customers WHERE id = $1', [Number(id)]);
  if (!source.rows.length) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  const customer = source.rows[0];

  const result = await query(
    'INSERT INTO customers (name, date, phone, zalo, address, location, type, notes, related_image1, related_image2, related_image3, related_image4, referer_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
    [
      name,
      customer.date,
      customer.phone,
      zalo,
      customer.address,
      customer.location,
      customer.type,
      customer.notes,
      customer.related_image1,
      customer.related_image2,
      customer.related_image3,
      customer.related_image4,
      customer.referer_id,
    ]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
=======
import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/db';
import { base64ToBuffer, bufferToBase64, buildZaloUrl, normalizeLocationForClient, normalizeLocationForServer } from '../../../lib/utils';

function serializeCustomerRow(customer: Record<string, unknown>) {
  return {
    ...customer,
    location: normalizeLocationForClient(customer.location),
    related_image1: customer.related_image1 ? bufferToBase64(customer.related_image1 as Buffer) : '',
    related_image2: customer.related_image2 ? bufferToBase64(customer.related_image2 as Buffer) : '',
    related_image3: customer.related_image3 ? bufferToBase64(customer.related_image3 as Buffer) : '',
    related_image4: customer.related_image4 ? bufferToBase64(customer.related_image4 as Buffer) : '',
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const search = url.searchParams.get('search');
  const pageParam = url.searchParams.get('page');
  const limitParam = url.searchParams.get('limit');

  if (id) {
    const result = await query('SELECT * FROM customers WHERE id = $1', [Number(id)]);
    return NextResponse.json(result.rows[0] ? serializeCustomerRow(result.rows[0]) : null);
  }

  const page = pageParam ? Math.max(1, Number(pageParam) || 1) : 1;
  const limit = limitParam ? Math.max(1, Number(limitParam) || 10) : 10;
  const offset = (page - 1) * limit;
  const whereClause = search ? 'WHERE name ILIKE $1 OR zalo ILIKE $1' : '';
  const params = search ? [`%${search}%`] : [];

  if (pageParam || limitParam || search) {
    const countResult = await query(`SELECT COUNT(*) AS total FROM customers ${whereClause}`, params);
    const result = await query(`SELECT id, name, date, phone, zalo, address, location, type, notes, referer_id FROM customers ${whereClause} ORDER BY date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
    const total = Number(countResult.rows[0]?.total ?? 0);
    return NextResponse.json({ data: result.rows.map((row) => ({ ...row, location: normalizeLocationForClient(row.location) })), total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
  }

  const result = await query('SELECT id, name, date, phone, zalo, address, location, type, notes, referer_id FROM customers ORDER BY date DESC');
  return NextResponse.json(result.rows.map((row) => ({ ...row, location: normalizeLocationForClient(row.location) })));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, date, phone, zalo, address, location, type, notes, relatedImage1, relatedImage2, relatedImage3, relatedImage4, referer_id } = body;
    const point = normalizeLocationForServer(location);

    // Add customer name suffix with yymm_xxx format
    // Parse date string (format: YYYY-MM-DD) without timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const yy = String(year).slice(-2);
    const mm = String(month).padStart(2, '0');
    const yyyymm = `${yy}${mm}`;

    // Count customers created in the same month
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    
    const countResult = await query('SELECT COUNT(*) AS count FROM customers WHERE date >= $1 AND date < $2', [
      monthStart,
      monthEnd,
    ]);
    const count = Number(countResult.rows[0]?.count ?? 0) + 1;
    const xxx = String(count).padStart(3, '0');

    const finalName = `${name}_${yyyymm}_${xxx}`;

    const result = await query(
      'INSERT INTO customers (name, date, phone, zalo, address, location, type, notes, related_image1, related_image2, related_image3, related_image4, referer_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
      [
        finalName,
        date,
        phone,
        buildZaloUrl(zalo),
        address,
        point,
        type,
        notes,
        relatedImage1 ? base64ToBuffer(relatedImage1) : null,
        relatedImage2 ? base64ToBuffer(relatedImage2) : null,
        relatedImage3 ? base64ToBuffer(relatedImage3) : null,
        relatedImage4 ? base64ToBuffer(relatedImage4) : null,
        referer_id ? Number(referer_id) : null,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Customer POST error:', error);
    return NextResponse.json({ error: (error as Error).message || 'Error creating customer' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name, date, phone, zalo, address, location, type, notes, relatedImage1, relatedImage2, relatedImage3, relatedImage4, referer_id } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const point = normalizeLocationForServer(location);
  const existing = await query('SELECT * FROM customers WHERE id = $1', [Number(id)]);
  if (!existing.rows.length) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  const customer = existing.rows[0];

  await query(
    'UPDATE customers SET name = $1, date = $2, phone = $3, zalo = $4, address = $5, location = $6, type = $7, notes = $8, related_image1 = $9, related_image2 = $10, related_image3 = $11, related_image4 = $12, referer_id = $13 WHERE id = $14',
    [
      name,
      date,
      phone,
      buildZaloUrl(zalo),
      address,
      point,
      type,
      notes,
      relatedImage1 ? base64ToBuffer(relatedImage1) : customer.related_image1,
      relatedImage2 ? base64ToBuffer(relatedImage2) : customer.related_image2,
      relatedImage3 ? base64ToBuffer(relatedImage3) : customer.related_image3,
      relatedImage4 ? base64ToBuffer(relatedImage4) : customer.related_image4,
      referer_id ? Number(referer_id) : null,
      Number(id),
    ]
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await query('DELETE FROM customers WHERE id = $1', [Number(id)]);
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { action, id, name, zalo } = body;
  if (action !== 'duplicate' || !id) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const source = await query('SELECT * FROM customers WHERE id = $1', [Number(id)]);
  if (!source.rows.length) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  const customer = source.rows[0];

  const result = await query(
    'INSERT INTO customers (name, date, phone, zalo, address, location, type, notes, related_image1, related_image2, related_image3, related_image4, referer_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
    [
      name,
      customer.date,
      customer.phone,
      zalo,
      customer.address,
      customer.location,
      customer.type,
      customer.notes,
      customer.related_image1,
      customer.related_image2,
      customer.related_image3,
      customer.related_image4,
      customer.referer_id,
    ]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
>>>>>>> 31dca55ee04290a6a1eb3786c2ceca396ab23f9b
