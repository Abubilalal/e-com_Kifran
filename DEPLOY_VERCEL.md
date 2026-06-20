# KIFRAN — Vercel + Neon deployment

This project was moved off Hostinger (PHP + MySQL) to **Vercel** (static site +
Node serverless functions) backed by **Neon** (Postgres). No PHP and no Hostinger
config remain.

## What changed
- `api/config.php, products.php, orders.php, seed.php, upload.php` → **removed**.
- New serverless functions (Vercel auto-detects everything in `/api`):
  - `api/products.js` — GET (all/one), POST/PUT (upsert), DELETE
  - `api/orders.js`   — GET (all), POST (create), PUT (status/tracking/reviews)
  - `api/seed.js`     — one-time, idempotent seeding of the 28 starter products
  - `api/_db.js`      — Neon client + auto-creates the tables on first call
- `kifran-data.js` now calls the same-origin API (`/api/...`, no `.php`), so it
  works on your production domain, Vercel previews, and localhost automatically.
- Aggressive cache-busting kept/added: `no-store` on every API response,
  `no-cache, must-revalidate` on HTML/JS/CSS (via `vercel.json`), plus a one-time
  localStorage purge so old kifran.com cached data is wiped on first visit.

## Deploy steps (one time)

1. **Create a Neon database** at https://neon.tech → copy its connection string
   (looks like `postgresql://USER:PASSWORD@ep-xxx.aws.neon.tech/dbname?sslmode=require`).

2. **Add it to Vercel**: your project → Settings → Environment Variables →
   add `DATABASE_URL` = that Neon string. Apply to Production (and Preview).

3. **Push this code** to your GitHub repo (`Abubilalal/e-com_Kifran`) and let
   Vercel build, or run `vercel --prod` from the folder.

4. **Seed the catalogue** (first run only). Either just open the site once — the
   app auto-calls `/api/seed` on first load — or hit it manually:
   `https://<your-vercel-domain>/api/seed`

5. **Verify**: open `/api/products` in the browser; you should see a JSON array of
   products. The storefront and `admin.html` should now read/write Neon.

## Important security notes
- The old `api/config.php` contained your Hostinger MySQL password in plain text,
  and it is still in your **git history**. Rotate/disable that old MySQL user in
  Hostinger so the leaked credentials are useless.
- Admin login (`admin@kifran.com` / `kifran@123`) is still checked in client-side
  JavaScript — anyone can read it in the browser. That's a pre-existing design
  choice, not something this migration changed; consider moving auth server-side
  later if the admin panel is public.

## Local testing (optional)
The DB layer can run against a local Postgres for tests by setting `KF_TEST_PG`
to a local connection string. Production never imports `pg`; it only uses Neon.
