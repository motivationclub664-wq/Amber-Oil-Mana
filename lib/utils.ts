export function formatCurrency(value: number | bigint | string | null | undefined) {
  if (value == null || value === '') return '-';
  const numberValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numberValue);
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('vi-VN');
}

export function formatDateForInput(date: string | Date | null | undefined) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function parseLocationValue(value: unknown) {
  if (value == null || value === '') return null;

  if (typeof value === 'string') {
    const cleaned = value.replace(/[()]/g, '').trim();
    const parts = cleaned.split(/[,;\s]+/).map((part) => part.trim()).filter(Boolean);
    if (parts.length !== 2) return null;
    const lat = Number(parts[0]);
    const lng = Number(parts[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.x === 'number' && typeof record.y === 'number') {
      return { lat: record.x, lng: record.y };
    }
    if (typeof record.lat === 'number' && typeof record.lng === 'number') {
      return { lat: record.lat, lng: record.lng };
    }
    if (Array.isArray(value) && value.length >= 2) {
      const lat = Number(value[0]);
      const lng = Number(value[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    }
  }

  return null;
}

export function normalizeLocationForClient(value: unknown) {
  const point = parseLocationValue(value);
  if (!point) return '';
  return `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
}

export function normalizeLocationForServer(value: unknown) {
  const point = parseLocationValue(value);
  if (!point) return null;
  return `(${point.lat},${point.lng})`;
}

export function base64ToBuffer(base64: string) {
  return Buffer.from(base64.replace(/^data:.*;base64,/, ''), 'base64');
}

export function bufferToBase64(buffer: Buffer | null | undefined) {
  if (!buffer) return null;
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

export function serializeRowImages<T extends Record<string, unknown>>(row: T, fields: string[]) {
  const converted = { ...row } as Record<string, unknown>;
  fields.forEach((field) => {
    const value = row[field] as unknown;
    if (value instanceof Buffer) {
      converted[field] = bufferToBase64(value);
    }
  });
  return converted as T;
}
