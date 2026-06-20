/* ============================================================
   KIFRAN — Product Listing Page
============================================================ */
(function () {
  const KF = window.KF, S = window.KFShop;
  const qs = new URLSearchParams(location.search);

  const ALL = KF.getProducts();
  const PRICE_MIN = Math.min(...ALL.map(p => p.price));
  const PRICE_MAX = Math.max(...ALL.map(p => p.price));

  /* ---- initial state from URL ---- */
  const state = {
    cats: new Set(qs.get('cat') ? [qs.get('cat')] : []),
    brands: new Set(),
    materials: new Set(),
    colors: new Set(),
    sizes: new Set(),
    rating: 0,
    discount: 0,
    avail: new Set(),     // 'in' | 'out'
    delivery: new Set(),  // 'free' | 'express' | 'cod'
    q: qs.get('q') || '',
    wish: qs.get('wish') === '1',
    sale: qs.get('sale') === '1',
    pmin: PRICE_MIN,
    pmax: PRICE_MAX,
    sort: qs.get('sort') || 'popularity',
    page: 1,
  };
  const PER_PAGE = 9;

  const FACETS = {
    cats: KF.categories(),
    brands: KF.brands(),
    materials: KF.materials(),
    colors: KF.colorsAll(),
    sizes: [...new Set(ALL.flatMap(p => p.sizes || []))],
  };
  const COLOR_HEX = { Natural: '#c9a96e', Walnut: '#5b4636', Honey: '#d9a441', Ebony: '#2b2622', Chestnut: '#7a4434' };

  document.getElementById('plpSort').value = state.sort;

  /* ============================================================
     FILTER / SORT PIPELINE
  ============================================================ */
  function apply() {
    let list = ALL.slice();
    if (state.q) list = KF.search(state.q);
    if (state.wish) list = list.filter(p => KF.isWished(p.id));
    if (state.sale) list = list.filter(p => p.discount > 0);
    if (state.cats.size) list = list.filter(p => state.cats.has(p.cat));
    if (state.brands.size) list = list.filter(p => state.brands.has(p.brand));
    if (state.materials.size) list = list.filter(p => state.materials.has(p.material));
    if (state.colors.size) list = list.filter(p => (p.colors || []).some(c => state.colors.has(c)));
    if (state.sizes.size) list = list.filter(p => (p.sizes || []).some(s => state.sizes.has(s)));
    if (state.rating) list = list.filter(p => p.rating >= state.rating);
    if (state.discount) list = list.filter(p => p.discount >= state.discount);
    if (state.avail.size) {
      list = list.filter(p => (state.avail.has('in') && p.stock > 0) || (state.avail.has('out') && p.stock <= 0));
    }
    if (state.delivery.has('free')) list = list.filter(p => p.price >= 2000);
    list = list.filter(p => p.price >= state.pmin && p.price <= state.pmax);

    switch (state.sort) {
      case 'price-low': list.sort((a, b) => a.price - b.price); break;
      case 'price-high': list.sort((a, b) => b.price - a.price); break;
      case 'rating': list.sort((a, b) => b.rating - a.rating); break;
      case 'bestselling': list.sort((a, b) => b.reviews - a.reviews); break;
      case 'discount': list.sort((a, b) => b.discount - a.discount); break;
      case 'newest': list.sort((a, b) => (b.badge === 'New') - (a.badge === 'New')); break;
      default: list.sort((a, b) => (b.reviews * b.rating) - (a.reviews * a.rating));
    }
    return list;
  }

  function render() {
    const list = apply();
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / PER_PAGE));
    if (state.page > pages) state.page = pages;
    const slice = list.slice(0, state.page * PER_PAGE);

    document.getElementById('plpCount').innerHTML = `<b>${total}</b> piece${total === 1 ? '' : 's'} found`;
    const grid = document.getElementById('plpGrid');
    if (!total) {
      grid.innerHTML = `<div class="no-results" style="grid-column:1/-1"><h3>Nothing matches — yet</h3><p>Try loosening a filter or clearing them all.</p></div>`;
    } else {
      grid.innerHTML = slice.map(S.card).join('');
    }
    renderPills();
    renderPager(total, slice.length);
    S.refreshCounts();
  }

  /* ---- load-more pager ---- */
  function renderPager(total, shown) {
    const el = document.getElementById('plpPager');
    if (shown >= total) { el.innerHTML = ''; return; }
    el.innerHTML = `<div class="load-more-row"><button class="load-more" id="loadMore">Show more (${total - shown} left)</button></div>`;
    document.getElementById('loadMore').addEventListener('click', () => { state.page++; render(); });
  }

  /* ============================================================
     SIDEBAR
  ============================================================ */
  function fcount(predicate) { return ALL.filter(predicate).length; }

  function checkboxes(items, set, counter) {
    return items.map(v => `
      <label class="fcheck">
        <input type="checkbox" value="${v}" ${set.has(v) ? 'checked' : ''}/>
        <span>${v}</span><span class="ct">${counter(v)}</span>
      </label>`).join('');
  }

  function buildFilters() {
    const f = document.getElementById('plpFilters');
    f.innerHTML = `
      <div class="filters-head">
        <h3>Filters</h3>
        <button id="clearFilters">Clear all</button>
      </div>

      <div class="fgroup">
        <h4>Price</h4>
        <div class="range-wrap">
          <div class="range-track"></div>
          <div class="range-fill" id="rangeFill"></div>
          <input type="range" id="rMin" min="${PRICE_MIN}" max="${PRICE_MAX}" value="${state.pmin}" step="20"/>
          <input type="range" id="rMax" min="${PRICE_MIN}" max="${PRICE_MAX}" value="${state.pmax}" step="20"/>
        </div>
        <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:12px;color:var(--ink-soft)">
          <span id="rMinLbl">${KF.money(state.pmin)}</span><span id="rMaxLbl">${KF.money(state.pmax)}</span>
        </div>
      </div>

      <div class="fgroup" data-grp="cats"><h4>Category</h4>${checkboxes(FACETS.cats, state.cats, v => fcount(p => p.cat === v))}</div>

      <div class="fgroup" data-grp="brands">
        <h4>Brand</h4>
        <input class="brand-search" id="brandSearch" placeholder="Search brand…"/>
        <div id="brandList">${checkboxes(FACETS.brands, state.brands, v => fcount(p => p.brand === v))}</div>
      </div>

      <div class="fgroup" data-grp="rating">
        <h4>Customer Rating</h4>
        ${[4, 3, 2].map(r => `
          <label class="fcheck"><input type="radio" name="frating" value="${r}" ${state.rating === r ? 'checked' : ''}/><span>${r}★ &amp; above</span></label>`).join('')}
      </div>

      <div class="fgroup" data-grp="discount">
        <h4>Discount</h4>
        ${[10, 20, 30, 50].map(d => `
          <label class="fcheck"><input type="radio" name="fdisc" value="${d}" ${state.discount === d ? 'checked' : ''}/><span>${d}% &amp; more</span></label>`).join('')}
      </div>

      <div class="fgroup" data-grp="avail">
        <h4>Availability</h4>
        <label class="fcheck"><input type="checkbox" data-av="in" ${state.avail.has('in') ? 'checked' : ''}/><span>In Stock</span></label>
        <label class="fcheck"><input type="checkbox" data-av="out" ${state.avail.has('out') ? 'checked' : ''}/><span>Out of Stock</span></label>
      </div>

      <div class="fgroup" data-grp="delivery">
        <h4>Delivery</h4>
        <label class="fcheck"><input type="checkbox" data-dl="free" ${state.delivery.has('free') ? 'checked' : ''}/><span>Free Delivery</span></label>
        <label class="fcheck"><input type="checkbox" data-dl="express" ${state.delivery.has('express') ? 'checked' : ''}/><span>Express Delivery</span></label>
        <label class="fcheck"><input type="checkbox" data-dl="cod" ${state.delivery.has('cod') ? 'checked' : ''}/><span>Cash on Delivery</span></label>
      </div>

      <div class="fgroup" data-grp="colors">
        <h4>Colour</h4>
        <div class="swatches">
          ${FACETS.colors.map(c => `<span class="swatch ${state.colors.has(c) ? 'on' : ''}" data-color="${c}" title="${c}" style="background:${COLOR_HEX[c] || '#b79b6e'}"></span>`).join('')}
        </div>
      </div>

      <div class="fgroup" data-grp="sizes">
        <h4>Size</h4>
        <div class="chips">
          ${FACETS.sizes.map(s => `<button class="chip ${state.sizes.has(s) ? 'on' : ''}" data-size="${s}">${s}</button>`).join('')}
        </div>
      </div>

      <div class="fgroup" data-grp="material"><h4>Material</h4>${checkboxes(FACETS.materials, state.materials, v => fcount(p => p.material === v))}</div>
    `;

    bindFilterEvents();
    updateRangeFill();
  }

  function bindFilterEvents() {
    const f = document.getElementById('plpFilters');

    // category / material checkboxes
    f.querySelectorAll('[data-grp="cats"] input').forEach(cb => cb.addEventListener('change', () => toggleSet(state.cats, cb.value, cb.checked)));
    f.querySelectorAll('[data-grp="material"] input').forEach(cb => cb.addEventListener('change', () => toggleSet(state.materials, cb.value, cb.checked)));

    // brand checkboxes (delegated, since list re-renders on search)
    f.querySelector('#brandList').addEventListener('change', (e) => {
      if (e.target.matches('input')) toggleSet(state.brands, e.target.value, e.target.checked);
    });
    f.querySelector('#brandSearch').addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const shown = FACETS.brands.filter(b => b.toLowerCase().includes(term));
      f.querySelector('#brandList').innerHTML = checkboxes(shown, state.brands, v => fcount(p => p.brand === v));
    });

    // rating / discount radios
    f.querySelectorAll('[name="frating"]').forEach(r => r.addEventListener('change', () => { state.rating = +r.value; state.page = 1; render(); }));
    f.querySelectorAll('[name="fdisc"]').forEach(r => r.addEventListener('change', () => { state.discount = +r.value; state.page = 1; render(); }));

    // availability / delivery
    f.querySelectorAll('[data-av]').forEach(cb => cb.addEventListener('change', () => toggleSet(state.avail, cb.dataset.av, cb.checked)));
    f.querySelectorAll('[data-dl]').forEach(cb => cb.addEventListener('change', () => toggleSet(state.delivery, cb.dataset.dl, cb.checked)));

    // colour swatches
    f.querySelectorAll('[data-grp="colors"] .swatch').forEach(s => s.addEventListener('click', () => {
      const on = !state.colors.has(s.dataset.color);
      s.classList.toggle('on', on); toggleSet(state.colors, s.dataset.color, on);
    }));
    // size chips
    f.querySelectorAll('[data-grp="sizes"] .chip').forEach(c => c.addEventListener('click', () => {
      const on = !state.sizes.has(c.dataset.size);
      c.classList.toggle('on', on); toggleSet(state.sizes, c.dataset.size, on);
    }));

    // price range
    const rMin = f.querySelector('#rMin'), rMax = f.querySelector('#rMax');
    function onRange() {
      let lo = +rMin.value, hi = +rMax.value;
      if (lo > hi) { [lo, hi] = [hi, lo]; }
      state.pmin = lo; state.pmax = hi;
      f.querySelector('#rMinLbl').textContent = KF.money(lo);
      f.querySelector('#rMaxLbl').textContent = KF.money(hi);
      updateRangeFill();
      state.page = 1; render();
    }
    rMin.addEventListener('input', onRange);
    rMax.addEventListener('input', onRange);

    f.querySelector('#clearFilters').addEventListener('click', clearAll);
  }

  function updateRangeFill() {
    const fill = document.getElementById('rangeFill');
    if (!fill) return;
    const span = PRICE_MAX - PRICE_MIN;
    const l = ((state.pmin - PRICE_MIN) / span) * 100;
    const r = ((state.pmax - PRICE_MIN) / span) * 100;
    fill.style.left = l + '%';
    fill.style.width = (r - l) + '%';
  }

  function toggleSet(set, val, on) {
    if (on) set.add(val); else set.delete(val);
    state.page = 1; render();
  }

  function clearAll() {
    state.cats.clear(); state.brands.clear(); state.materials.clear();
    state.colors.clear(); state.sizes.clear(); state.avail.clear(); state.delivery.clear();
    state.rating = 0; state.discount = 0; state.q = ''; state.wish = false; state.sale = false;
    state.pmin = PRICE_MIN; state.pmax = PRICE_MAX; state.page = 1;
    buildFilters(); render();
  }

  /* ---- active filter pills ---- */
  function renderPills() {
    const pills = [];
    const add = (label, fn) => pills.push({ label, fn });
    state.cats.forEach(c => add(c, () => state.cats.delete(c)));
    state.brands.forEach(b => add(b, () => state.brands.delete(b)));
    state.materials.forEach(m => add(m, () => state.materials.delete(m)));
    state.colors.forEach(c => add(c, () => state.colors.delete(c)));
    state.sizes.forEach(s => add('Size ' + s, () => state.sizes.delete(s)));
    if (state.rating) add(state.rating + '★ & above', () => state.rating = 0);
    if (state.discount) add(state.discount + '% off+', () => state.discount = 0);
    state.avail.forEach(a => add(a === 'in' ? 'In stock' : 'Out of stock', () => state.avail.delete(a)));
    state.delivery.forEach(d => add({ free: 'Free delivery', express: 'Express', cod: 'COD' }[d], () => state.delivery.delete(d)));
    if (state.q) add('“' + state.q + '”', () => state.q = '');
    if (state.wish) add('Wishlist', () => state.wish = false);
    if (state.sale) add('On sale', () => state.sale = false);
    if (state.pmin > PRICE_MIN || state.pmax < PRICE_MAX) add(`${KF.money(state.pmin)}–${KF.money(state.pmax)}`, () => { state.pmin = PRICE_MIN; state.pmax = PRICE_MAX; });

    const box = document.getElementById('plpPills');
    if (!pills.length) { box.innerHTML = ''; return; }
    box.innerHTML = pills.map((p, i) => `<span class="apill">${p.label}<button data-pill="${i}">×</button></span>`).join('')
      + `<button class="apill" style="cursor:pointer" id="pillClear">Clear all</button>`;
    box.querySelectorAll('[data-pill]').forEach(b => b.addEventListener('click', () => {
      pills[+b.dataset.pill].fn(); state.page = 1; buildFilters(); render();
    }));
    box.querySelector('#pillClear').addEventListener('click', clearAll);
  }

  /* ============================================================
     BANNER / BREADCRUMB / RECS
  ============================================================ */
  function heading() {
    if (state.q) return { eyebrow: 'Search', title: `“${state.q}”`, desc: 'Pieces matching your search across the KIFRAN catalogue.' };
    if (state.wish) return { eyebrow: 'Saved', title: 'Your Wishlist', desc: 'The pieces you’ve set aside to come back to.' };
    if (state.sale) return { eyebrow: 'Limited time', title: 'On Sale', desc: 'Reduced for a short while — handcrafted pieces at a kinder price.' };
    if (state.cats.size === 1) {
      const c = [...state.cats][0];
      return { eyebrow: 'Collection', title: c, desc: catBlurb(c) };
    }
    return { eyebrow: 'The full catalogue', title: 'Shop All', desc: 'Every KIFRAN piece — shaped by hand, made to be used.' };
  }
  function catBlurb(c) {
    const m = {
      'Canes': 'Walking canes balanced for the hand and built to lean on for years.',
      'Yarn Tools': 'Crochet hooks and yarn tools turned smooth for hours of easy work.',
      'Wellbeing': 'Quiet, tactile crafts for slower, more grounded days.',
      'Home Décor': 'Warm wooden pieces that make a room feel lived-in.',
      'Kitchen & Dining': 'Food-safe boards, bowls and servers for the heart of the home.',
      'Gifts': 'Considered, engravable pieces made to be remembered.',
    };
    return m[c] || 'Handcrafted wood, made to be used.';
  }

  function buildBanner() {
    const h = heading();
    document.getElementById('plpCrumb').innerHTML =
      `<a href="store.html">Home</a> <span>›</span> ${state.cats.size === 1 ? `<a href="plp.html">Shop</a> <span>›</span> <span>${[...state.cats][0]}</span>` : '<span>Shop</span>'}`;
    document.getElementById('plpBanner').innerHTML = `
      <img src="images/opt/stick1-lg.jpg" alt="" loading="lazy" decoding="async"/>
      <div class="veil"></div>
      <div class="plp-banner-body">
        <span class="eyebrow">${h.eyebrow}</span>
        <h1>${h.title}</h1>
        <p>${h.desc}</p>
        <span class="offer-chip">WELCOME5 · 5% off your first order</span>
      </div>`;
    document.title = `${h.title} — KIFRAN`;
  }

  function buildRecs() {
    const recent = KF.recentProducts(null, 8);
    function rail(title, eyebrow, list) {
      if (!list.length) return '';
      return `
        <section class="mk-section" style="padding:40px 0">
          <div class="mk-head"><div><span class="eyebrow">${eyebrow}</span><h2>${title}</h2></div></div>
          <div class="mk-carousel">${list.map(S.card).join('')}</div>
        </section>`;
    }
    document.getElementById('plpRecs').innerHTML = `
      <div class="mkt-wrap" style="padding-top:0">
        ${rail('Trending now', 'Popular this week', KF.trending(10))}
        ${rail('Best sellers', 'Most loved', KF.bestSellers(10))}
        ${rail('New arrivals', 'Fresh off the bench', KF.newArrivals(10))}
        ${recent.length ? rail('Recently viewed', 'Pick up where you left', recent) : ''}
      </div>
      ${S.trustBand()}${S.newsletter()}${S.footer()}`;
  }

  /* ============================================================
     MOBILE DRAWER + SORT
  ============================================================ */
  function bindChrome() {
    const filters = document.getElementById('plpFilters');
    const backdrop = document.getElementById('filterBackdrop');
    const toggle = document.getElementById('filterToggle');
    const open = () => { filters.classList.add('open'); backdrop.classList.add('open'); };
    const close = () => { filters.classList.remove('open'); backdrop.classList.remove('open'); };
    toggle.addEventListener('click', open);
    backdrop.addEventListener('click', close);

    document.getElementById('plpSort').addEventListener('change', (e) => { state.sort = e.target.value; state.page = 1; render(); });
  }

  /* ---- go ---- */
  buildBanner();
  buildFilters();
  bindChrome();
  render();
  buildRecs();
})();
