import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/db';
import { base64ToBuffer as convertBase64, bufferToBase64 } from '../../../lib/utils';

function serializeRefererRow(referer: Record<string, unknown>) {
  return {
    ...referer,
    related_image: referer.related_image ? bufferToBase64(referer.related_image as Buffer) : '',
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const search = url.searchParams.get('search');
  const pageParam = url.searchParams.get('page');
  const limitParam = url.searchParams.get('limit');

  if (id) {
    const result = await query('SELECT * FROM referers WHERE id = $1', [Number(id)]);
    return NextResponse.json(result.rows[0] ? serializeRefererRow(result.rows[0]) : null);
  }

  const page = pageParam ? Math.max(1, Number(pageParam) || 1) : 1;
  const limit = limitParam ? Math.max(1, Number(limitParam) || 10) : 10;
  const offset = (page - 1) * limit;
  const whereClause = search ? 'WHERE name ILIKE $1' : '';
  const params = search ? [`%${search}%`] : [];

  if (pageParam || limitParam || search) {
    const countResult = await query(`SELECT COUNT(*) AS total FROM referers ${whereClause}`, params);
    const result = await query(`SELECT * FROM referers ${whereClause} ORDER BY date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
    const total = Number(countResult.rows[0]?.total ?? 0);
    return NextResponse.json({ data: result.rows.map(serializeRefererRow), total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
  }

  const result = await query('SELECT * FROM referers ORDER BY date DESC');
  return NextResponse.json(result.rows.map(serializeRefererRow));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, date, offerRate, notes, relatedImage } = body;
  const buffer = relatedImage ? convertBase64(relatedImage) : null;

  const result = await query(
    'INSERT INTO referers (name, date, offer_rate, notes, related_image) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, date, offerRate, notes, buffer]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name, date, offerRate, notes, relatedImage } = body;
  const buffer = relatedImage ? convertBase64(relatedImage) : null;

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const existing = await query('SELECT * FROM referers WHERE id = $1', [Number(id)]);
  if (!existing.rows.length) {
    return NextResponse.json({ error: 'Referer not found' }, { status: 404 });
  }

  await query(
    'UPDATE referers SET name = $1, date = $2, offer_rate = $3, notes = $4, related_image = $5 WHERE id = $6',
    [name, date, offerRate, notes, buffer ?? existing.rows[0].related_image, Number(id)]
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  await query('DELETE FROM referers WHERE id = $1', [Number(id)]);
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { action, id, name, date } = body;
  if (action !== 'duplicate' || !id) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const source = await query('SELECT * FROM referers WHERE id = $1', [Number(id)]);
  if (!source.rows.length) {
    return NextResponse.json({ error: 'Referer not found' }, { status: 404 });
  }
  const referer = source.rows[0];
  const result = await query(
    'INSERT INTO referers (name, date, offer_rate, notes, related_image) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, date, referer.offer_rate, referer.notes, referer.related_image]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
