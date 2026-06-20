/* ============================================================
   KIFRAN — kifran-data.js (Database Edition)
   Connects to Neon (Postgres) via Vercel serverless functions
============================================================ */
window.KF = (function () {
  // Same-origin Vercel serverless API (was Hostinger PHP on kifran.com).
  // Relative path => works on the production domain, previews and localhost.
  const API_BASE = '/api/';

  const KEYS = {
    products: 'kifran_products',
    cart:     'kifran_cart',
    orders:   'kifran_orders',
    session:  'kifran_admin_session',
    wish:     'kifran_wishlist',
    recent:   'kifran_recent',
    version:  'kifran_catalog_version',
    lastSync: 'kifran_last_sync'
  };

  const CATALOG_VERSION = 7; // Bumped for Vercel + Neon migration

  // ---- One-time cache purge on the Hostinger -> Vercel/Neon switch ----
  // Wipes any product/order data cached by browsers from the old kifran.com
  // build so the very first load on Vercel reads straight from Neon.
  const MIGRATION_TAG = 'kifran_migration_vercel_neon_v7';
  try {
    if (localStorage.getItem(MIGRATION_TAG) !== '1') {
      ['kifran_products', 'kifran_orders', 'kifran_catalog_version',
       'kifran_last_sync'].forEach(k => localStorage.removeItem(k));
      localStorage.setItem(MIGRATION_TAG, '1');
    }
  } catch (e) { /* private mode / storage disabled — ignore */ }

  const CARD_DEFAULTS = {
    showDiscount:     false,
    showDelivery:     false,
    showFreeDelivery: false,
    showRating:       true,
    showStock:        true,
  };

  const IMG = {
    cane:   'images/opt/cane-md.jpg',
    stick1: 'images/opt/stick1-md.jpg',
    stick2: 'images/opt/stick2-md.jpg',
    hook:   'images/opt/hook-md.jpg',
    yarn:   'images/opt/yarn-md.jpg',
  };

  const LQIP = { /* same as before */ };

  function slugOf(url) {
    const m = /opt\/([a-z0-9]+)-(?:thumb|md|lg)\.jpg/i.exec(url || '');
    return m ? m[1] : null;
  }
  function sizeOf(url, size) {
    if (!url) return url;
    return url.replace(/-(?:thumb|md|lg)\.jpg/i, '-' + size + '.jpg');
  }
  function thumbOf(url) { return sizeOf(url, 'thumb'); }
  function largeOf(url) { return sizeOf(url, 'lg'); }
  function lqipOf(url) {
    const s = slugOf(url);
    return (s && LQIP[s]) || 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  }

  /* ---- API helpers ---- */
  async function apiGet(endpoint) {
    // Bust any HTTP/proxy cache: append a unique param AND send no-store so
    // every read comes straight from the database, never a cached response.
    const sep = endpoint.includes('?') ? '&' : '?';
    const url = API_BASE + endpoint + sep + '_=' + Date.now();
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
  }
  
  async function apiPost(endpoint, data) {
    const res = await fetch(API_BASE + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
  }
  
  async function apiPut(endpoint, data) {
    const res = await fetch(API_BASE + endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
  }
  
  async function apiDelete(endpoint, data) {
    const res = await fetch(API_BASE + endpoint, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
  }

  /* ---- description formatter ---- */
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function descToHtml(desc) {
    if (!desc) return '';
    if (/<\/?(p|ul|ol|li|br|strong|em|b|i|h[1-6])\b/i.test(desc)) return desc;
    const raw = String(desc).replace(/\r\n/g, '\n');
    const lines = raw.split('\n')
      .map(l => l.replace(/^\s*[•\-*▪◦·]\s*/, '').trim())
      .filter(Boolean);
    if (lines.length === 0) return '';
    if (lines.length === 1) return '<p>' + escapeHtml(lines[0]) + '</p>';
    const allShort = lines.every(l => l.length <= 90);
    if (allShort) {
      return '<ul class="desc-list">' +
        lines.map(l => '<li>' + escapeHtml(l) + '</li>').join('') +
        '</ul>';
    }
    return lines.map(l => '<p>' + escapeHtml(l) + '</p>').join('');
  }

  /* ---- enrichment ---- */
  function enrich(p) {
    if (!p) return p;
    const e = { ...p };
    if (!e.desc && e.description) e.desc = e.description;
    if (!e.brand)    e.brand    = 'KIFRAN';
    if (!e.material) e.material = 'Natural wood';
    if (!e.rating)  e.rating  = 4.7;
    if (!e.reviews) e.reviews = 40;
    if (!e.colors)  e.colors  = ['Natural'];
    if (!e.sizes)   e.sizes   = [];

    let imgs = Array.isArray(e.images) && e.images.length ? e.images
             : (Array.isArray(e.gallery) && e.gallery.length ? e.gallery
             : (e.img ? [e.img] : []));
    imgs = imgs.filter(Boolean);
    if (!imgs.length) imgs = ['images/opt/cane-md.jpg'];
    e.images  = imgs;
    e.img     = imgs[0];
    e.gallery = imgs;
    e.video = e.video || '';

    for (const k in CARD_DEFAULTS) {
      e[k] = (typeof e[k] === 'boolean') ? e[k] : CARD_DEFAULTS[k];
    }

    e.discount = (e.mrp && e.mrp > e.price) ? Math.round(((e.mrp - e.price) / e.mrp) * 100) : 0;
    e.desc = e.desc || `The ${e.name} is shaped by hand from ${e.material.toLowerCase()}, finished slowly so the grain stays honest beneath your fingertips.`;
    e.descHtml = descToHtml(e.desc);
    e.features = e.features || [
      `Hand-finished ${e.material}`,
      'Food-safe natural oil seal',
      'Sustainably sourced timber',
      'No two grains ever alike',
    ];
    e.specs = e.specs || {
      Material: e.material,
      Finish: 'Hand-rubbed natural oil',
      Origin: 'Handcrafted in India',
      Care: 'Wipe clean, re-oil occasionally',
      Warranty: '1-year craftsmanship warranty',
    };
    e.sku = 'KF-' + e.id.toUpperCase();
    return e;
  }

  /* ---- Cache management ---- */
  function read(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
    catch (e) { return fallback; }
  }
  function write(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  /* ---- PRODUCTS (Database-backed) ---- */
  let _productsCache = null;
  let _cacheTimestamp = 0;
  const CACHE_TTL = 30000; // 30 seconds

  async function fetchProducts() {
    try {
      const products = await apiGet('products');
      _productsCache = products.map(enrich);
      _cacheTimestamp = Date.now();
      write(KEYS.products, products); // Backup to localStorage for offline
      write(KEYS.lastSync, Date.now());
      return _productsCache;
    } catch (err) {
      console.warn('DB fetch failed, using local cache:', err);
      // Fallback to localStorage
      const cached = read(KEYS.products, []);
      _productsCache = cached.map(enrich);
      return _productsCache;
    }
  }

  function getProducts() {
    if (_productsCache && (Date.now() - _cacheTimestamp) < CACHE_TTL) {
      return _productsCache;
    }
    // Return cached immediately, refresh in background
    const promise = fetchProducts();
    if (_productsCache) return _productsCache;
    // First load - return seed and wait
    return read(KEYS.products, []).map(enrich);
  }

  async function getProductsAsync() {
    return await fetchProducts();
  }

  function getProduct(id) {
    const all = getProducts();
    return enrich(all.find(p => p.id === id));
  }

  async function setProducts(arr) {
    // This is now handled via individual API calls in admin
    _productsCache = arr.map(enrich);
    write(KEYS.products, arr);
  }

  async function saveProduct(data) {
    const payload = { ...data };
    if (payload.desc && !payload.description) payload.description = payload.desc;
    delete payload.desc;
    const result = await apiPost('products', payload);
    _productsCache = null; // Invalidate cache
    await fetchProducts();
    return result;
  }

  async function deleteProduct(id) {
    const result = await apiDelete('products', { id });
    _productsCache = null;
    await fetchProducts();
    return result;
  }

  /* ---- Catalogue queries ---- */
  function categories() { return [...new Set(getProducts().map(p => p.cat))]; }
  function brands()     { return [...new Set(getProducts().map(p => p.brand || 'KIFRAN'))]; }
  function materials()  { return [...new Set(getProducts().map(p => p.material))]; }
  function colorsAll()  { return [...new Set(getProducts().flatMap(p => p.colors))]; }
  function byCat(cat)   { return getProducts().filter(p => p.cat === cat); }
  function search(q) {
    q = (q || '').trim().toLowerCase();
    if (!q) return [];
    return getProducts().filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.cat.toLowerCase().includes(q) ||
      p.material.toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q)
    );
  }
  function related(id, n = 8) {
    const me = getProduct(id);
    if (!me) return getProducts().slice(0, n);
    const same = getProducts().filter(p => p.id !== id && p.cat === me.cat);
    const rest = getProducts().filter(p => p.id !== id && p.cat !== me.cat);
    return [...same, ...rest].slice(0, n);
  }
  function bestSellers(n = 8) { return [...getProducts()].sort((a, b) => b.reviews - a.reviews).slice(0, n); }
  function topRated(n = 8)    { return [...getProducts()].sort((a, b) => b.rating - a.rating).slice(0, n); }
  function trending(n = 8)    { return getProducts().filter(p => ['Trending','Hot Deal','Bestseller'].includes(p.badge)).slice(0, n); }
  function newArrivals(n = 8) { return getProducts().filter(p => p.badge === 'New').concat(getProducts()).slice(0, n); }

  /* ---- Wishlist (still localStorage) ---- */
  function getWish() { return read(KEYS.wish, []); }
  function isWished(id) { return getWish().includes(id); }
  function toggleWish(id) {
    let w = getWish();
    if (w.includes(id)) w = w.filter(x => x !== id); else w.push(id);
    write(KEYS.wish, w);
    return w.includes(id);
  }
  function wishCount() { return getWish().length; }

  /* ---- Recently viewed ---- */
  function getRecent() { return read(KEYS.recent, []); }
  function pushRecent(id) {
    let r = getRecent().filter(x => x !== id);
    r.unshift(id);
    write(KEYS.recent, r.slice(0, 12));
  }
  function recentProducts(excludeId, n = 8) {
    return getRecent().filter(id => id !== excludeId).map(getProduct).filter(Boolean).slice(0, n);
  }

  /* ---- Cart (still localStorage - per-user) ---- */
  function getCart() { return read(KEYS.cart, []); }
  function setCart(arr) { write(KEYS.cart, arr); }
  function cartCount() { return getCart().reduce((n, i) => n + i.qty, 0); }
  function addToCart(id, qty = 1, meta) {
    const cart = getCart();
    const row = cart.find(i => i.id === id && JSON.stringify(i.meta || null) === JSON.stringify(meta || null));
    if (row) row.qty += qty; else cart.push(meta ? { id, qty, meta } : { id, qty });
    setCart(cart);
    return cartCount();
  }
  function setQty(id, qty) {
    let cart = getCart();
    if (qty <= 0) cart = cart.filter(i => i.id !== id);
    else { const r = cart.find(i => i.id === id); if (r) r.qty = qty; }
    setCart(cart);
  }
  function removeFromCart(id) { setCart(getCart().filter(i => i.id !== id)); }
  function clearCart() { setCart([]); }
  function cartDetailed() {
    return getCart().map(i => {
      const p = getProduct(i.id);
      return p ? { ...p, qty: i.qty, lineTotal: p.price * i.qty } : null;
    }).filter(Boolean);
  }

  /* ---- Orders (Database-backed) ---- */
  let _ordersCache = null;

  async function fetchOrders() {
    try {
      const orders = await apiGet('orders');
      _ordersCache = orders;
      write(KEYS.orders, orders);
      return orders;
    } catch (err) {
      console.warn('Orders fetch failed:', err);
      return read(KEYS.orders, []);
    }
  }

  function getOrders() {
    if (_ordersCache) return _ordersCache;
    const cached = read(KEYS.orders, []);
    fetchOrders(); // Refresh in background
    return cached;
  }

  async function getOrdersAsync() {
    return await fetchOrders();
  }

  function setOrders(arr) {
    _ordersCache = arr;
    write(KEYS.orders, arr);
  }

  async function addOrder(order) {
    try {
      await apiPost('orders', order);
      _ordersCache = null;
      await fetchOrders();
    } catch (err) {
      // Fallback: store locally and sync later
      const o = getOrders();
      o.unshift(order);
      setOrders(o);
    }
  }

  function getOrder(id) { return getOrders().find(x => x.id === id); }

  async function updateOrderStatus(id, status) {
    try {
      await apiPut('orders', { id, status });
      _ordersCache = null;
      await fetchOrders();
    } catch (err) {
      const o = getOrders(); const r = o.find(x => x.id === id);
      if (r) { r.status = status; setOrders(o); }
    }
  }

  async function setOrderTracking(id, trackingId, courier) {
    try {
      await apiPut('orders', { id, trackingId, courier });
      _ordersCache = null;
      await fetchOrders();
    } catch (err) {
      const o = getOrders(); const r = o.find(x => x.id === id);
      if (r) { r.trackingId = trackingId; if (courier) r.courier = courier; setOrders(o); }
    }
  }

  async function addOrderReview(orderId, productId, rating, text) {
    try {
      const o = getOrders(); const r = o.find(x => x.id === orderId);
      if (r) {
        r.reviews = r.reviews || {};
        r.reviews[productId] = { rating, text, at: Date.now() };
        await apiPut('orders', { id: orderId, reviews: r.reviews });
        _ordersCache = null;
        await fetchOrders();
      }
    } catch (err) {
      const o = getOrders(); const r = o.find(x => x.id === orderId);
      if (r) { r.reviews = r.reviews || {}; r.reviews[productId] = { rating, text, at: Date.now() }; setOrders(o); }
    }
  }

  /* ---- Admin session ---- */
  const ADMIN = { email: 'admin@kifran.com', password: 'kifran@123' };
  function login(email, password) {
    if (email.trim().toLowerCase() === ADMIN.email && password === ADMIN.password) {
      write(KEYS.session, { email, at: Date.now() }); return true;
    }
    return false;
  }
  function isLoggedIn() { return !!read(KEYS.session, null); }
  function logout() {
    localStorage.removeItem(KEYS.session);
    // Drop the cached catalogue so the next login is forced to re-read the DB.
    // (Otherwise a stale localStorage copy could paint before the fresh fetch.)
    localStorage.removeItem(KEYS.products);
    _productsCache = null;
    _cacheTimestamp = 0;
  }

  /* ---- Utilities ---- */
  function money(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }
  function videoInfo(src) {
    src = (src || '').trim();
    if (!src) return null;
    const yt = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i.exec(src);
    if (yt) return { type: 'embed', url: 'https://www.youtube.com/embed/' + yt[1] + '?rel=0' };
    const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/i.exec(src);
    if (vimeo) return { type: 'embed', url: 'https://player.vimeo.com/video/' + vimeo[1] };
    return { type: 'file', url: src };
  }
  function computeTotals(items, discountPct = 0) {
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const shipping = subtotal >= 2000 || subtotal === 0 ? 0 : 99;
    const discount = Math.round((subtotal * discountPct) / 100);
    const taxable  = subtotal - discount;
    const gst      = Math.round(taxable * 0.18);
    const grand    = taxable + gst + shipping;
    return { subtotal, shipping, discount, gst, grand };
  }
  const COUPONS = { 'KIFRAN10': 10, 'WOOD15': 15, 'WELCOME5': 5 };
  function couponPct(code) { return COUPONS[(code || '').trim().toUpperCase()] || 0; }

  /* ---- Init: Seed DB on first run ---- */
  async function initDB() {
    const lastSync = read(KEYS.lastSync, 0);
    if (!lastSync) {
      // First time - trigger seed
      try {
        await fetch(API_BASE + 'seed');
        await fetchProducts();
      } catch(e) { console.log('Seed not needed or failed:', e); }
    }
  }
  
  // Auto-init
  initDB();

  return {
    KEYS, CATALOG_VERSION, API_BASE,
    getProducts, getProductsAsync, setProducts, getProduct,
    saveProduct, deleteProduct,
    categories, brands, materials, colorsAll, byCat, search, related,
    bestSellers, topRated, trending, newArrivals,
    getWish, isWished, toggleWish, wishCount,
    getRecent, pushRecent, recentProducts,
    getCart, setCart, cartCount, addToCart, setQty, removeFromCart, clearCart, cartDetailed,
    getOrders, getOrdersAsync, setOrders, addOrder, getOrder, 
    updateOrderStatus, setOrderTracking, addOrderReview,
    login, isLoggedIn, logout, ADMIN,
    money, computeTotals, couponPct, COUPONS, videoInfo, CARD_DEFAULTS,
    thumbOf, largeOf, lqipOf, sizeOf, slugOf,
    fetchProducts, fetchOrders // Expose for manual refresh
  };
})();
