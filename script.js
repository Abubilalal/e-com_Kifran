// =============================================
//  KIFRAN — script.js
//  Made to be used.
// =============================================

/* ── CUSTOM CURSOR ── */
const cursor   = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');
let mx = 0, my = 0, fx = 0, fy = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
});

// Smooth follower
(function tick() {
  fx += (mx - fx) * 0.1;
  fy += (my - fy) * 0.1;
  follower.style.left = fx + 'px';
  follower.style.top  = fy + 'px';
  requestAnimationFrame(tick);
})();

// Hover state on interactive elements
document.querySelectorAll('a, button, .cat-tile, .p-card').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});


/* ── NAVBAR SCROLL ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });


/* ── MOBILE MENU ── */
const hamburger     = document.getElementById('hamburger');
const mobileOverlay = document.getElementById('mobileOverlay');
const mobileClose   = document.getElementById('mobileClose');

function openMenu()  { mobileOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeMenu() { mobileOverlay.classList.remove('open'); document.body.style.overflow = ''; }

hamburger.addEventListener('click', openMenu);
mobileClose.addEventListener('click', closeMenu);
mobileOverlay.querySelectorAll('.mobile-link').forEach(l => l.addEventListener('click', closeMenu));


/* ── HERO SLIDER ── */
const hSlides = document.querySelectorAll('.hslide');
const hDots   = document.querySelectorAll('.hdot');
const hPrev   = document.getElementById('hPrev');
const hNext   = document.getElementById('hNext');
let hCurrent  = 0;
let hTimer;

function hGoTo(i) {
  hSlides[hCurrent].classList.remove('active');
  hDots[hCurrent].classList.remove('active');
  hCurrent = (i + hSlides.length) % hSlides.length;
  hSlides[hCurrent].classList.add('active');
  hDots[hCurrent].classList.add('active');
}

function hNext_() { hGoTo(hCurrent + 1); }
function hPrev_() { hGoTo(hCurrent - 1); }

function hStartAuto() { hTimer = setInterval(hNext_, 6000); }
function hResetAuto() { clearInterval(hTimer); hStartAuto(); }

hNext.addEventListener('click', () => { hNext_(); hResetAuto(); });
hPrev.addEventListener('click', () => { hPrev_(); hResetAuto(); });
hDots.forEach((d, i) => d.addEventListener('click', () => { hGoTo(i); hResetAuto(); }));

// Touch swipe
let tStartX = 0;
document.getElementById('heroSlider').addEventListener('touchstart', e => { tStartX = e.touches[0].clientX; }, { passive: true });
document.getElementById('heroSlider').addEventListener('touchend', e => {
  const diff = tStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) { diff > 0 ? hNext_() : hPrev_(); hResetAuto(); }
}, { passive: true });

hStartAuto();


/* ============================================================
   PRODUCT GRID — rendered from KF catalog (admin-managed)
============================================================ */
const productGrid = document.getElementById('productGrid');

function priceHTML(p) {
  return p.mrp && p.mrp > p.price
    ? `${KF.money(p.price)} <s>${KF.money(p.mrp)}</s>`
    : `${KF.money(p.price)}`;
}

function badgeHTML(p) {
  if (!p.badge) return '';
  const cls = p.badge.toLowerCase() === 'new' ? 'p-badge new' : 'p-badge';
  return `<span class="${cls}">${p.badge}</span>`;
}

function renderProducts() {
  if (!productGrid) return;
  const products = KF.getProducts();
  productGrid.innerHTML = products.map(p => `
    <div class="p-card" data-cat="${p.cat}" data-id="${p.id}">
      <div class="p-card-media">
        <img src="${KF.thumbOf(p.img)}" alt="${p.name}" class="p-card-img" loading="lazy" decoding="async"/>
        <div class="p-card-actions">
          <button class="p-wish" aria-label="Save"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
          <button class="p-quick" aria-label="Quick view">Quick view</button>
        </div>
        ${badgeHTML(p)}
        ${p.stock <= 0 ? '<span class="p-badge soldout">Sold out</span>' : ''}
      </div>
      <div class="p-card-info">
        <span class="p-material mono">${p.material}</span>
        <h3 class="p-name">${p.name}</h3>
        <div class="p-foot">
          <div class="p-price">${priceHTML(p)}</div>
          <button class="p-add" data-id="${p.id}" ${p.stock <= 0 ? 'disabled' : ''}>${p.stock <= 0 ? 'Sold out' : 'Add to cart'}</button>
        </div>
      </div>
    </div>
  `).join('');
  bindProductEvents();
  staggerReveal();
}

/* ── FILTERS ── */
function bindFilters() {
  const filters = document.querySelectorAll('.filter');
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      document.querySelectorAll('.p-card').forEach(card => {
        const match = cat === 'all' || card.dataset.cat === cat;
        card.style.display = match ? '' : 'none';
      });
    });
  });
}

/* ============================================================
   CART SYSTEM (persisted via KF / localStorage)
============================================================ */
const cartToggle  = document.getElementById('cartToggle');
const cartClose   = document.getElementById('cartClose');
const cartDrawer  = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const cartBody    = document.getElementById('cartBody');
const cartDot     = document.getElementById('cartDot');

function openCart()  { cartDrawer.classList.add('open'); cartOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeCart() { cartDrawer.classList.remove('open'); cartOverlay.classList.remove('open'); document.body.style.overflow = ''; }

if (cartToggle)  cartToggle.addEventListener('click', openCart);
if (cartClose)   cartClose.addEventListener('click', closeCart);
if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

function renderCart() {
  const items = KF.cartDetailed();
  if (items.length === 0) {
    cartBody.innerHTML = '<p class="cart-empty">Your cart is empty.<br><a href="#shop">Browse the collection →</a></p>';
  } else {
    cartBody.innerHTML = items.map(it => `
      <div class="cart-item">
        <img src="${KF.thumbOf(it.img)}" alt="${it.name}" loading="lazy" decoding="async"/>
        <div class="cart-item-mid">
          <div class="cart-item-name">${it.name}</div>
          <div class="cart-item-price">${KF.money(it.price)}</div>
          <div class="cart-qty">
            <button onclick="cartDec('${it.id}')">−</button>
            <span>${it.qty}</span>
            <button onclick="cartInc('${it.id}')">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="cartRemove('${it.id}')">✕</button>
      </div>
    `).join('');
  }
  if (cartDot) cartDot.classList.toggle('visible', KF.cartCount() > 0);
}

window.cartInc    = function (id) { KF.addToCart(id, 1); renderCart(); };
window.cartDec    = function (id) { const r = KF.getCart().find(i => i.id === id); KF.setQty(id, (r ? r.qty : 1) - 1); renderCart(); };
window.cartRemove = function (id) { KF.removeFromCart(id); renderCart(); };

function bindProductEvents() {
  document.querySelectorAll('.p-add').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      KF.addToCart(btn.dataset.id, 1);
      renderCart();
      const orig = btn.textContent;
      btn.textContent = 'Added ✓';
      btn.classList.add('added');
      setTimeout(() => { btn.textContent = orig; btn.classList.remove('added'); }, 1600);
      setTimeout(openCart, 280);
    });
  });
  document.querySelectorAll('.p-wish').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('loved'));
  });
}

/* ── CHECKOUT button → payment page ── */
const checkoutBtn = document.getElementById('checkoutBtn');
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    if (KF.cartCount() === 0) { checkoutBtn.textContent = 'Cart is empty'; setTimeout(() => checkoutBtn.textContent = 'Checkout →', 1500); return; }
    window.location.href = 'checkout.html';
  });
}

/* ── reveal helper for dynamically added cards ── */
function staggerReveal() {
  const cards = document.querySelectorAll('.p-card');
  cards.forEach((c, i) => { c.classList.add('reveal'); c.style.transitionDelay = `${i * 60}ms`; });
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  cards.forEach(c => obs.observe(c));
}

/* ── INIT ── */
renderProducts();
bindFilters();
renderCart();

/* ── NEWSLETTER ── */
window.handleNL = function (e) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  const button = e.target.querySelector('button');
  const orig = button.textContent;
  button.textContent = 'Subscribed ✓';
  button.style.background = '#1a3320';
  button.style.color = '#7dba8a';
  input.value = '';
  input.placeholder = 'Thank you!';
  setTimeout(() => {
    button.textContent = orig;
    button.style.background = '';
    button.style.color = '';
    input.placeholder = 'your@email.com';
  }, 4000);
};

/* ── GENERAL SCROLL REVEAL (non-product sections) ── */
(function () {
  const els = document.querySelectorAll('.cat-tile, .review-card, .about-val, .stat-card, .manifesto-quote, .pull-quote');
  els.forEach(el => el.classList.add('reveal'));
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
  document.querySelectorAll('.cat-tile').forEach((t, i) => t.style.transitionDelay = `${i * 80}ms`);
})();
