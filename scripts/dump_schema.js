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

function pgType(col) {
  if (col.data_type === 'character varying') {
    if (col.character_maximum_length) return `VARCHAR(${col.character_maximum_length})`;
    return 'VARCHAR';
  }
  if (col.data_type === 'integer') return 'INTEGER';
  if (col.data_type === 'date') return 'DATE';
  if (col.data_type === 'bytea') return 'BYTEA';
  if (col.data_type === 'numeric') {
    if (col.numeric_precision && col.numeric_scale != null) return `NUMERIC(${col.numeric_precision},${col.numeric_scale})`;
    return 'NUMERIC';
  }
  if (col.data_type === 'point') return 'POINT';
  return col.data_type.toUpperCase();
}

(async function main(){
  const env = loadEnv();
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL missing');
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const client = await pool.connect();
  try{
    const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name");
    const tables = tablesRes.rows.map(r=>r.table_name);

    let out = "-- Generated schema from database\n\nCREATE EXTENSION IF NOT EXISTS pgcrypto;\n\n";

    for (const t of tables) {
      const colsRes = await client.query(`SELECT column_name,data_type,is_nullable,column_default,character_maximum_length,numeric_precision,numeric_scale FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`, [t]);
      const consRes = await client.query(`SELECT conname, contype, pg_get_constraintdef(c.oid) AS def FROM pg_constraint c JOIN pg_class cl ON c.conrelid = cl.oid WHERE cl.relname=$1`, [t]);
      const idxsRes = await client.query(`SELECT indexname, indexdef FROM pg_indexes WHERE tablename=$1`, [t]);

      out += `CREATE TABLE ${t} (\n`;
      const colLines = colsRes.rows.map(col => {
        const type = pgType(col);
        const nullable = col.is_nullable === 'NO' ? ' NOT NULL' : '';
        const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        return `    ${col.column_name} ${type}${nullable}${def}`;
      });
      out += colLines.join(',\n') + '\n';

      // constraints: primary key and others will be appended after table definition via ALTER TABLE if needed
      out += `);\n\n`;

      // Append constraints (primary keys, foreign keys, checks, uniques)
      for (const c of consRes.rows) {
        const def = c.def;
        if (c.contype === 'p') {
          out += `ALTER TABLE ${t} ADD CONSTRAINT ${c.conname} ${def};\n`;
        } else if (c.contype === 'f') {
          out += `ALTER TABLE ${t} ADD CONSTRAINT ${c.conname} ${def};\n`;
        } else if (c.contype === 'c') {
          out += `ALTER TABLE ${t} ADD CONSTRAINT ${c.conname} ${def};\n`;
        } else if (c.contype === 'u') {
          out += `ALTER TABLE ${t} ADD CONSTRAINT ${c.conname} ${def};\n`;
        } else {
          out += `-- constraint ${c.conname} (${c.contype}): ${def}\n`;
        }
      }

      // Indexes (non-constraint)
      for (const idx of idxsRes.rows) {
        out += idx.indexdef + ';\n';
      }

      out += '\n';
    }

    fs.writeFileSync('database/schema.sql', out);
    console.log('Wrote database/schema.sql');
  } catch(e){
    console.error('ERROR', e);
    process.exit(1);
  } finally{
    await client.release();
    await pool.end();
  }
})();
