// ============================================================
//  KIFRAN — api/_db.js
//  Shared Neon (Postgres) client + schema bootstrap + headers.
//  Replaces the old Hostinger MySQL config.php.
// ============================================================
import { neon } from '@neondatabase/serverless';

// DATABASE_URL is set in the Vercel dashboard (Project → Settings →
// Environment Variables) and points at your Neon connection string.
//
// In production this is the Neon serverless driver. For local integration
// tests only (KF_TEST_PG set) we transparently swap in a node-postgres pool
// that exposes the same call surface — both `sql`...`` tagged templates and
// `sql.query(text, params)`. Production never imports `pg`.
let sql;
if (process.env.KF_TEST_PG) {
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: process.env.KF_TEST_PG });
  const run = async (text, params) => (await pool.query(text, params)).rows;
  sql = (strings, ...vals) => {
    let text = strings[0];
    for (let i = 0; i < vals.length; i++) text += '$' + (i + 1) + strings[i + 1];
    return run(text, vals);
  };
  sql.query = (text, params) => run(text, params);
} else {
  sql = neon(process.env.DATABASE_URL);
}

// ---- CORS + anti-cache headers (mirrors the old config.php) ----
// Without no-store, a GET to /api/products gets heuristically cached by the
// browser/CDN and reused across refreshes and logout/login, so admin sessions
// keep showing a stale product list. These force every read to hit Neon.
export function setHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

// Body can arrive parsed (object) or raw (string) depending on the client.
export function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

// ---- Schema bootstrap (runs once; CREATE ... IF NOT EXISTS is a no-op after) ----
let _ready = null;
export async function ensureSchema() {
  if (_ready) return _ready;
  _ready = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id               TEXT PRIMARY KEY,
        name             TEXT,
        brand            TEXT,
        material         TEXT,
        cat              TEXT,
        price            NUMERIC DEFAULT 0,
        mrp              NUMERIC DEFAULT 0,
        stock            INTEGER DEFAULT 0,
        badge            TEXT,
        rating           NUMERIC DEFAULT 0,
        reviews          INTEGER DEFAULT 0,
        img              TEXT,
        video            TEXT,
        description      TEXT,
        images           TEXT,
        gallery          TEXT,
        colors           TEXT,
        sizes            TEXT,
        features         TEXT,
        specs            TEXT,
        showdiscount     BOOLEAN DEFAULT FALSE,
        showfreedelivery BOOLEAN DEFAULT FALSE,
        showdelivery     BOOLEAN DEFAULT FALSE,
        showrating       BOOLEAN DEFAULT TRUE,
        showstock        BOOLEAN DEFAULT TRUE,
        created_at       TIMESTAMPTZ DEFAULT now(),
        updated_at       TIMESTAMPTZ DEFAULT now()
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id          TEXT PRIMARY KEY,
        date        TEXT,
        status      TEXT DEFAULT 'Pending',
        payment     TEXT DEFAULT 'UPI',
        customer    TEXT,
        items       TEXT,
        couponpct   NUMERIC DEFAULT 0,
        totals      TEXT,
        trackingid  TEXT,
        courier     TEXT,
        reviews     TEXT,
        created_at  TIMESTAMPTZ DEFAULT now()
      )`;
  })();
  return _ready;
}

export { sql };
