/* ============================================================
   KIFRAN — shop.js
   Shared marketplace chrome + helpers for:
   store.html · plp.html · product.html · orders.html
   Depends on KF (kifran-data.js).
============================================================ */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);

  /* ---------- safety shim ----------
     If an older kifran-data.js is ever deployed alongside this file,
     the image-size helpers may be missing. Polyfill them so cards and
     the product page never crash with "KF.thumbOf is not a function". */
  (function ensureImgHelpers() {
    const K = window.KF;
    if (!K) return;
    const sizeOf = (url, size) => !url ? url : String(url).replace(/-(?:thumb|md|lg)\.jpg/i, '-' + size + '.jpg');
    if (typeof K.sizeOf  !== 'function') K.sizeOf  = sizeOf;
    if (typeof K.thumbOf !== 'function') K.thumbOf = (u) => sizeOf(u, 'thumb');
    if (typeof K.largeOf !== 'function') K.largeOf = (u) => sizeOf(u, 'lg');
    if (typeof K.lqipOf  !== 'function') K.lqipOf  = () => 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  })();

  /* ---------- icons ---------- */
  const I = {
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
    heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    cart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
    user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    box:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    wa:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-1.7-.9-2.9-1.6-4-3.5-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6 1.9.8 2.7.9 3.6.8.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z"/><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 1 1-2.9-.2-.3A8 8 0 1 1 12 20z"/></svg>',
    chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>',
  };

  /* ---------- chrome markup ---------- */
  function navHTML() {
    const cats = KF.categories();
    const catLinks = cats.map(c => `<a href="plp.html?cat=${encodeURIComponent(c)}">${c}</a>`).join('');
    return `
    <header class="mkt-nav">
      <div class="mkt-nav-top">
        <button class="mkt-ic mkt-burger" id="kfBurger" aria-label="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
        <a href="store.html" class="mkt-logo">
          <img src="images/kifran_logo.png" class="site-logo">
        </a>
        <div class="mkt-search">
          <input id="kfSearch" type="text" placeholder="Search canes, yarn tools, gifts…" autocomplete="off" aria-label="Search products"/>
          <button class="mkt-search-btn" id="kfSearchBtn" aria-label="Search">${I.search}</button>
          <div class="mkt-search-sug" id="kfSug"></div>
        </div>
        <div class="mkt-icons">
          <a href="plp.html" class="mkt-ic" aria-label="Shop">${I.grid}</a>
          <a href="plp.html?wish=1" class="mkt-ic" aria-label="Wishlist">${I.heart}<span class="count" id="kfWishCount"></span></a>
          <button class="mkt-ic" id="kfCartBtn" aria-label="Cart">${I.cart}<span class="count" id="kfCartCount"></span></button>
          <a href="orders.html" class="mkt-ic" aria-label="Orders">${I.box}</a>
          <a href="checkout.html" class="mkt-ic" aria-label="Account">${I.user}</a>
        </div>
      </div>
      <div class="mkt-cats"><div class="mkt-cats-inner">
        <a href="plp.html">All</a>${catLinks}<a href="plp.html?sale=1" class="sale">Sale</a>
        <a href="about.html">About</a><a href="contact.html">Contact</a>
      </div></div>
    </header>

    <div class="mkt-mobile" id="kfMobile">
      <button class="mm-close" id="kfMobileClose">✕</button>
      <a href="store.html">Store</a>
      <a href="plp.html">Shop All</a>
      ${cats.map(c => `<a href="plp.html?cat=${encodeURIComponent(c)}">${c}</a>`).join('')}
      <a href="orders.html">My Orders</a>
      <a href="about.html">About</a>
      <a href="contact.html">Contact</a>
      <a href="index.html">Our Story</a>
    </div>

    <nav class="mkt-bottom">
      <a href="store.html" data-nav="store">${I.home}<span>Home</span></a>
      <a href="plp.html" data-nav="shop">${I.grid}<span>Shop</span></a>
      <a href="plp.html?wish=1" data-nav="wish">${I.heart}<span>Saved</span><span class="count" id="kfWishCountM"></span></a>
      <a href="#" id="kfCartBtnM" data-nav="cart">${I.cart}<span>Cart</span><span class="count" id="kfCartCountM"></span></a>
      <a href="orders.html" data-nav="orders">${I.box}<span>Orders</span></a>
    </nav>

    <div class="kf-cart-overlay" id="kfCartOverlay"></div>
    <aside class="kf-cart" id="kfCart" aria-label="Cart">
      <div class="kf-cart-head"><h3>Your cart</h3><button id="kfCartClose">✕</button></div>
      <div class="kf-cart-body" id="kfCartBody"></div>
      <div class="kf-cart-foot">
        <div class="subt"><span>Subtotal</span><b id="kfSubtotal">₹0</b></div>
        <button class="kf-checkout" id="kfCheckout">Proceed to checkout →</button>
      </div>
    </aside>

    <div class="floats">
      <a class="float-btn wa" href="https://wa.me/+917817865282" target="_blank" rel="noopener" aria-label="WhatsApp support">${I.wa}</a>
      <button class="float-btn chat" id="kfChat" aria-label="Chat support">${I.chat}</button>
    </div>

    <div class="rp-toast" id="kfRp"></div>
    <div id="toasts"></div>`;
  }

  /* ---------- stars ---------- */
  function stars(rating) {
    const full = Math.round(rating);
    let s = '';
    for (let i = 1; i <= 5; i++) s += i <= full ? '★' : '<span class="empty">★</span>';
    return s;
  }

  /* ---------- product card ---------- */
  function card(p) {
    const imgs = (p.images && p.images.length) ? p.images : [p.img];
    const img1 = KF.thumbOf(imgs[0]);
    const img2 = KF.thumbOf(imgs[1] || imgs[0]);
    const lqip = KF.lqipOf(imgs[0]);
    const wished = KF.isWished(p.id) ? ' on' : '';
    const out = p.stock <= 0;

    /* admin-controlled, promo-clutter OFF unless a product opts in */
    const disc = (p.showDiscount && p.discount)
      ? `<span class="mc-badge disc">${p.discount}% OFF</span>` : '';
    let bcls = 'mc-badge';
    if (p.badge === 'New') bcls += ' new';
    if (p.badge === 'Hot Deal') bcls += ' deal';
    const badge = p.badge ? `<span class="${bcls}">${p.badge}</span>` : '';

    /* low-stock pill (only when enabled + actually low) */
    const stockPill = (p.showStock && !out && p.stock <= 5)
      ? `<span class="mc-stock-pill">Only ${p.stock} left</span>` : '';

    const rate = p.showRating ? `
      <span class="mc-rate">
        <span class="stars">${stars(p.rating)}</span>
        <span class="rate-val">${p.rating}</span>
        <span class="rev">(${p.reviews})</span>
      </span>` : '';

    const priceMrp = (p.showDiscount && p.mrp > p.price)
      ? `<span class="mrp">${KF.money(p.mrp)}</span><span class="off">${p.discount}% off</span>` : '';

    /* delivery line: free-delivery + speed each gated independently */
    let deliv = '';
    if (p.showFreeDelivery && p.price >= 2000) deliv = 'Free delivery';
    else if (p.showDelivery) deliv = '3–6 day delivery';
    else if (p.showFreeDelivery) deliv = 'Delivery ₹99';
    const delivHTML = deliv ? `<span class="mc-deliv">${deliv}</span>` : '';

    return `
    <div class="mc-card" data-id="${p.id}">
      <a class="mc-media" href="product.html?id=${p.id}" style="background-image:url(${lqip})">
        <img class="img-1 kf-img" src="${img1}" alt="${p.name}" loading="lazy" decoding="async" width="600" height="750" onload="this.classList.add('ok')"/>
        <img class="img-2 kf-img" src="${img2}" alt="" loading="lazy" decoding="async" width="600" height="750" onload="this.classList.add('ok')"/>
        <div class="mc-badges">${badge}${disc}${stockPill}</div>
        ${out ? '<div class="mc-soldout"><span>Sold out</span></div>' : ''}
      </a>
      <button class="mc-wish${wished}" data-wish="${p.id}" aria-label="Save">${I.heart}</button>
      <div class="mc-overlay"><button class="mc-quick" data-quick="${p.id}">Quick view</button></div>
      <div class="mc-info">
        <span class="mc-brand">${p.brand}</span>
        <a class="mc-name" href="product.html?id=${p.id}">${p.name}</a>
        ${rate}
        <div class="mc-price"><span class="now">${KF.money(p.price)}</span>${priceMrp}</div>
        ${delivHTML}
        <button class="mc-add" data-add="${p.id}" ${out ? 'disabled' : ''}>${out ? 'Sold out' : 'Add to cart'}</button>
      </div>
    </div>`;
  }

  function renderGrid(el, products) {
    if (!el) return;
    el.innerHTML = products.map(card).join('');
  }

  /* ---------- toast ---------- */
  function toast(msg, type = '') {
    const wrap = $('#toasts'); if (!wrap) return alert(msg);
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 2600);
  }

  /* ---------- counts ---------- */
  function refreshCounts() {
    const c = KF.cartCount(), w = KF.wishCount();
    [['#kfCartCount', c], ['#kfCartCountM', c], ['#kfWishCount', w], ['#kfWishCountM', w]].forEach(([sel, n]) => {
      const el = $(sel); if (!el) return;
      el.textContent = n; el.classList.toggle('show', n > 0);
    });
  }

  /* ---------- cart drawer ---------- */
  function openCart() { $('#kfCart').classList.add('open'); $('#kfCartOverlay').classList.add('open'); document.body.style.overflow = 'hidden'; renderCart(); }
  function closeCart() { $('#kfCart').classList.remove('open'); $('#kfCartOverlay').classList.remove('open'); document.body.style.overflow = ''; }
  function renderCart() {
    const items = KF.cartDetailed();
    const body = $('#kfCartBody');
    if (!items.length) {
      body.innerHTML = '<div class="kf-cart-empty">Your cart is empty.<a href="plp.html">Browse the collection →</a></div>';
    } else {
      body.innerHTML = items.map(it => `
        <div class="kf-citem">
          <img src="${KF.thumbOf(it.img)}" alt="${it.name}" loading="lazy" decoding="async"/>
          <div class="ci-mid">
            <div class="ci-name">${it.name}</div>
            <div class="ci-price">${KF.money(it.price)}</div>
            <div class="ci-qty">
              <button data-dec="${it.id}">−</button><span>${it.qty}</span><button data-inc="${it.id}">+</button>
            </div>
          </div>
          <button class="ci-rm" data-rm="${it.id}">✕</button>
        </div>`).join('');
    }
    const sub = items.reduce((s, i) => s + i.lineTotal, 0);
    $('#kfSubtotal').textContent = KF.money(sub);
    refreshCounts();
  }

  /* ---------- add to cart (with button feedback) ---------- */
  function addToCart(id, qty = 1, btn) {
    KF.addToCart(id, qty);
    renderCart();
    const p = KF.getProduct(id);
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Added ✓'; btn.classList.add('added');
      setTimeout(() => { btn.textContent = orig; btn.classList.remove('added'); }, 1500);
    }
    toast(`${p ? p.name : 'Item'} added to cart`, 'ok');
    setTimeout(openCart, 260);
  }

  /* ---------- wishlist toggle ---------- */
  function toggleWish(id, btn) {
    const on = KF.toggleWish(id);
    if (btn) btn.classList.toggle('on', on);
    document.querySelectorAll(`[data-wish="${id}"]`).forEach(b => b.classList.toggle('on', on));
    refreshCounts();
    toast(on ? 'Saved to wishlist' : 'Removed from wishlist', on ? 'ok' : '');
  }

  /* ---------- quick view ---------- */
  function quickView(id) {
    const p = KF.getProduct(id); if (!p) return;
    let m = $('#kfQv');
    if (!m) {
      m = document.createElement('div');
      m.className = 'modal-overlay'; m.id = 'kfQv';
      document.body.appendChild(m);
      m.addEventListener('click', e => { if (e.target === m) m.classList.remove('show'); });
    }
    m.innerHTML = `<div class="modal" style="max-width:680px">
      <div class="qv-body">
        <div class="qv-img"><img src="${p.img}" alt="${p.name}" decoding="async"/></div>
        <div class="qv-info">
          <span class="pd-brand">${p.brand}</span>
          <h3>${p.name}</h3>
          <span class="mc-rate"><span class="stars" style="color:var(--gold)">${stars(p.rating)}</span> <span class="rev" style="color:var(--sand-dim);font-family:var(--mono);font-size:11px">${p.rating} · ${p.reviews} reviews</span></span>
          <div class="qv-price">${KF.money(p.price)}${p.mrp > p.price ? `<s>${KF.money(p.mrp)}</s>` : ''}</div>
          <p>${p.desc}</p>
          <div class="qv-actions">
            <button class="pd-cart" style="flex:1;background:var(--ink);color:var(--gold);border:none;border-radius:40px;padding:13px;font-size:11px;letter-spacing:.1em;text-transform:uppercase" data-add="${p.id}">Add to cart</button>
            <a class="pd-buy" style="flex:1;background:var(--gold);color:var(--ink);border-radius:40px;padding:13px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;text-align:center" href="product.html?id=${p.id}">View details</a>
          </div>
        </div>
      </div>
      <div class="modal-actions"><button class="btn-ghost" data-close-qv>Close</button></div>
    </div>`;
    m.classList.add('show');
    m.querySelector('[data-close-qv]').addEventListener('click', () => m.classList.remove('show'));
  }

  /* ---------- delegated events ---------- */
  function bindDelegation() {
    document.addEventListener('click', e => {
      const add = e.target.closest('[data-add]');
      if (add) { e.preventDefault(); if (!add.disabled) addToCart(add.dataset.add, 1, add); return; }
      const wish = e.target.closest('[data-wish]');
      if (wish) { e.preventDefault(); toggleWish(wish.dataset.wish, wish); return; }
      const quick = e.target.closest('[data-quick]');
      if (quick) { e.preventDefault(); quickView(quick.dataset.quick); return; }
      const inc = e.target.closest('[data-inc]'); if (inc) { KF.addToCart(inc.dataset.inc, 1); renderCart(); return; }
      const dec = e.target.closest('[data-dec]'); if (dec) { const r = KF.getCart().find(i => i.id === dec.dataset.dec); KF.setQty(dec.dataset.dec, (r ? r.qty : 1) - 1); renderCart(); return; }
      const rm = e.target.closest('[data-rm]'); if (rm) { KF.removeFromCart(rm.dataset.rm); renderCart(); return; }
    });
  }

  /* ---------- search suggestions ---------- */
  function bindSearch() {
    const input = $('#kfSearch'), sug = $('#kfSug'), btn = $('#kfSearchBtn');
    if (!input) return;
    function go() { const q = input.value.trim(); if (q) location.href = 'plp.html?q=' + encodeURIComponent(q); }
    function render() {
      const q = input.value.trim();
      if (!q) { sug.classList.remove('show'); return; }
      const res = KF.search(q).slice(0, 6);
      sug.innerHTML = res.length
        ? res.map(p => `<a class="mkt-sug-item" href="product.html?id=${p.id}"><img src="${KF.thumbOf(p.img)}" alt="" loading="lazy" decoding="async"/><div><div class="s-name">${p.name}</div><div class="s-cat">${p.cat}</div></div><span class="s-price">${KF.money(p.price)}</span></a>`).join('')
        : '<div class="mkt-sug-empty">No matches — try “cane” or “yarn”.</div>';
      sug.classList.add('show');
    }
    input.addEventListener('input', render);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    btn && btn.addEventListener('click', go);
    document.addEventListener('click', e => { if (!e.target.closest('.mkt-search')) sug.classList.remove('show'); });
  }

  /* ---------- recently-purchased social proof ---------- */
 const PROOF_NAMES = [
  'Peter from Switzerland',
  'Antony from Denmark',
  'Rahul from Pune',
  

  // Foreign names
  'Emily from New York',
  'James from London',
  'Sofia from Toronto',
  'Liam from Sydney',
  'Olivia from Berlin',
  'Noah from Dubai',
  'Emma from Paris',
  'Daniel from Singapore'
];
  function startSocialProof() {
    const el = $('#kfRp'); if (!el) return;
    const prods = KF.getProducts();
    let i = 0;
    function show() {
      const p = prods[Math.floor(Math.random() * prods.length)];
      const who = PROOF_NAMES[i++ % PROOF_NAMES.length];
      const mins = Math.floor(Math.random() * 40) + 2;
      el.innerHTML = `<img src="${KF.thumbOf(p.img)}" alt="" loading="lazy" decoding="async"/><div><div class="rp-name">${who} just bought<br><b>${p.name}</b></div><div class="rp-meta">${mins} minutes ago · verified</div></div>`;
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), 4500);
    }
    setTimeout(show, 6000);
    setInterval(show, 18000);
  }

  /* ---------- mount ---------- */
  function mount() {
  if (!document.body.classList.contains('mkt')) return;
  const slot = $('#kfChrome') || (() => { const d = document.createElement('div'); document.body.insertBefore(d, document.body.firstChild); return d; })();
  slot.innerHTML = navHTML();

  $('#kfCartBtn') && $('#kfCartBtn').addEventListener('click', openCart);
  $('#kfCartBtnM') && $('#kfCartBtnM').addEventListener('click', e => { e.preventDefault(); openCart(); });
  $('#kfCartClose').addEventListener('click', closeCart);
  $('#kfCartOverlay').addEventListener('click', closeCart);
  $('#kfCheckout').addEventListener('click', () => { if (KF.cartCount() === 0) { toast('Your cart is empty', 'bad'); return; } location.href = 'checkout.html'; });
  $('#kfBurger') && $('#kfBurger').addEventListener('click', () => $('#kfMobile').classList.add('open'));
  $('#kfMobileClose').addEventListener('click', () => $('#kfMobile').classList.remove('open'));
  $('#kfChat') && $('#kfChat').addEventListener('click', () => toast('Our team replies within minutes — ping us on WhatsApp too!', 'ok'));

  // highlight active bottom-nav / category
  const path = location.pathname.split('/').pop();
  const navMap = { 'store.html': 'store', 'plp.html': 'shop', 'orders.html': 'orders' };
  const active = navMap[path];
  if (active) document.querySelectorAll(`.mkt-bottom a[data-nav="${active}"]`).forEach(a => a.classList.add('active'));

  bindSearch();
  bindDelegation();
  renderCart();
  refreshCounts();
  startSocialProof();

  /* ============================================================
     DATABASE SYNC — Auto-refresh products from Hostinger MySQL
  ============================================================ */
  
  // Initial fetch from database on page load
  KF.fetchProducts().then(() => {
    refreshCounts();
    // If we're on a page with product grids, re-render them
    const grids = document.querySelectorAll('.mk-grid, .mk-carousel');
    if (grids.length && typeof S !== 'undefined' && S.renderGrid) {
      // Re-render visible product grids with fresh DB data
      grids.forEach(grid => {
        // Only re-render if the grid was already populated
        if (grid.children.length > 0) {
          // Determine which products to show based on grid context
          const isFeatured = grid.id === 'featuredGrid';
          const isTrending = grid.id === 'trendingCarousel';
          const isNew = grid.id === 'newCarousel';
          const isBest = grid.id === 'bestCarousel';
          const isRecent = grid.id === 'recentCarousel';
          
          if (isFeatured) S.renderGrid(grid, KF.topRated(8));
          else if (isTrending) S.renderGrid(grid, KF.trending(10));
          else if (isNew) S.renderGrid(grid, KF.newArrivals(10));
          else if (isBest) S.renderGrid(grid, KF.bestSellers(10));
          else if (isRecent) {
            const recent = KF.recentProducts(null, 10);
            if (recent.length) S.renderGrid(grid, recent);
          }
        }
      });
    }
  }).catch(err => {
    console.warn('Initial product fetch failed, using cache:', err);
  });

  // Periodic refresh every 30 seconds to catch admin changes
  setInterval(() => {
    KF.fetchProducts().then(() => {
      refreshCounts();
      // Silently update product data without full re-render to avoid UI jank
      // The next page navigation or refresh will show updated products
    }).catch(err => {
      console.warn('Periodic product refresh failed:', err);
    });
  }, 30000);

  // Visibility API: refresh when user returns to tab
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      KF.fetchProducts().then(() => refreshCounts()).catch(() => {});
    }
  });
}

  /* ---------- shared page sections (trust / newsletter / footer) ---------- */
  const TRUST = [
    ['Free Shipping', 'On orders over ₹2000', 'box'],
    ['Secure Payments', 'UPI · Cards · COD', 'check'],
    ['Easy Returns', '7-day return & exchange', 'check'],
    ['COD Available', 'Pay when it arrives', 'check'],
    ['Fast Delivery', '3–6 days, pan-India', 'box'],
    ['Customer Support', 'Mon–Sat, real humans', 'chat'],
  ];
  function trustBand() {
    const cells = TRUST.map(([t, s, ic]) => `
      <div class="trust-cell"><div class="ic">${I[ic] || I.check}</div><div class="t">${t}</div><div class="s">${s}</div></div>`).join('');
    return `<div class="trust-band"><div class="wrapx"><div class="trust-grid">${cells}</div></div></div>`;
  }
  function newsletter() {
    return `
    <section class="nl-band"><div class="wrapx">
      <span class="eyebrow">Stay close</span>
      <h2>New pieces. Old craft.<br><em>Straight to your inbox.</em></h2>
      <p>Stories, new arrivals, and rare finds — no noise.</p>
      <form class="nl-form2" id="kfNlForm"><input type="email" placeholder="your@email.com" required/><button type="submit">Subscribe</button></form>
      <div class="nl-offer">Subscribe &amp; get 10% off your first order</div>
    </div></section>`;
  }
  function footer() {
    return `
    <footer class="mkt-footer"><div class="wrapx">
      <div class="mkt-footer-grid">
        <div>
          <a href="store.html" class="mkt-logo">
           <img src="images/kifran_logo.png" class="site-logo">
          </a>
          <p class="f-about">From our family's tools to your home — handcrafted pieces made to be lived with, treasured, and remembered.</p>
          <div class="f-pay"><span>UPI</span><span>Visa</span><span>Mastercard</span><span>RuPay</span><span>COD</span></div>
        </div>
        <div><h4>Help</h4><a href="orders.html">Track Order</a><a href="#">Shipping Policy</a><a href="#">Returns &amp; Exchange</a><a href="#">FAQs</a><a href="contact.html">Contact</a></div>
        <div><h4>Company</h4><a href="about.html">About Us</a><a href="index.html">Our Story</a><a href="contact.html">Customer Service</a><a href="mailto:hello@kifran.com">hello@kifran.com</a><a href="admin.html">Admin</a></div>
      </div>
      <div class="mkt-footer-bottom">
        <span>© 2025 KIFRAN. Handcrafted in India.</span>
        <div class="links"><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Sitemap</a></div>
      </div>
    </div></footer>`;
  }
  // newsletter submit (delegated, works for any injected form)
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('#kfNlForm, #nlForm');
    if (!f) return;
    e.preventDefault();
    f.reset();
    toast('You\'re on the list — 10% off is on its way', 'ok');
  });

  /* ---------- public API ---------- */
  window.KFShop = {
    card, renderGrid, stars, toast, refreshCounts,
    openCart, closeCart, renderCart, addToCart, toggleWish, quickView, I,
    trustBand, newsletter, footer,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
