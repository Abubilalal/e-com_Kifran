// ============================================================
//  KIFRAN — api/products.js   (was api/products.php)
//  GET (all/one) · POST/PUT (upsert) · DELETE — backed by Neon.
// ============================================================
import { sql, ensureSchema, setHeaders, parseBody } from './_db.js';

// DB column (lowercase)  <->  API key (camelCase the frontend expects)
const BOOL_COLS = {
  showdiscount: 'showDiscount',
  showfreedelivery: 'showFreeDelivery',
  showdelivery: 'showDelivery',
  showrating: 'showRating',
  showstock: 'showStock',
};
const JSON_ARRAY_FIELDS = ['images', 'gallery', 'colors', 'sizes', 'features'];
const NUMERIC_FIELDS = ['price', 'mrp', 'stock', 'rating', 'reviews'];

function normalizeProduct(row) {
  const p = { ...row };

  JSON_ARRAY_FIELDS.forEach((f) => {
    try { p[f] = JSON.parse(p[f] ?? '[]') || []; } catch { p[f] = []; }
    if (!Array.isArray(p[f])) p[f] = [];
  });
  try { p.specs = JSON.parse(p.specs ?? '{}') || {}; } catch { p.specs = {}; }

  NUMERIC_FIELDS.forEach((f) => {
    if (p[f] !== null && p[f] !== undefined && p[f] !== '') p[f] = Number(p[f]);
  });

  // lowercase boolean columns -> camelCase booleans
  Object.entries(BOOL_COLS).forEach(([col, key]) => {
    p[key] = !!p[col];
    if (col !== key) delete p[col];
  });

  return p;
}

// Accepts the product payload and returns { columns, values } for an upsert,
// only for the fields actually supplied (mirrors the old PHP behaviour).
function buildUpsert(data) {
  const id = data.id ?? ('p' + Date.now());

  const scalarMap = {
    name: 'name', brand: 'brand', material: 'material', cat: 'cat',
    price: 'price', mrp: 'mrp', stock: 'stock', badge: 'badge',
    rating: 'rating', reviews: 'reviews', img: 'img', video: 'video',
    description: 'description',
    showDiscount: 'showdiscount', showFreeDelivery: 'showfreedelivery',
    showDelivery: 'showdelivery', showRating: 'showrating', showStock: 'showstock',
  };
  const jsonFields = ['images', 'gallery', 'colors', 'sizes', 'features', 'specs'];
  const boolKeys = ['showDiscount', 'showFreeDelivery', 'showDelivery', 'showRating', 'showStock'];

  const cols = ['id'];
  const vals = [id];

  for (const [key, col] of Object.entries(scalarMap)) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      cols.push(col);
      vals.push(boolKeys.includes(key) ? Boolean(data[key]) : data[key]);
    }
  }
  for (const f of jsonFields) {
    if (Object.prototype.hasOwnProperty.call(data, f)) {
      cols.push(f);
      vals.push(JSON.stringify(data[f]));
    }
  }
  return { id, cols, vals };
}

export default async function handler(req, res) {
  setHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await ensureSchema();

    if (req.method === 'GET') {
      if (req.query.id) {
        const rows = await sql`SELECT * FROM products WHERE id = ${req.query.id}`;
        if (!rows.length) return res.status(404).json({ error: 'Product not found' });
        return res.status(200).json(normalizeProduct(rows[0]));
      }
      const rows = await sql`SELECT * FROM products ORDER BY created_at DESC`;
      return res.status(200).json(rows.map(normalizeProduct));
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const data = parseBody(req);
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return res.status(400).json({ success: false, error: 'Invalid JSON' });
      }

      const existing = await sql`SELECT 1 FROM products WHERE id = ${data.id ?? ''}`;
      const exists = existing.length > 0;

      const { id, cols, vals } = buildUpsert(data);
      if (cols.length <= 1) {
        return res.status(400).json({ success: false, error: 'No product fields supplied' });
      }

      const placeholders = cols.map((_, i) => `$${i + 1}`);
      const updates = cols
        .filter((c) => c !== 'id')
        .map((c) => `${c} = EXCLUDED.${c}`)
        .concat('updated_at = now()');

      const text =
        `INSERT INTO products (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) ` +
        `ON CONFLICT (id) DO UPDATE SET ${updates.join(', ')}`;

      await sql(text, vals);
      return res.status(200).json({ success: true, id, action: exists ? 'updated' : 'created' });
    }

    if (req.method === 'DELETE') {
      const data = parseBody(req);
      const id = data.id ?? req.query.id ?? null;
      if (!id) return res.status(400).json({ success: false, error: 'ID required' });
      await sql`DELETE FROM products WHERE id = ${id}`;
      return res.status(200).json({ success: true, id, action: 'deleted' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, error: String(e?.message || e) });
  }
}