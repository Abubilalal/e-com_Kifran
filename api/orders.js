// ============================================================
//  KIFRAN — api/orders.js   (was api/orders.php)
//  GET (all) · POST (create/upsert) · PUT (partial update).
//  DB columns are lowercase; we alias to the camelCase keys the
//  frontend expects (couponPct, trackingId).
// ============================================================
import { sql, ensureSchema, setHeaders, parseBody } from './_db.js';

function normalizeOrder(o) {
  const r = { ...o };
  try { r.items = JSON.parse(r.items ?? '[]') || []; } catch { r.items = []; }
  try { r.totals = JSON.parse(r.totals ?? '{}') || {}; } catch { r.totals = {}; }
  try { r.customer = JSON.parse(r.customer ?? '{}') || {}; } catch { r.customer = {}; }
  try { r.reviews = JSON.parse(r.reviews ?? '{}') || {}; } catch { r.reviews = {}; }
  if (r.couponPct !== null && r.couponPct !== undefined && r.couponPct !== '') {
    r.couponPct = Number(r.couponPct);
  }
  return r;
}

export default async function handler(req, res) {
  setHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await ensureSchema();

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT id, date, status, payment, customer, items,
               couponpct AS "couponPct", totals,
               trackingid AS "trackingId", courier, reviews
        FROM orders ORDER BY date DESC`;
      return res.status(200).json(rows.map(normalizeOrder));
    }

    if (req.method === 'POST') {
      const d = parseBody(req);
      if (!d || !d.id) return res.status(400).json({ error: 'Invalid JSON' });

      await sql.query(
        `INSERT INTO orders
           (id, date, status, payment, customer, items, couponpct, totals, trackingid, courier)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           trackingid = EXCLUDED.trackingid,
           courier = EXCLUDED.courier`,
        [
          d.id,
          d.date ?? new Date().toISOString(),
          d.status ?? 'Pending',
          d.payment ?? 'UPI',
          JSON.stringify(d.customer ?? {}),
          JSON.stringify(d.items ?? []),
          d.couponPct ?? 0,
          JSON.stringify(d.totals ?? {}),
          d.trackingId ?? null,
          d.courier ?? null,
        ]
      );
      return res.status(200).json({ success: true, id: d.id });
    }

    if (req.method === 'PUT') {
      const d = parseBody(req);
      if (!d || !d.id) return res.status(400).json({ error: 'ID required' });

      const sets = [];
      const vals = [];
      const add = (frag, val) => { vals.push(val); sets.push(`${frag} = $${vals.length}`); };

      if (d.status !== undefined) add('status', d.status);
      if (d.trackingId !== undefined) add('trackingid', d.trackingId);
      if (d.courier !== undefined) add('courier', d.courier);
      if (d.reviews !== undefined) add('reviews', JSON.stringify(d.reviews));

      if (!sets.length) return res.status(200).json({ success: false, error: 'No fields to update' });

      vals.push(d.id);
      await sql.query(`UPDATE orders SET ${sets.join(', ')} WHERE id = $${vals.length}`, vals);
      return res.status(200).json({ success: true, id: d.id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, error: String(e?.message || e) });
  }
}
