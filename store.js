/* ============================================================
   KIFRAN — store.js  (store.html)
============================================================ */
(function () {
  const $ = (s) => document.querySelector(s);
  const S = window.KFShop, money = KF.money;

  /* category icons */
  const CAT_IC = {
    'Canes':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 21V8a4 4 0 0 1 8 0"/><path d="M12 8V3"/></svg>',
    'Yarn Tools':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="9"/><path d="M7 7l10 10M7 17 17 7"/></svg>',
    'Wellbeing':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z"/></svg>',
    'Home Décor':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
    'Kitchen & Dining':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2M5 2v20M16 2v20c3-1 4-3 4-7V6c0-2-2-4-4-4z"/></svg>',
    'Gifts':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="8" width="18" height="13" rx="1"/><path d="M12 8v13M3 12h18M12 8S9 2 6.5 4 9 8 12 8zM12 8s3-6 5.5-4S15 8 12 8z"/></svg>',
  };

  /* category cards */
  const cats = KF.categories();
  $('#catCards').innerHTML = cats.map(c => {
    const count = KF.byCat(c).length;
    return `<a class="cat-card" href="plp.html?cat=${encodeURIComponent(c)}">
      <div class="ic">${CAT_IC[c] || S.I.grid}</div>
      <div class="nm">${c}</div><div class="ct">${count} pieces</div>
    </a>`;
  }).join('');

  /* grids + carousels */
  S.renderGrid($('#featuredGrid'), KF.topRated(8));
  S.renderGrid($('#trendingCarousel'), KF.trending(10));
  S.renderGrid($('#newCarousel'), KF.newArrivals(10));
  S.renderGrid($('#bestCarousel'), KF.bestSellers(10));

  /* recently viewed */
  const recent = KF.recentProducts(null, 10);
  if (recent.length) { $('#recentSection').style.display = ''; S.renderGrid($('#recentCarousel'), recent); }

  /* trust band */
  const TRUST = [
    ['Secure Payments','UPI · Cards · COD','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'],
    ['Fast Delivery','3–6 days, pan-India','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7zM5.5 18.5a2 2 0 1 0 0 .01M18.5 18.5a2 2 0 1 0 0 .01"/></svg>'],
    ['Easy Returns','7-day return &amp; exchange','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>'],
    ['Customer Support','Mon–Sat, real humans','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 1 1 21 11.5z"/></svg>'],
    ['Quality Assurance','Hand-finished, checked twice','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>'],
    ['COD Available','Pay when it arrives','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>'],
  ];
  $('#trustGrid').innerHTML = TRUST.map(([t, s, ic]) => `<div class="trust-cell"><div class="ic">${ic}</div><div class="t">${t}</div><div class="s">${s}</div></div>`).join('');

  /* store reviews */
  const RVW = [
    ['Peter M.','Belgium','PM',5,'The sheesham cane is stunning — the grain, the balance, the finish. It looks even better in person. You can feel the hours put into it.'],
    ['Antony N.','Denmark','AN',5,'I\u2019ve owned a lot of décor. Nothing comes close. There\u2019s a warmth to KIFRAN pieces that photographs don\u2019t capture.'],
    ['Rahul S.','Bengaluru','RS',5,'Ordered a yarn tools set as a gift. Exceptional quality — knowing it\u2019s handmade made it feel truly irreplaceable.'],
  ];
  $('#storeReviews').innerHTML = RVW.map(([n, c, av, r, t]) => `
    <div class="rev-card">
      <div class="rev-card-head"><div class="rev-avatar">${av}</div><div><div class="nm">${n}</div><span class="rev-verified">${S.I.check ? '✓' : ''} ${c}</span></div></div>
      <div class="stars">${S.stars(r)}</div>
      <p>${t}</p>
    </div>`).join('');

  /* flash timer */
  let secs = 12 * 3600 - 1;
  const tEl = $('#flashTimer');
  setInterval(() => {
    if (secs <= 0) return;
    secs--;
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    tEl.textContent = `Ends in ${h}:${m}:${s}`;
  }, 1000);

  /* newsletter */
  $('#nlForm').addEventListener('submit', e => {
    e.preventDefault();
    e.target.querySelector('input').value = '';
    S.toast('Subscribed — check your inbox for 10% off ✓', 'ok');
  });
})();
