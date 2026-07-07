'use strict';

const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { Pool } = require('pg');

const root = path.join(__dirname, '..');
loadEnv(path.join(root, '.env'));

const sqlitePath = process.argv[2] || path.join(root, 'live-pocket.db');
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Set it in .env or the shell before running this script.');
  process.exit(1);
}

const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: shouldUseSsl(databaseUrl) ? { rejectUnauthorized: false } : false,
});

const tables = [
  'users',
  'performances',
  'ticket_types',
  'reservations',
  'reservation_tickets',
  'qr_tickets',
  'favorites',
  'sessions',
  'banners',
  'taxonomy',
];

function loadEnv(file) {
  try {
    for (const line of require('node:fs').readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch {}
}

function shouldUseSsl(url) {
  if (process.env.PGSSLMODE === 'disable') return false;
  if (/localhost|127\.0\.0\.1/i.test(url)) return false;
  return /^postgres/i.test(url);
}

function quoteIdent(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

async function targetColumns(client, table) {
  const result = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
    [table]
  );
  return new Set(result.rows.map(row => row.column_name));
}

async function copyTable(client, table) {
  const sqliteColumns = sqlite.prepare(`PRAGMA table_info(${table})`).all().map(column => column.name);
  if (!sqliteColumns.length) return 0;

  const pgColumns = await targetColumns(client, table);
  const columns = sqliteColumns.filter(column => pgColumns.has(column));
  const rows = sqlite.prepare(`SELECT ${columns.map(quoteIdent).join(',')} FROM ${quoteIdent(table)}`).all();
  if (!rows.length) return 0;

  const columnSql = columns.map(quoteIdent).join(',');
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(',');
  const sql = `INSERT INTO ${quoteIdent(table)} (${columnSql}) VALUES (${placeholders})`;
  for (const row of rows) {
    await client.query(sql, columns.map(column => row[column]));
  }
  return rows.length;
}

async function resetSequence(client, table) {
  const result = await client.query(`SELECT pg_get_serial_sequence($1, 'id') seq`, [table]);
  const sequence = result.rows[0]?.seq;
  if (!sequence) return;
  await client.query(`SELECT setval($1, COALESCE((SELECT MAX(id) FROM ${quoteIdent(table)}), 1), true)`, [sequence]);
}

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`TRUNCATE ${tables.map(quoteIdent).join(', ')} RESTART IDENTITY CASCADE`);
    for (const table of tables) {
      const count = await copyTable(client, table);
      console.log(`${table}: ${count}`);
    }
    for (const table of tables) await resetSequence(client, table);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
    sqlite.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
