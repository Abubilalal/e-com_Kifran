/* ============================================================
   KIFRAN — admin.js
============================================================ */

/* ---- toast ----
   admin.html only loads kifran-data.js + admin.js (not shop.js),
   so the shared toast() helper isn't available here. Define a
   self-contained copy. Without this, the very first toast() call
   in doLogin() threw "toast is not defined", which aborted the
   function before showApp() ran — so Sign In appeared to do nothing
   until a manual refresh. */
function toast(msg, type = '') {
  const wrap = document.getElementById('toasts');
  if (!wrap) { alert(msg); return; }
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(20px)';
    t.style.transition = '.3s';
    setTimeout(() => t.remove(), 300);
  }, 2600);
}

/* ---- save (updated for database) ---- */
document.getElementById('prodSave').addEventListener('click', async () => {
  const name = document.getElementById('m-name').value.trim();
  const price = parseInt(document.getElementById('m-price').value, 10);
  if (!name || !price) { toast('Name and price are required', 'bad'); return; }
  if (modalImages.length < 1) { toast('Add at least one product image', 'bad'); return; }

  const splitList = v => v.split(',').map(s => s.trim()).filter(Boolean);
  const id = document.getElementById('m-id').value;
  const desc = document.getElementById('m-desc').value.trim();
  const images = [...modalImages];

  const data = {
    name,
    brand: document.getElementById('m-brand').value.trim() || 'KIFRAN',
    material: document.getElementById('m-material').value.trim() || 'Handcrafted Wood',
    cat: document.getElementById('m-cat').value.trim() || 'Canes',
    price,
    mrp: parseInt(document.getElementById('m-mrp').value, 10) || 0,
    stock: parseInt(document.getElementById('m-stock').value, 10) || 0,
    badge: document.getElementById('m-badge').value.trim(),
    colors: splitList(document.getElementById('m-colors').value),
    sizes: splitList(document.getElementById('m-sizes').value),
    images,
    img: images[0],
    gallery: images,
    video: modalVideo || '',
    showDiscount:     document.getElementById('m-showDiscount').checked,
    showFreeDelivery: document.getElementById('m-showFreeDelivery').checked,
    showDelivery:     document.getElementById('m-showDelivery').checked,
    showRating:       document.getElementById('m-showRating').checked,
    showStock:        document.getElementById('m-showStock').checked,
  };
  if (desc) data.desc = desc;
  if (!data.colors.length) data.colors = ['Natural'];
  if (id) data.id = id;
  else data.id = 'p' + Date.now();

  // Add rating/reviews for new products
  if (!id) {
    data.rating = 4.7;
    data.reviews = 0;
  }

  const btn = document.getElementById('prodSave');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  try {
    await KF.saveProduct(data);
    toast(id ? 'Product updated' : 'Product added', 'ok');
    closeProdModal();
    await KF.fetchProducts(); // Refresh from DB
    renderProducts(document.getElementById('prodSearch').value);
    renderDashboard();
  } catch (err) {
    toast('Save failed — check connection', 'bad');
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Product';
  }
});

/* ---- delete (updated for database) ---- */
document.getElementById('confirmYes').addEventListener('click', async () => {
  try {
    await KF.deleteProduct(pendingDelete);
    confirmModal.classList.remove('show');
    await KF.fetchProducts();
    renderProducts(document.getElementById('prodSearch').value);
    renderDashboard();
    toast('Product deleted');
  } catch (err) {
    toast('Delete failed', 'bad');
  }
});

/* ---------------- AUTH ---------------- */
const loginWrap = document.getElementById('loginWrap');
const adminShell = document.getElementById('adminShell');

async function showApp() {
  loginWrap.style.display = 'none';
  adminShell.style.display = 'grid';
  document.getElementById('whoami').textContent = JSON.parse(localStorage.getItem(KF.KEYS.session)).email;
  // Pull the latest catalogue + orders straight from the database BEFORE
  // painting, so every refresh/login shows current data — never a stale
  // in-memory or localStorage copy. fetchProducts/fetchOrders fall back to
  // local data internally only if the network is genuinely unreachable.
  try {
    await Promise.all([KF.fetchProducts(), KF.fetchOrders()]);
  } catch (e) { console.warn('Initial admin sync failed:', e); }
  renderDashboard(); renderProducts(); renderOrders();
}
function showLogin() { loginWrap.style.display = 'grid'; adminShell.style.display = 'none'; }

document.getElementById('loginBtn').addEventListener('click', doLogin);
document.getElementById('l-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
function doLogin() {
  const email = document.getElementById('l-email').value;
  const pass = document.getElementById('l-pass').value;
  if (KF.login(email, pass)) {
    document.getElementById('loginErr').textContent = '';
    showApp();                               // switch screens FIRST — the critical action
    toast('Welcome back, admin', 'ok');      // cosmetic; never let it block sign-in
  } else {
    document.getElementById('loginErr').textContent = 'Invalid email or password';
  }
}
document.getElementById('logoutBtn').addEventListener('click', () => { KF.logout(); showLogin(); toast('Logged out'); });

/* ---------------- NAV ---------------- */
document.querySelectorAll('.side-link[data-view]').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.side-link[data-view]').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    const v = link.dataset.view;
    document.querySelectorAll('.admin-view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
  });
});

/* ---------------- DASHBOARD ---------------- */
function renderDashboard() {
  const orders = KF.getOrders();
  const products = KF.getProducts();
  const totalSales = orders.reduce((s, o) => s + o.totals.grand, 0);
  const lowCount = products.filter(p => p.stock <= 5).length;

  const stats = [
    { label: 'Total Sales', val: KF.money(totalSales), ic: 'M12 2v20M5 5h14M5 19h14' },
    { label: 'Total Orders', val: orders.length, ic: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z' },
    { label: 'Products', val: products.length, ic: 'M21 16V8l-9-5-9 5v8l9 5z' },
    { label: 'Low Stock', val: lowCount, ic: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z', warn: lowCount > 0 },
  ];
  document.getElementById('statGrid').innerHTML = stats.map(s => `
    <div class="stat ${s.warn ? 'warn' : ''}">
      <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="${s.ic}"/></svg></div>
      <div class="label">${s.label}</div>
      <div class="val">${s.val}</div>
    </div>`).join('');

  // chart (last 7 orders revenue)
  const recent = orders.slice(0, 7).reverse();
  const chart = document.getElementById('chart');
  if (recent.length === 0) {
    chart.innerHTML = '<p style="color:var(--sand-dim);font-size:13px">No orders yet. Place a test order from the store to see data here.</p>';
  } else {
    const max = Math.max(...recent.map(o => o.totals.grand));
    chart.innerHTML = recent.map(o => {
      const h = Math.max(8, (o.totals.grand / max) * 150);
      return `<div class="bar-col"><span class="bar-val">${(o.totals.grand / 1000).toFixed(1)}k</span><div class="bar" style="height:${h}px"></div><span class="bar-lbl">#${o.id.slice(-4)}</span></div>`;
    }).join('');
  }

  // recent orders
  const ro = document.getElementById('recentOrders');
  ro.innerHTML = orders.length === 0
    ? '<p style="color:var(--sand-dim);font-size:13px">No orders yet.</p>'
    : tableHTML(['Order', 'Customer', 'Total', 'Status', 'Date'],
        orders.slice(0, 5).map(o => [
          '#' + o.id, o.customer.name, KF.money(o.totals.grand),
          `<span class="pill ${o.status === 'Delivered' ? 'ok' : ''}">${o.status}</span>`,
          new Date(o.date).toLocaleDateString('en-IN'),
        ]));

  // low stock
  const low = products.filter(p => p.stock <= 5);
  document.getElementById('lowStock').innerHTML = low.length === 0
    ? '<p style="color:#2e7d4f;font-size:13px">✓ All products well stocked.</p>'
    : tableHTML(['Product', 'Category', 'Stock'],
        low.map(p => [p.name, p.cat, `<span class="pill low">${p.stock} left</span>`]));
}

function tableHTML(headers, rows) {
  return `<table class="tbl"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

/* ---------------- PRODUCTS ---------------- */
function renderProducts(filter = '') {
  const products = KF.getProducts().filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.cat.toLowerCase().includes(filter.toLowerCase()));
  const rows = products.map(p => `<tr>
    <td><img class="tbl-thumb" src="${KF.thumbOf(p.img)}" alt="" loading="lazy" decoding="async"/></td>
    <td>${p.name}<div style="font-family:var(--mono);font-size:11px;color:var(--sand-dim)">${p.material}</div></td>
    <td>${p.cat}</td>
    <td>${KF.money(p.price)}${p.mrp ? `<s style="color:var(--sand-dim);font-size:12px"> ${KF.money(p.mrp)}</s>` : ''}</td>
    <td><span class="pill ${p.stock <= 5 ? 'low' : 'ok'}">${p.stock}</span></td>
    <td>
      <button class="btn-sm" onclick="editProduct('${p.id}')">Edit</button>
      <button class="btn-sm danger" onclick="askDelete('${p.id}')">Delete</button>
    </td></tr>`).join('');
  document.getElementById('prodTable').innerHTML =
    `<table class="tbl"><thead><tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>${rows || '<tr><td colspan=6 style="color:var(--sand-dim)">No products found.</td></tr>'}</tbody></table>`;
}
document.getElementById('prodSearch').addEventListener('input', e => renderProducts(e.target.value));

/* ---------------- PRODUCT MODAL ---------------- */
const prodModal = document.getElementById('prodModal');
let modalImages = [];   // array of data-uris / urls (index 0 = main)
let modalVideo  = '';   // url or data-uri

function openProdModal() { prodModal.classList.add('show'); }
function closeProdModal() { prodModal.classList.remove('show'); }

/* ---- category datalist ---- */
function fillCatList() {
  const set = [...new Set([...KF.categories(), 'Canes', 'Yarn Tools', 'Wellbeing', 'Home Décor', 'Kitchen & Dining', 'Gifts'])];
  document.getElementById('catList').innerHTML = set.map(c => `<option value="${c}">`).join('');
}

/* ---- image helpers (read + downscale so localStorage stays small) ---- */
function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
function downscale(dataUrl, max = 1000, quality = 0.82) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth, h = img.naturalHeight;
      if (w > max || h > max) { const s = Math.min(max / w, max / h); w = Math.round(w * s); h = Math.round(h * s); }
      try {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        res(c.toDataURL('image/jpeg', quality));
      } catch (e) { res(dataUrl); }
    };
    img.onerror = () => res(dataUrl);
    img.src = dataUrl;
  });
}
async function addImageFiles(files) {
  const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  let added = 0, rejected = 0;
  for (const f of files) {
    if (modalImages.length >= 10) { toast('Maximum 10 images reached', 'bad'); break; }
    /* Accept only JPG / JPEG / PNG / WEBP (by MIME or extension). */
    const okType = ALLOWED.includes((f.type || '').toLowerCase());
    const okExt  = /\.(jpe?g|png|webp)$/i.test(f.name || '');
    if (!okType && !okExt) { rejected++; continue; }
    try {
      const raw = await fileToDataURL(f);
      modalImages.push(await downscale(raw));
      added++;
    } catch (e) { /* skip unreadable file */ }
  }
  if (rejected) toast('Only JPG, PNG or WEBP images are allowed', 'bad');
  if (added) renderImgGrid();
}
function renderImgGrid() {
  const grid = document.getElementById('mImgGrid');
  grid.innerHTML = modalImages.map((src, i) => `
    <div class="img-cell" draggable="true" data-i="${i}">
      <img src="${src}" alt="image ${i + 1}"/>
      ${i === 0 ? '<span class="main-tag">Main</span>' : ''}
      <button type="button" class="img-del" data-del="${i}" title="Remove">✕</button>
    </div>`).join('');
  document.getElementById('mImgCount').textContent = modalImages.length + ' / 10';
  document.getElementById('mReorderHint').style.display = modalImages.length > 1 ? 'block' : 'none';
}

/* ---- video helpers ---- */
function renderVideoPreview() {
  const box = document.getElementById('mVideoPreview');
  if (!modalVideo) { box.innerHTML = ''; box.classList.remove('on'); return; }
  box.classList.add('on');
  const v = KF.videoInfo(modalVideo);
  box.innerHTML = v.type === 'embed'
    ? `<iframe src="${v.url}" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
    : `<video src="${v.url}" controls playsinline></video>`;
}

/* ---- dropzone + inputs wiring (bound once) ---- */
const drop = document.getElementById('mDrop');
const fileInput = document.getElementById('m-img-file');
drop.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => { addImageFiles([...e.target.files]); fileInput.value = ''; });
['dragover', 'dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', e => { if (e.dataTransfer.files.length) addImageFiles([...e.dataTransfer.files]); });

document.getElementById('mImgUrlAdd').addEventListener('click', () => {
  const inp = document.getElementById('m-img-url');
  const url = inp.value.trim();
  if (!url) return;
  if (modalImages.length >= 10) { toast('Maximum 10 images reached', 'bad'); return; }
  modalImages.push(url); inp.value = ''; renderImgGrid();
});

/* grid: delete + drag-to-reorder (delegated) */
const imgGrid = document.getElementById('mImgGrid');
imgGrid.addEventListener('click', e => {
  const del = e.target.closest('[data-del]');
  if (del) { modalImages.splice(+del.dataset.del, 1); renderImgGrid(); }
});
let dragFrom = null;
imgGrid.addEventListener('dragstart', e => { const c = e.target.closest('.img-cell'); if (c) { dragFrom = +c.dataset.i; c.classList.add('dragging'); } });
imgGrid.addEventListener('dragend', e => { const c = e.target.closest('.img-cell'); if (c) c.classList.remove('dragging'); });
imgGrid.addEventListener('dragover', e => { e.preventDefault(); });
imgGrid.addEventListener('drop', e => {
  e.preventDefault();
  const c = e.target.closest('.img-cell'); if (!c || dragFrom === null) return;
  const to = +c.dataset.i;
  if (to === dragFrom) return;
  const [moved] = modalImages.splice(dragFrom, 1);
  modalImages.splice(to, 0, moved);
  dragFrom = null;
  renderImgGrid();
});

/* video inputs */
document.getElementById('mVideoUrlAdd').addEventListener('click', () => {
  const inp = document.getElementById('m-video-url');
  modalVideo = inp.value.trim();
  renderVideoPreview();
  if (modalVideo) toast('Video link added', 'ok');
});
document.getElementById('m-video-file').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  if (f.size > 8 * 1024 * 1024) { toast('Video over 8MB — please use a YouTube/CDN link instead', 'bad'); e.target.value = ''; return; }
  try { modalVideo = await fileToDataURL(f); document.getElementById('m-video-url').value = ''; renderVideoPreview(); toast('Video added', 'ok'); }
  catch (err) { toast('Could not read video', 'bad'); }
  e.target.value = '';
});
document.getElementById('mVideoClear').addEventListener('click', () => {
  modalVideo = ''; document.getElementById('m-video-url').value = ''; document.getElementById('m-video-file').value = '';
  renderVideoPreview(); toast('Video removed');
});

/* ---- open: add ---- */
document.getElementById('addProdBtn').addEventListener('click', () => {
  fillCatList();
  document.getElementById('prodModalTitle').textContent = 'Add Product';
  ['m-id', 'm-name', 'm-brand', 'm-material', 'm-price', 'm-mrp', 'm-stock', 'm-badge', 'm-colors', 'm-sizes', 'm-desc', 'm-img-url', 'm-video-url'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('m-cat').value = 'Canes';
  // defaults from data layer
  const d = KF.CARD_DEFAULTS;
  document.getElementById('m-showDiscount').checked     = !!d.showDiscount;
  document.getElementById('m-showFreeDelivery').checked = !!d.showFreeDelivery;
  document.getElementById('m-showDelivery').checked     = !!d.showDelivery;
  document.getElementById('m-showRating').checked       = !!d.showRating;
  document.getElementById('m-showStock').checked        = !!d.showStock;
  modalImages = []; modalVideo = '';
  renderImgGrid(); renderVideoPreview();
  openProdModal();
});

/* ---- open: edit ---- */
window.editProduct = function (id) {
  fillCatList();
  const p = KF.getProduct(id);
  document.getElementById('prodModalTitle').textContent = 'Edit Product';
  document.getElementById('m-id').value = p.id;
  document.getElementById('m-name').value = p.name;
  document.getElementById('m-brand').value = p.brand || '';
  document.getElementById('m-material').value = p.material;
  document.getElementById('m-cat').value = p.cat;
  document.getElementById('m-price').value = p.price;
  document.getElementById('m-mrp').value = p.mrp || '';
  document.getElementById('m-stock').value = p.stock;
  document.getElementById('m-badge').value = p.badge || '';
  document.getElementById('m-colors').value = (p.colors || []).join(', ');
  document.getElementById('m-sizes').value = (p.sizes || []).join(', ');
  document.getElementById('m-desc').value = (p.desc && !/shaped by hand from/.test(p.desc)) ? p.desc : '';
  document.getElementById('m-showDiscount').checked     = !!p.showDiscount;
  document.getElementById('m-showFreeDelivery').checked = !!p.showFreeDelivery;
  document.getElementById('m-showDelivery').checked     = !!p.showDelivery;
  document.getElementById('m-showRating').checked       = !!p.showRating;
  document.getElementById('m-showStock').checked        = !!p.showStock;
  modalImages = (p.images && p.images.length) ? [...p.images] : (p.img ? [p.img] : []);
  modalVideo = p.video || '';
  document.getElementById('m-img-url').value = '';
  document.getElementById('m-video-url').value = '';
  renderImgGrid(); renderVideoPreview();
  openProdModal();
};

document.getElementById('prodCancel').addEventListener('click', closeProdModal);

/* delete confirm */
const confirmModal = document.getElementById('confirmModal');
let pendingDelete = null;
window.askDelete = function (id) {
  pendingDelete = id;
  const p = KF.getProduct(id);
  document.getElementById('confirmText').textContent = `Delete "${p.name}"? This cannot be undone.`;
  confirmModal.classList.add('show');
};
document.getElementById('confirmNo').addEventListener('click', () => confirmModal.classList.remove('show'));

/* ---------------- ORDERS ---------------- */
const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const STATUS_CLASS = { Pending: 'pending', Processing: 'processing', Shipped: 'shipped', Delivered: 'delivered', Cancelled: 'cancelled' };

function fmtOrderDate(iso) {
  try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch (e) { return iso; }
}
function fmtOrderTime(iso) {
  try { return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }); }
  catch (e) { return ''; }
}
function sameDay(iso, ymd) {
  if (!ymd) return true;
  try {
    const d = new Date(iso);
    const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return local === ymd;
  } catch (e) { return true; }
}

function getOrderFilters() {
  return {
    q: (document.getElementById('orderSearch').value || '').toLowerCase().trim(),
    status: document.getElementById('orderStatusFilter').value,
    date: document.getElementById('orderDateFilter').value,
  };
}

function renderOrders() {
  const { q, status, date } = getOrderFilters();
  // newest first (orders are stored newest-first; sort defensively by date)
  const orders = KF.getOrders()
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .filter(o => {
      const cust = o.customer || {};
      const hay = `${o.id} ${cust.name || ''} ${cust.phone || ''}`.toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (status && o.status !== status) return false;
      if (date && !sameDay(o.date, date)) return false;
      return true;
    });

  const rows = orders.map(o => {
    const cust = o.customer || {};
    const qty = (o.items || []).reduce((n, i) => n + i.qty, 0);
    const cls = STATUS_CLASS[o.status] || 'pending';
    return `<tr>
      <td><b>#${o.id}</b><div class="cell-sub">${fmtOrderDate(o.date)} · ${fmtOrderTime(o.date)}</div></td>
      <td>${cust.name || '—'}<div class="cell-sub">${cust.phone || ''}</div></td>
      <td>${qty} item${qty === 1 ? '' : 's'}</td>
      <td>${KF.money(o.totals ? o.totals.grand : 0)}</td>
      <td>${o.payment || '—'}</td>
      <td>
        <select class="status-sel ${cls}" onchange="changeStatus('${o.id}', this.value)">
          ${STATUSES.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td><button class="btn-sm" onclick="viewOrder('${o.id}')">View</button></td>
    </tr>`;
  }).join('');

  document.getElementById('orderTable').innerHTML =
    `<table class="tbl"><thead><tr><th>Order / Date</th><th>Customer</th><th>Qty</th><th>Total</th><th>Pay</th><th>Status</th><th></th></tr></thead>
     <tbody>${rows || '<tr><td colspan=7 style="color:var(--sand-dim)">No orders match these filters.</td></tr>'}</tbody></table>`;
}
document.getElementById('orderSearch').addEventListener('input', renderOrders);
document.getElementById('orderStatusFilter').addEventListener('change', renderOrders);
document.getElementById('orderDateFilter').addEventListener('change', renderOrders);
document.getElementById('orderClearFilters').addEventListener('click', () => {
  document.getElementById('orderSearch').value = '';
  document.getElementById('orderStatusFilter').value = '';
  document.getElementById('orderDateFilter').value = '';
  renderOrders();
});
window.changeStatus = function (id, status) { KF.updateOrderStatus(id, status); toast('Status → ' + status, 'ok'); renderOrders(); renderDashboard(); };

const orderModal = document.getElementById('orderModal');
window.viewOrder = function (id) {
  const o = KF.getOrders().find(x => x.id === id);
  const cust = o.customer || {};
  const cls = STATUS_CLASS[o.status] || 'pending';
  const items = (o.items || []).map(i => `<div class="sum-line"><span>${i.name} × ${i.qty}</span><span>${KF.money(i.lineTotal)}</span></div>`).join('');
  document.getElementById('orderDetail').innerHTML = `
    <div class="order-detail-top">
      <div class="order-id" style="margin-top:0">#${o.id}</div>
      <span class="status-pill ${cls}">${o.status}</span>
    </div>
    <div class="order-detail-meta">
      <div><span class="k">Date</span><span class="v">${fmtOrderDate(o.date)}</span></div>
      <div><span class="k">Time</span><span class="v">${fmtOrderTime(o.date)}</span></div>
      <div><span class="k">Payment</span><span class="v">${o.payment || '—'}</span></div>
    </div>
    <div class="order-detail-cust">
      <strong>${cust.name || '—'}</strong><br>
      ${cust.address ? cust.address + ', ' : ''}${cust.city || ''}${cust.state ? ', ' + cust.state : ''}${cust.pincode ? ' - ' + cust.pincode : ''}<br>
      <a href="tel:${cust.phone}">${cust.phone || ''}</a> · ${cust.email || ''}
    </div>
    <div style="margin:16px 0">${items}</div>
    <div class="sum-line"><span>Subtotal</span><span>${KF.money(o.totals.subtotal)}</span></div>
    <div class="sum-line"><span>Shipping</span><span>${o.totals.shipping === 0 ? 'FREE' : KF.money(o.totals.shipping)}</span></div>
    ${o.totals.discount ? `<div class="sum-line"><span>Discount</span><span class="disc">− ${KF.money(o.totals.discount)}</span></div>` : ''}
    <div class="sum-line"><span>GST</span><span>${KF.money(o.totals.gst)}</span></div>
    <div class="sum-line total"><span>Total</span><span>${KF.money(o.totals.grand)}</span></div>`;
  orderModal.classList.add('show');
};
document.getElementById('orderClose').addEventListener('click', () => orderModal.classList.remove('show'));

/* close modals on overlay click */
[prodModal, confirmModal, orderModal].forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('show'); }));

/* ---------------- INIT ---------------- */
// showApp() now performs the authoritative fresh DB load before rendering,
// so no separate background prefetch is needed here.
if (KF.isLoggedIn()) showApp(); else showLogin();
