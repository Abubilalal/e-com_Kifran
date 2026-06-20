/* ============================================================
   KIFRAN — Product Details Page
============================================================ */
(function () {
  function errorBox(msg) {
    return '<div class="pd-loading" style="flex-direction:column;gap:14px">' + msg +
      ' <a href="store.html" style="color:var(--gold-dim);text-decoration:underline">Return to the store →</a></div>';
  }

  function boot() {
    const KF = window.KF, S = window.KFShop;
    const root = document.getElementById('pdRoot');
    if (!root) return;
    // Wait for the data layer + shared chrome. Guards against scripts that
    // load slowly, out of order, or from a stale cache — instead of hanging
    // forever on "Loading piece…", we retry briefly then show a clear message.
    if (!KF || !S || typeof KF.getProduct !== 'function' || typeof S.card !== 'function') {
      boot._t = (boot._t || 0) + 1;
      if (boot._t < 120) return setTimeout(boot, 25);   // retry up to ~3s
      root.innerHTML = errorBox('We couldn’t load the store data. Please hard-refresh the page (Ctrl/Cmd + Shift + R).');
      return;
    }

    try {
    const qs = new URLSearchParams(location.search);
    const id = qs.get('id') || 'p1';
    const p = KF.getProduct(id);

    if (!p) {
      root.innerHTML = errorBox('This piece could not be found.');
      return;
    }

    KF.pushRecent(id);

  /* ---- selection state ---- */
  const state = {
    color: p.colors[0] || 'Natural',
    size: p.sizes[0] || null,
    material: p.material,
    qty: 1,
  };

  const stockClass = p.stock <= 0 ? 'out' : (p.stock <= 5 ? 'low' : 'in');
  const stockText = p.stock <= 0 ? 'Out of stock'
    : (p.stock <= 5 ? `Only ${p.stock} left — almost gone` : 'In stock · ready to ship');

  /* ---- gallery ---- */
  const gallery = (p.images && p.images.length ? p.images : (p.gallery && p.gallery.length ? p.gallery : [p.img]));
  const vid = KF.videoInfo(p.video);
  const lqip0 = KF.lqipOf(gallery[0]);
  const galleryHTML = `
    <div class="pd-gallery">
      <div class="pd-thumbs" id="pdThumbs">
        ${gallery.map((g, i) => `<div class="pd-thumb ${i === 0 ? 'on' : ''}" data-i="${i}"><img src="${KF.thumbOf(g)}" alt="view ${i + 1}" loading="lazy" decoding="async"/></div>`).join('')}
        ${vid ? `<div class="pd-thumb pd-thumb-video" data-video="1" title="Play product video">
          <img src="${KF.thumbOf(gallery[0])}" alt="Product video" loading="lazy" decoding="async"/>
          <span class="pd-thumb-play">▶</span>
        </div>` : ''}
      </div>
      <div class="pd-main" id="pdMain" style="background-image:url(${lqip0})">
        <img id="pdMainImg" class="kf-img" src="${gallery[0]}" alt="${p.name}" decoding="async" fetchpriority="high" onload="this.classList.add('ok')"/>
        <div class="pd-video-stage" id="pdVideoStage" aria-hidden="true"></div>
        <div class="pd-gallery-badges">
          ${p.badge ? `<span class="mc-badge ${p.badge === 'New' ? 'new' : (p.badge === 'Hot Deal' ? 'deal' : '')}">${p.badge}</span>` : ''}
          ${(p.showDiscount && p.discount) ? `<span class="mc-badge disc">${p.discount}% OFF</span>` : ''}
        </div>
        <div class="pd-zoom-hint">${S.I.search} Hover to zoom</div>
      </div>
    </div>`;

  /* ---- variations ---- */
  const colorRow = p.colors.length ? `
    <div class="pd-var">
      <label>Colour <span class="picked" id="pickColor">${state.color}</span></label>
      <div class="swatches" id="pdColors">
        ${p.colors.map((c, i) => `<span class="swatch ${i === 0 ? 'on' : ''}" data-color="${c}" title="${c}" style="background:${swatchHex(c)}"></span>`).join('')}
      </div>
    </div>` : '';
  const sizeRow = p.sizes.length ? `
    <div class="pd-var">
      <label>Size <span class="picked" id="pickSize">${state.size}</span></label>
      <div class="chips" id="pdSizes">
        ${p.sizes.map((s, i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-size="${s}">${s}</button>`).join('')}
      </div>
    </div>` : '';
  const materialRow = `
    <div class="pd-var">
      <label>Material <span class="picked">${p.material}</span></label>
      <div class="chips"><button class="chip on" disabled>${p.material}</button></div>
    </div>`;
  const qtyRow = `
    <div class="pd-var">
      <label>Quantity</label>
      <div class="qty-stepper">
        <button data-q="-1" aria-label="decrease">−</button>
        <span id="pdQty">1</span>
        <button data-q="1" aria-label="increase">+</button>
      </div>
    </div>`;

  /* ---- info column ---- */
  const infoHTML = `
    <div class="pd-info">
      <nav class="breadcrumb">
        <a href="store.html">Home</a> <span>›</span>
        <a href="plp.html?cat=${encodeURIComponent(p.cat)}">${p.cat}</a> <span>›</span>
        <span>${p.name}</span>
      </nav>
      <span class="pd-brand">${p.brand}</span>
      <h1 class="pd-title">${p.name}</h1>
      <div class="pd-raterow">
        <span class="pd-rate-badge"><span class="star">★</span> ${p.rating}</span>
        <span class="pd-revcount"><a href="#reviews">${p.reviews} verified reviews</a></span>
      </div>
      <div class="pd-pricebox">
        <span class="pd-now">${KF.money(p.price)}</span>
        ${(p.showDiscount && p.mrp > p.price) ? `<span class="pd-mrp">${KF.money(p.mrp)}</span><span class="pd-off">${p.discount}% off</span>` : ''}
        <span class="pd-tax">Inclusive of all taxes</span>
      </div>
      <div style="padding:14px 0"><span class="pd-stock ${stockClass}">● ${stockText}</span> &nbsp;·&nbsp; <span class="pd-sku">SKU ${p.sku}</span></div>

      <div class="pd-variations">
        ${colorRow}${sizeRow}${materialRow}${qtyRow}
      </div>

      <!-- personalization -->
      <div class="pd-personal">
        <h4>Make it yours</h4>
        <p class="sub">Hand-engraved personalisation, added before it leaves the workshop.</p>
        <div class="field">
          <label>Custom engraving text</label>
          <input type="text" id="pdText" maxlength="40" placeholder="e.g. To Grandpa, with love"/>
          <div class="char-count"><span id="pdTextCount">0</span>/40</div>
        </div>
        <div class="field">
          <label>Reference image (optional)</label>
          <input type="file" id="pdImg" accept="image/*"/>
        </div>
        <div class="field" style="margin-bottom:0">
          <label>Gift message</label>
          <textarea id="pdGift" rows="2" maxlength="120" placeholder="A note to tuck inside the box"></textarea>
          <div class="char-count"><span id="pdGiftCount">0</span>/120</div>
        </div>
      </div>

      <!-- delivery -->
      <div class="pd-deliver">
        <label style="font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--sand-dim);display:block;margin-bottom:10px">Delivery</label>
        <div class="pin-row">
          <input type="text" id="pdPin" inputmode="numeric" maxlength="6" placeholder="Enter 6-digit pincode"/>
          <button id="pdPinBtn">Check</button>
        </div>
        <div class="pin-result" id="pinResult"></div>
      </div>

      <!-- actions -->
      <div class="pd-actions">
        <button class="pd-cart" id="pdAdd" ${p.stock <= 0 ? 'disabled' : ''}>${p.stock <= 0 ? 'Sold out' : 'Add to cart'}</button>
        <button class="pd-buy" id="pdBuy" ${p.stock <= 0 ? 'disabled' : ''}>Buy now</button>
        <button class="pd-icon-btn ${KF.isWished(p.id) ? 'on' : ''}" id="pdWish" aria-label="Wishlist">${S.I.heart}</button>
        <button class="pd-icon-btn" id="pdShare" aria-label="Share">${shareIcon()}</button>
      </div>

      <div class="pd-trustrow">
        <span class="pd-trust">${S.I.check} 7-day returns</span>
        <span class="pd-trust">${S.I.box} ${p.price >= 2000 ? 'Free shipping' : 'Shipping ₹99'}</span>
        <span class="pd-trust">${S.I.check} COD available</span>
      </div>
    </div>`;

  /* ---- description / specs / policies / reviews / faq ---- */
  const featIc = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>';
  const descHTML = `
    <section class="pd-section" id="details">
      <h2>The story of this piece</h2>
      <div class="pd-desc-body">${p.descHtml || p.desc}</div>
      <div class="feat-grid">
        ${p.features.map(f => `<div class="feat"><div class="ic">${featIc}</div><span>${f}</span></div>`).join('')}
      </div>
    </section>
    <section class="pd-section">
      <h2>Specifications</h2>
      <table class="spec-table">
        ${Object.entries(p.specs).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}
        <tr><td>Dimensions</td><td>${dims(p)}</td></tr>
        <tr><td>Weight</td><td>${weight(p)}</td></tr>
      </table>
    </section>`;

  const POLICIES = [
    ['7-Day Returns', 'Changed your mind? Send it back within 7 days.', 'M3 12a9 9 0 1 0 3-6.7L3 8 M3 3v5h5'],
    ['7-Day Exchange', 'Swap size, colour or piece, hassle-free.', 'M16 3h5v5 M21 3l-7 7 M8 21H3v-5 M3 21l7-7'],
    ['Cash on Delivery', 'Pay in cash when your order arrives.', 'M2 6h20v12H2z M12 9a3 3 0 1 0 0 6'],
    ['Secure Payment', 'Encrypted UPI, cards & netbanking.', 'M3 11h18v10H3z M7 11V7a5 5 0 0 1 10 0v4'],
    ['24/7 Support', 'Real humans, Mon–Sat, on call & chat.', 'M21 11.5a8.4 8.4 0 0 1-12.8 7.5L3 21l1.9-5.7A8.4 8.4 0 1 1 21 11.5z'],
  ];
  const policyHTML = `
    <section class="pd-section">
      <h2>Our promises</h2>
      <div class="policy-grid">
        ${POLICIES.map(([t, d, path]) => `
          <div class="policy">
            <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="${path}"/></svg></div>
            <h4>${t}</h4><p>${d}</p>
          </div>`).join('')}
      </div>
    </section>`;

  const reviewsHTML = buildReviews(p);
  const faqHTML = buildFaq(p);

  /* ---- related sliders ---- */
  const related = KF.related(p.id, 10);
  const bought = KF.bestSellers(10).filter(x => x.id !== p.id).slice(0, 8);
  const recent = KF.recentProducts(p.id, 8);
  function rail(title, eyebrow, list, link) {
    if (!list || !list.length) return '';
    return `
      <section class="mk-section" style="padding:40px 0">
        <div class="mk-head"><div><span class="eyebrow">${eyebrow}</span><h2>${title}</h2></div>${link ? `<a class="mk-more" href="${link}">View all →</a>` : ''}</div>
        <div class="mk-carousel">${list.map(S.card).join('')}</div>
      </section>`;
  }
  const relatedHTML = `
    ${rail('You may also like', 'Similar pieces', related, 'plp.html?cat=' + encodeURIComponent(p.cat))}
    ${rail('Frequently bought together', 'Pairs well', bought)}
    ${rail('Recently viewed', 'Back to', recent)}`;

  /* ---- assemble ---- */
  root.innerHTML = `
    <div class="pd-grid">${galleryHTML}${infoHTML}</div>
    ${descHTML}
    ${policyHTML}
    ${reviewsHTML}
    ${faqHTML}
    ${relatedHTML}`;

  // sections after wrap
  root.insertAdjacentHTML('afterend', S.trustBand() + S.newsletter() + S.footer());

  /* ============================================================
     BEHAVIOUR
  ============================================================ */
  // gallery thumbs
  const mainImg = document.getElementById('pdMainImg');
  const pdMainEl = document.getElementById('pdMain');
  const videoStage = document.getElementById('pdVideoStage');
  function showVideo() {
    if (!vid) return;
    if (vid.type === 'embed') {
      videoStage.innerHTML = `<iframe src="${vid.url}&autoplay=1" title="Product video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else {
      videoStage.innerHTML = `<video src="${vid.url}" controls autoplay playsinline></video>`;
    }
    pdMainEl.classList.add('video-on');
  }
  function hideVideo() {
    pdMainEl.classList.remove('video-on');
    videoStage.innerHTML = '';
  }
  function swapMain(i) {
    hideVideo();
    const url = gallery[i];
    pdMainEl.style.backgroundImage = `url(${KF.lqipOf(url)})`;
    mainImg.classList.remove('ok');
    mainImg.src = url;
  }
  document.getElementById('pdThumbs').addEventListener('click', (e) => {
    const t = e.target.closest('.pd-thumb');
    if (!t) return;
    document.querySelectorAll('.pd-thumb').forEach(x => x.classList.remove('on'));
    t.classList.add('on');
    if (t.dataset.video) { showVideo(); return; }
    swapMain(+t.dataset.i);
  });

  // zoom on hover
  const pdMain = document.getElementById('pdMain');
  pdMain.addEventListener('mousemove', (e) => {
    const r = pdMain.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    mainImg.style.transformOrigin = `${x}% ${y}%`;
  });
  pdMain.addEventListener('mouseenter', () => {
    // lazily upgrade to high-res variant only when the user zooms
    const lg = KF.largeOf(mainImg.src);
    if (lg !== mainImg.src && mainImg.dataset.hi !== '1') {
      const pre = new Image();
      pre.onload = () => { mainImg.src = lg; mainImg.dataset.hi = '1'; };
      pre.src = lg;
    }
    pdMain.classList.add('zoom');
  });
  pdMain.addEventListener('mouseleave', () => pdMain.classList.remove('zoom'));

  // colour
  const pc = document.getElementById('pdColors');
  if (pc) pc.addEventListener('click', (e) => {
    const s = e.target.closest('.swatch'); if (!s) return;
    pc.querySelectorAll('.swatch').forEach(x => x.classList.remove('on'));
    s.classList.add('on'); state.color = s.dataset.color;
    document.getElementById('pickColor').textContent = state.color;
  });
  // size
  const psz = document.getElementById('pdSizes');
  if (psz) psz.addEventListener('click', (e) => {
    const c = e.target.closest('.chip'); if (!c) return;
    psz.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
    c.classList.add('on'); state.size = c.dataset.size;
    document.getElementById('pickSize').textContent = state.size;
  });
  // qty
  const qtyEl = document.getElementById('pdQty');
  document.querySelectorAll('.qty-stepper button').forEach(b => b.addEventListener('click', () => {
    const max = Math.max(1, p.stock || 99);
    state.qty = Math.min(max, Math.max(1, state.qty + (+b.dataset.q)));
    qtyEl.textContent = state.qty;
  }));

  // personalization counters
  bindCounter('pdText', 'pdTextCount');
  bindCounter('pdGift', 'pdGiftCount');

  // pincode
  document.getElementById('pdPinBtn').addEventListener('click', checkPin);
  document.getElementById('pdPin').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkPin(); });
  function checkPin() {
    const pin = document.getElementById('pdPin').value.trim();
    const box = document.getElementById('pinResult');
    if (!/^\d{6}$/.test(pin)) { box.className = 'pin-result show'; box.innerHTML = `<span style="color:var(--red)">Enter a valid 6-digit pincode.</span>`; return; }
    const d = new Date(); d.setDate(d.getDate() + 3 + (parseInt(pin.slice(-1), 10) % 4));
    const date = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    const express = parseInt(pin[0], 10) % 2 === 0;
    box.className = 'pin-result show';
    box.innerHTML = `
      <div class="row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 6L9 17l-5-5"/></svg> <span class="ok">Delivers to ${pin}</span></div>
      <div class="row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7z"/></svg> Estimated by <strong style="margin-left:4px">${date}</strong></div>
      <div class="row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg> ${express ? 'Express shipping available' : 'Standard shipping'} · ${p.price >= 2000 ? 'Free' : '₹99'}</div>`;
  }

  // build personalization payload to attach to cart line
  function personalization() {
    const txt = document.getElementById('pdText').value.trim();
    const gift = document.getElementById('pdGift').value.trim();
    const out = {};
    if (txt) out.engraving = txt;
    if (gift) out.gift = gift;
    if (state.color) out.color = state.color;
    if (state.size) out.size = state.size;
    return Object.keys(out).length ? out : null;
  }

  // add / buy
  document.getElementById('pdAdd').addEventListener('click', (e) => {
    KF.addToCart(p.id, state.qty, personalization());
    S.refreshCounts(); S.renderCart();
    const b = e.currentTarget; b.classList.add('added'); b.textContent = 'Added ✓';
    S.toast(`${p.name} added to cart`, 'ok'); S.openCart();
    setTimeout(() => { b.classList.remove('added'); b.textContent = 'Add to cart'; }, 1800);
  });
  document.getElementById('pdBuy').addEventListener('click', () => {
    KF.addToCart(p.id, state.qty, personalization());
    location.href = 'checkout.html';
  });
  document.getElementById('pdWish').addEventListener('click', (e) => {
    const on = KF.toggleWish(p.id);
    e.currentTarget.classList.toggle('on', on);
    S.refreshCounts();
    S.toast(on ? 'Saved to wishlist' : 'Removed from wishlist', 'ok');
  });
  document.getElementById('pdShare').addEventListener('click', async () => {
    const url = location.href;
    if (navigator.share) { try { await navigator.share({ title: p.name, url }); } catch (e) {} return; }
    try { await navigator.clipboard.writeText(url); S.toast('Link copied to clipboard', 'ok'); }
    catch (e) { S.toast(url, 'ok'); }
  });

  // FAQ accordion
  root.addEventListener('click', (e) => {
    const q = e.target.closest('.faq-q'); if (!q) return;
    q.parentElement.classList.toggle('open');
  });

  // review breakdown anchor scroll handled by browser via #reviews

  /* ---- sticky bar ---- */
  const sb = document.getElementById('stickyBar');
  document.getElementById('sbImg').src = KF.thumbOf(p.img);
  document.getElementById('sbName').textContent = p.name;
  document.getElementById('sbPrice').textContent = KF.money(p.price);
  document.getElementById('sbAdd').addEventListener('click', () => document.getElementById('pdAdd').click());
  document.getElementById('sbBuy').addEventListener('click', () => document.getElementById('pdBuy').click());
  const anchor = document.querySelector('.pd-actions');
  window.addEventListener('scroll', () => {
    const past = anchor.getBoundingClientRect().bottom < 0;
    sb.classList.toggle('show', past && p.stock > 0);
  });

  document.title = `${p.name} — KIFRAN`;

  /* ============================================================
     HELPERS
  ============================================================ */
  function bindCounter(inId, cId) {
    const el = document.getElementById(inId), c = document.getElementById(cId);
    el.addEventListener('input', () => { c.textContent = el.value.length; });
  }
  function swatchHex(name) {
    const map = {
      Natural: '#c9a96e', Walnut: '#5b4636', Oak: '#c8a877', Teak: '#9e7b4f',
      Rosewood: '#6e3b2e', Ebony: '#2b2622', Maple: '#e3cda0', Cherry: '#7a4434',
      Sand: '#d8c6a6', Ivory: '#efe7d6', Charcoal: '#3a352f', Honey: '#d9a441',
    };
    return map[name] || '#b79b6e';
  }
  function shareIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>';
  }
  function dims(p) {
    if (/cane|stick/i.test(p.name)) return '92 cm length · 2.4 cm grip';
    if (/hook|needle|yarn/i.test(p.cat)) return '15 cm length · 6 mm gauge';
    if (/bowl|board|tray/i.test(p.name)) return '24 × 24 × 6 cm';
    return '20 × 8 × 4 cm (approx.)';
  }
  function weight(p) {
    if (/cane|stick/i.test(p.name)) return '320 g';
    if (/hook|needle/i.test(p.name)) return '18 g';
    return '240 g (approx.)';
  }

  function buildReviews(p) {
    // deterministic breakdown that sums to reviews count
    const r = p.rating;
    const dist = r >= 4.7 ? [78, 16, 4, 1, 1] : r >= 4.4 ? [64, 24, 8, 2, 2] : [52, 28, 12, 5, 3];
    const rows = [5, 4, 3, 2, 1].map((stars, i) => {
      const pct = dist[i];
      return `<div class="rev-bar-row"><span class="lbl">${stars}★</span><div class="rev-bar-track"><div class="rev-bar-fill" style="width:${pct}%"></div></div><span class="pct">${pct}%</span></div>`;
    }).join('');

    const NAMES = ['Ananya R.', 'Vikram S.', 'Meera Joshi', 'Rohan T.', 'Priya N.', 'Imran K.'];
    const TEXT = [
      'The grain is even more beautiful in person. You can feel the hours of hand-finishing — it has real weight and warmth.',
      'Gifted this to my father and he was genuinely moved. The engraving was crisp and the packaging felt like a keepsake.',
      'Exactly as described. Balanced, sturdy, and the oil finish smells faintly of the workshop. Worth every rupee.',
      'Took a few extra days but the quality explains why. This is slow craft done right — nothing mass-produced about it.',
    ];
    const cards = NAMES.slice(0, 4).map((nm, i) => `
      <div class="rev-card">
        <div class="rev-card-head">
          <div class="rev-avatar">${nm[0]}</div>
          <div>
            <div class="nm">${nm}</div>
            <span class="rev-verified">✓ Verified Purchase</span>
          </div>
        </div>
        <div class="stars">${'★'.repeat(5 - (i % 2))}${'☆'.repeat(i % 2)}</div>
        <p>${TEXT[i]}</p>
        ${i === 0 ? `<div class="rev-imgs"><img src="${gallery[0]}" alt=""/><img src="${gallery[Math.min(1, gallery.length - 1)]}" alt=""/></div>` : ''}
      </div>`).join('');

    return `
      <section class="pd-section" id="reviews">
        <h2>Ratings & reviews</h2>
        <div class="rev-summary">
          <div class="rev-score">
            <div class="big">${p.rating}</div>
            <div class="stars">${S.stars(p.rating)}</div>
            <div class="total">${p.reviews} ratings</div>
          </div>
          <div class="rev-bars">${rows}</div>
        </div>
        <div class="rev-cards">${cards}</div>
      </section>`;
  }

  function buildFaq(p) {
    const FAQ = [
      ['Is each piece really handmade?', `Yes. Every ${p.name.toLowerCase()} is shaped, sanded and oil-finished by hand in our workshop. Slight variations in grain are a signature of genuine craft, not a flaw.`],
      ['How do I care for it?', 'Wipe clean with a dry or lightly damp cloth. Re-oil with any food-safe wood oil once or twice a year to keep the finish rich. Avoid soaking or dishwashers.'],
      ['What is the delivery time?', `Most orders ship within 1–2 working days and arrive in 3–6 days across India. ${p.price >= 2000 ? 'Shipping is free on this piece.' : 'A flat ₹99 applies, free over ₹2000.'}`],
      ['Can I return or exchange it?', 'Absolutely — you have 7 days from delivery to return or exchange any unused, undamaged piece. Personalised engravings are non-returnable unless faulty.'],
      ['Is the engraving permanent?', 'Engraving is laser-etched into the wood before the final oil seal, so it is permanent and ages gracefully with the piece.'],
    ];
    return `
      <section class="pd-section">
        <h2>Frequently asked</h2>
        <div class="faq">
          ${FAQ.map(([q, a]) => `
            <div class="faq-item">
              <button class="faq-q">${q}<span class="pm">+</span></button>
              <div class="faq-a"><div class="faq-a-inner">${a}</div></div>
            </div>`).join('')}
        </div>
      </section>`;
  }

    } catch (err) {
      console.error('[KIFRAN] product page failed to render:', err);
      root.innerHTML = errorBox('Sorry — something interrupted loading this piece.');
    }
  } // boot()

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
