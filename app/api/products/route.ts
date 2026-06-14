import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/db';
import { base64ToBuffer, bufferToBase64 } from '../../../lib/utils';

function serializeProductRow(product: Record<string, unknown>) {
  return {
    ...product,
    related_image: product.related_image ? bufferToBase64(product.related_image as Buffer) : '',
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const name = url.searchParams.get('name');
  const search = url.searchParams.get('search');
  const pageParam = url.searchParams.get('page');
  const limitParam = url.searchParams.get('limit');

  if (name) {
    const result = await query('SELECT * FROM products WHERE name = $1', [name]);
    return NextResponse.json(result.rows[0] ? serializeProductRow(result.rows[0]) : null);
  }

  const page = pageParam ? Math.max(1, Number(pageParam) || 1) : 1;
  const limit = limitParam ? Math.max(1, Number(limitParam) || 10) : 10;
  const offset = (page - 1) * limit;
  const whereClause = search ? 'WHERE name ILIKE $1 OR classical_name ILIKE $1' : '';
  const params = search ? [`%${search}%`] : [];

  if (pageParam || limitParam || search) {
    const countResult = await query(`SELECT COUNT(*) AS total FROM products ${whereClause}`, params);
    const result = await query(`SELECT * FROM products ${whereClause} ORDER BY name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
    const total = Number(countResult.rows[0]?.total ?? 0);
    return NextResponse.json({ data: result.rows.map(serializeProductRow), total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
  }

  const result = await query('SELECT * FROM products ORDER BY name');
  return NextResponse.json(result.rows.map(serializeProductRow));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, classicalName, netPrice, salePrice, quantity, notes, relatedImage } = body;

  try {
    const result = await query(
      'INSERT INTO products (name, classical_name, net_price, sale_price, quantity, notes, related_image) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, classicalName, netPrice, salePrice, quantity, notes, relatedImage ? base64ToBuffer(relatedImage) : null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === '23514') {
      return NextResponse.json({ error: 'Giá trị sản phẩm không hợp lệ' }, { status: 400 });
    }
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Sản phẩm đã tồn tại' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Lỗi cơ sở dữ liệu' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { name, classicalName, netPrice, salePrice, quantity, notes, relatedImage } = body;
  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });

  const existing = await query('SELECT * FROM products WHERE name = $1', [name]);
  if (!existing.rows.length) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  const product = existing.rows[0];

  await query(
    'UPDATE products SET classical_name = $1, net_price = $2, sale_price = $3, quantity = $4, notes = $5, related_image = $6 WHERE name = $7',
    [
      classicalName,
      netPrice,
      salePrice,
      quantity,
      notes,
      relatedImage ? base64ToBuffer(relatedImage) : product.related_image,
      name,
    ]
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const name = url.searchParams.get('name');
  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });

  await query('DELETE FROM products WHERE name = $1', [name]);
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { action, name, newName } = body;
  if (action !== 'duplicate' || !name) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const source = await query('SELECT * FROM products WHERE name = $1', [name]);
  if (!source.rows.length) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  const product = source.rows[0];

  const result = await query(
    'INSERT INTO products (name, classical_name, net_price, sale_price, quantity, notes, related_image) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [newName, product.classical_name, product.net_price, product.sale_price, product.quantity, product.notes, product.related_image]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
