/* ============================================================
   KIFRAN — My Orders (Database Edition)
============================================================ */
(function () {
  const KF = window.KF, S = window.KFShop;
  const listEl = document.getElementById('ordersList');

  // map order.status -> tracking step index (0..3); Cancelled = -1
  const STEPS = ['Order placed', 'Packed', 'Shipped', 'Delivered'];
  const STATUS_STEP = { Pending: 0, Processing: 1, Shipped: 2, Delivered: 3, Cancelled: -1 };
  const PILL_CLASS = { Pending: 'placed', Processing: 'packed', Shipped: 'shipped', Delivered: 'delivered', Cancelled: 'cancelled' };
  const PILL_LABEL = { Pending: 'Order placed', Processing: 'Packed', Shipped: 'Shipped', Delivered: 'Delivered', Cancelled: 'Cancelled' };

  const tick = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>';

  function fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (e) { return iso; }
  }
  function img(it) { const p = KF.getProduct(it.id); return p ? KF.thumbOf(p.img) : 'images/opt/cane-thumb.jpg'; }

  /* ---- RENDER (with DB sync) ---- */
  let isFirstRender = true;
  let isLoading = false;

  async function render() {
    // Show loading on first load
    if (isFirstRender) {
      listEl.innerHTML = '<div class="orders-loading">Loading your orders…</div>';
    }

    // Sync with database
    if (!isLoading) {
      isLoading = true;
      try {
        await KF.fetchOrders();
      } catch (err) {
        console.warn('Orders sync failed, using cached data:', err);
      } finally {
        isLoading = false;
      }
    }

    const orders = KF.getOrders();

    if (!orders.length) {
      listEl.innerHTML = emptyState();
      const demoBtn = document.getElementById('demoOrder');
      if (demoBtn) demoBtn.addEventListener('click', makeDemoOrder);
      mountFooter();
      isFirstRender = false;
      return;
    }

    listEl.innerHTML = orders.map(orderCard).join('');
    bindOrderEvents();
    mountFooter();
    isFirstRender = false;
  }

  /* ---- REST OF YOUR EXISTING CODE (unchanged) ---- */
  function orderCard(o) {
    const step = STATUS_STEP[o.status] ?? 0;
    const cancelled = o.status === 'Cancelled';
    const pillCls = PILL_CLASS[o.status] || 'placed';
    const grand = (o.totals && o.totals.grand != null) ? o.totals.grand : (o.items || []).reduce((s, i) => s + (i.lineTotal || 0), 0);
    const reviews = o.reviews || {};

    const items = (o.items || []).map(it => {
      const reviewed = reviews[it.id];
      return `
        <div class="oc-item">
          <img src="${img(it)}" alt="${it.name}"/>
          <div>
            <div class="it-name">${it.name}</div>
            <div class="it-meta">Qty ${it.qty} · ${KF.money(it.price)} each</div>
          </div>
          <span class="it-price">${KF.money(it.lineTotal != null ? it.lineTotal : it.price * it.qty)}</span>
          <button class="it-review ${reviewed ? 'done' : ''}" data-review="${o.id}" data-pid="${it.id}" data-pname="${it.name}">
            ${reviewed ? `Rated ${reviewed.rating}★` : 'Write review'}
          </button>
        </div>`;
    }).join('');

    const trackHTML = cancelled ? `
      <div class="track">
        <p style="color:var(--red);font-size:13px">This order was cancelled. Any payment made will be refunded to the original method.</p>
      </div>` : `
      <div class="track">
        <div class="track-steps">
          <div class="track-prog" style="width:${step <= 0 ? 0 : (step / (STEPS.length - 1)) * 90}%"></div>
          ${STEPS.map((s, i) => `
            <div class="track-step ${i <= step ? 'done' : ''}">
              <div class="dot">${i <= step ? tick : ''}</div>
              <div class="lbl">${s}</div>
            </div>`).join('')}
        </div>
        <div class="track-id-row">
          ${o.trackingId
            ? `<span class="existing">Tracking ID: ${o.trackingId}${o.courier ? ' · ' + o.courier : ''}</span>
               <button data-edittrack="${o.id}">Update</button>`
            : `<input type="text" placeholder="Enter courier tracking ID" data-trackinput="${o.id}"/>
               <button data-savetrack="${o.id}">Save tracking</button>`}
        </div>
      </div>`;

    return `
      <div class="order-card" data-order="${o.id}">
        <div class="order-card-head">
          <div class="oc-meta"><span class="k">Order</span><span class="v">#${o.id}</span></div>
          <div class="oc-meta"><span class="k">Placed on</span><span class="v">${fmtDate(o.date)}</span></div>
          <div class="oc-meta"><span class="k">Payment</span><span class="v">${o.payment || 'PREPAID'}</span></div>
          <div class="oc-status"><span class="status-pill ${pillCls}">${PILL_LABEL[o.status] || o.status}</span></div>
        </div>
        <div class="order-card-body">
          <div class="oc-items">${items}</div>
          ${trackHTML}
        </div>
        <div class="order-foot">
          <span style="color:var(--sand-dim)">${(o.items || []).length} item${(o.items || []).length === 1 ? '' : 's'}</span>
          <span class="total">${KF.money(grand)}</span>
        </div>
      </div>`;
  }

  function emptyState() {
    return `
      <div class="orders-empty">
        <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg></div>
        <h2>No orders yet</h2>
        <p>When you place an order it'll appear here — with live status and tracking.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <a class="load-more" href="store.html" style="display:inline-block;text-decoration:none">Start shopping</a>
          <button class="load-more" id="demoOrder">Create a sample order</button>
        </div>
      </div>`;
  }

  /* ---- demo order ---- */
  async function makeDemoOrder() {
    const picks = KF.bestSellers(3);
    const items = picks.map(p => ({ id: p.id, name: p.name, qty: 1, price: p.price, lineTotal: p.price }));
    const totals = KF.computeTotals(items, 0);
    const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const order = {
      id: 'KFN-' + Date.now().toString().slice(-6),
      date: new Date(Date.now() - Math.floor(Math.random() * 6) * 86400000).toISOString(),
      status,
      payment: 'UPI',
      items,
      couponPct: 0,
      totals,
    };
    if (status === 'Shipped' || status === 'Delivered') { 
      order.trackingId = 'DTDC' + Math.floor(1e8 + Math.random() * 9e8); 
      order.courier = 'DTDC Express'; 
    }
    
    // Save to database
    try {
      await KF.addOrder(order);
      S.toast('Sample order created', 'ok');
      await render(); // Re-render with fresh DB data
    } catch (err) {
      S.toast('Failed to create sample order', 'bad');
    }
  }

  /* ---- EVENTS ---- */
  function bindOrderEvents() {
    listEl.querySelectorAll('[data-savetrack]').forEach(b => b.addEventListener('click', async () => {
      const id = b.dataset.savetrack;
      const input = listEl.querySelector(`[data-trackinput="${id}"]`);
      const val = input.value.trim();
      if (!val) { S.toast('Enter a tracking ID first', 'bad'); return; }
      try {
        await KF.setOrderTracking(id, val, 'Courier');
        S.toast('Tracking ID saved', 'ok');
        await render(); // Refresh from DB
      } catch (err) {
        S.toast('Save failed', 'bad');
      }
    }));
    
    listEl.querySelectorAll('[data-edittrack]').forEach(b => b.addEventListener('click', async () => {
      const id = b.dataset.edittrack;
      try {
        // Remove tracking via API
        await KF.setOrderTracking(id, null, null);
        await render();
      } catch (err) {
        // Fallback: modify locally
        const orders = KF.getOrders();
        const o = orders.find(x => x.id === id);
        if (o) { delete o.trackingId; delete o.courier; KF.setOrders(orders); }
        render();
      }
    }));
    
    listEl.querySelectorAll('[data-review]').forEach(b => b.addEventListener('click', () => {
      openReview(b.dataset.review, b.dataset.pid, b.dataset.pname);
    }));
  }

  /* ---- review modal ---- */
  const modal = document.getElementById('revModal');
  const starsEl = document.getElementById('revStars');
  let revCtx = { orderId: null, pid: null, rating: 0 };

  function openReview(orderId, pid, pname) {
    const existing = (KF.getOrder(orderId).reviews || {})[pid];
    revCtx = { orderId, pid, rating: existing ? existing.rating : 0 };
    const p = KF.getProduct(pid);
    document.getElementById('revProduct').innerHTML =
      `<img src="${p ? KF.thumbOf(p.img) : 'images/opt/cane-thumb.jpg'}" alt="" loading="lazy" decoding="async" style="width:48px;height:58px;object-fit:cover;border-radius:6px"/>
       <div><div style="font-family:var(--serif);font-size:16px">${pname}</div><div style="font-family:var(--mono);font-size:11px;color:var(--sand-dim)">Order #${orderId}</div></div>`;
    document.getElementById('revText').value = existing ? existing.text : '';
    paintStars(revCtx.rating);
    modal.classList.add('show');
  }
  
  function closeReview() { modal.classList.remove('show'); }
  function paintStars(n) { starsEl.querySelectorAll('span').forEach(s => s.classList.toggle('on', +s.dataset.v <= n)); }

  starsEl.querySelectorAll('span').forEach(s => {
    s.addEventListener('mouseenter', () => paintStars(+s.dataset.v));
    s.addEventListener('click', () => { revCtx.rating = +s.dataset.v; paintStars(revCtx.rating); });
  });
  starsEl.addEventListener('mouseleave', () => paintStars(revCtx.rating));

  document.getElementById('revCancel').addEventListener('click', closeReview);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeReview(); });
  
  document.getElementById('revSave').addEventListener('click', async () => {
    if (!revCtx.rating) { S.toast('Pick a star rating', 'bad'); return; }
    const text = document.getElementById('revText').value.trim();
    try {
      await KF.addOrderReview(revCtx.orderId, revCtx.pid, revCtx.rating, text);
      S.toast('Thanks — your review is saved', 'ok');
      closeReview();
      await render(); // Refresh from DB
    } catch (err) {
      S.toast('Review save failed', 'bad');
    }
  });

  function mountFooter() {
    document.getElementById('ordersFooter').innerHTML = S.trustBand() + S.footer();
  }

  // Initial render
  render();
})();