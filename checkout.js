/* ============================================================
   KIFRAN — checkout.js
============================================================ */
let appliedPct = 0;
let payMethod = 'upi';

/* ---------- UPI config (your real UPI ID) ---------- */
const UPI_VPA  = 'amaan2302@ibl';
const UPI_NAME = 'KIFRAN';
function upiLink(amount) {
  return `upi://pay?pa=${UPI_VPA}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent('KIFRAN Order')}`;
}
function refreshUpi(amount) {
  const link = upiLink(amount);
  const appLink = document.getElementById('upiAppLink');
  if (appLink) appLink.href = link;
  const amt = document.getElementById('upiAmt');
  if (amt) amt.textContent = KF.money(amount);
  const img = document.getElementById('upiQR');
  if (img && window.QRCode) {
    QRCode.toDataURL(link, { margin: 1, width: 300, color: { dark: '#0e0b08', light: '#ffffff' } })
      .then(url => { img.src = url; })
      .catch(() => {});
  }
}

/* ---------- toast ---------- */
function toast(msg, type = '') {
  const wrap = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 3200);
}

/* ---------- render summary ---------- */
function renderSummary() {
  const items = KF.cartDetailed();
  const box = document.getElementById('sumItems');

  if (items.length === 0) {
    box.innerHTML = '<p style="color:var(--sand-dim);font-size:14px;padding:10px 0">Your cart is empty. <a href="index.html#shop" style="color:var(--gold-dim);text-decoration:underline">Browse the collection →</a></p>';
    document.getElementById('totals').innerHTML = '';
    document.getElementById('placeOrder').disabled = true;
    return;
  }

  box.innerHTML = items.map(it => `
    <div class="sum-item">
      <img src="${KF.thumbOf(it.img)}" alt="${it.name}" loading="lazy" decoding="async"/>
      <div>
        <div class="si-name">${it.name}</div>
        <div class="si-meta">${it.material} · Qty ${it.qty}</div>
      </div>
      <div class="si-price">${KF.money(it.lineTotal)}</div>
    </div>
  `).join('');

  const t = KF.computeTotals(items, appliedPct);
  document.getElementById('totals').innerHTML = `
    <div class="sum-line"><span>Subtotal</span><span>${KF.money(t.subtotal)}</span></div>
    <div class="sum-line"><span>Shipping</span><span>${t.shipping === 0 ? '<span class="free">FREE</span>' : KF.money(t.shipping)}</span></div>
    ${t.discount ? `<div class="sum-line"><span>Discount (${appliedPct}%)</span><span class="disc">− ${KF.money(t.discount)}</span></div>` : ''}
    <div class="sum-line"><span>GST (18%)</span><span>${KF.money(t.gst)}</span></div>
    <div class="sum-line total"><span>Grand Total</span><span>${KF.money(t.grand)}</span></div>
  `;
  document.getElementById('placeOrder').disabled = false;
  refreshUpi(t.grand);
}

/* ---------- payment tabs ---------- */
document.querySelectorAll('.pay-tab[data-pay]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.pay-tab[data-pay]').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    payMethod = tab.dataset.pay;
    document.querySelectorAll('.pay-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === payMethod));
  });
});

/* ---------- UPI copy ---------- */
document.getElementById('copyUpi').addEventListener('click', () => {
  const id = document.getElementById('upiId').textContent;
  navigator.clipboard?.writeText(id).then(() => toast('UPI ID copied', 'ok')).catch(() => toast('UPI ID: ' + id));
});

/* ---------- card formatting ---------- */
const cNum = document.getElementById('c-num');
cNum.addEventListener('input', () => {
  let v = cNum.value.replace(/\D/g, '').slice(0, 16);
  cNum.value = v.replace(/(.{4})/g, '$1 ').trim();
});
const cExp = document.getElementById('c-exp');
cExp.addEventListener('input', () => {
  let v = cExp.value.replace(/\D/g, '').slice(0, 4);
  if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
  cExp.value = v;
});
document.getElementById('f-phone').addEventListener('input', e => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10));
document.getElementById('f-pin').addEventListener('input', e => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6));

/* ---------- coupon ---------- */
document.getElementById('applyCoupon').addEventListener('click', () => {
  const code = document.getElementById('coupon').value;
  const pct = KF.couponPct(code);
  const msg = document.getElementById('couponMsg');
  if (pct > 0) {
    appliedPct = pct;
    msg.textContent = `✓ ${code.toUpperCase()} applied — ${pct}% off`;
    msg.className = 'coupon-msg ok';
    toast('Coupon applied!', 'ok');
  } else {
    appliedPct = 0;
    msg.textContent = '✕ Invalid or expired coupon';
    msg.className = 'coupon-msg bad';
  }
  renderSummary();
});

/* ---------- validation ---------- */
function setErr(id, msg) { const el = document.getElementById('e-' + id); if (el) el.textContent = msg || ''; const inp = document.getElementById('f-' + id) || document.getElementById('c-' + id); if (inp) inp.classList.toggle('invalid', !!msg); }

function validate() {
  let ok = true;
  const req = { name: 'Required', email: 'Required', phone: 'Required', addr: 'Required', city: 'Required', state: 'Required', pin: 'Required' };
  for (const k in req) {
    const v = (document.getElementById('f-' + k).value || '').trim();
    if (!v) { setErr(k, req[k]); ok = false; } else setErr(k, '');
  }
  const email = document.getElementById('f-email').value.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('email', 'Invalid email'); ok = false; }
  const phone = document.getElementById('f-phone').value.trim();
  if (phone && phone.length !== 10) { setErr('phone', 'Enter 10 digits'); ok = false; }
  const pin = document.getElementById('f-pin').value.trim();
  if (pin && pin.length !== 6) { setErr('pin', 'Enter 6 digits'); ok = false; }

  if (payMethod === 'card') {
    const num = document.getElementById('c-num').value.replace(/\s/g, '');
    if (num.length !== 16) { setErr('cnum', 'Enter 16-digit card'); ok = false; } else setErr('cnum', '');
    if (!/^\d{2}\/\d{2}$/.test(document.getElementById('c-exp').value)) { setErr('cexp', 'MM/YY'); ok = false; } else setErr('cexp', '');
    const cvv = document.getElementById('c-cvv').value;
    if (cvv.length < 3) { setErr('ccvv', '3–4 digits'); ok = false; } else setErr('ccvv', '');
  }
  if (payMethod === 'netbank' && !document.getElementById('bank').value) { toast('Please select a bank', 'bad'); ok = false; }
  if (payMethod === 'wallet' && !document.querySelector('input[name=wallet]:checked')) { toast('Please select a wallet', 'bad'); ok = false; }

  return ok;
}

/* ---------- place order ---------- */
/* read a shipping field by short id (f-name, f-email, f-addr, ...) */
function f(id) {
  const el = document.getElementById('f-' + id);
  return el ? (el.value || '').trim() : '';
}
document.getElementById('placeOrder').addEventListener('click', async () => {
  const items = KF.cartDetailed();
  if (items.length === 0) { toast('Your cart is empty', 'bad'); return; }
  if (!validate()) { toast('Please fix the highlighted fields', 'bad'); return; }

  const btn = document.getElementById('placeOrder');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Processing…';

  try {
    const totals = KF.computeTotals(items, appliedPct);
    const order = {
      id: 'KFN-' + Date.now().toString().slice(-6),
      date: new Date().toISOString(),
      status: 'Pending',
      payment: payMethod.toUpperCase(),
      customer: {
        name: f('name'), email: f('email'), phone: f('phone'),
        address: f('addr'), city: f('city'), state: f('state'),
        pincode: f('pin'), country: f('country'),
      },
      items: items.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price, lineTotal: i.lineTotal })),
      couponPct: appliedPct,
      totals,
    };

    // Save to database
    await KF.addOrder(order);

    // Stock update is best-effort — never let it block the order confirmation
    try {
      for (const i of items) {
        const p = KF.getProduct(i.id);
        if (p) {
          const newStock = Math.max(0, (p.stock || 0) - i.qty);
          await KF.saveProduct({ id: p.id, stock: newStock });
        }
      }
    } catch (stockErr) {
      console.warn('Stock update failed (order was still placed):', stockErr);
    }

    KF.clearCart();
    lastOrder = order;

    document.getElementById('confOrderId').textContent = '#' + order.id;
    document.getElementById('confirmOverlay').classList.add('show');
    btn.innerHTML = '<span>Place Order</span>';
  } catch (err) {
    console.error('Checkout error:', err);
    toast('Order failed: ' + (err && err.message ? err.message : 'please try again'), 'bad');
    btn.disabled = false;
    btn.innerHTML = '<span>Place Order</span>';
  }
});

/* ---------- invoice ---------- */
document.getElementById('dlInvoice').addEventListener('click', () => {
  if (!lastOrder) return;
  const o = lastOrder;
  const lines = o.items.map(i => `  ${i.name}  x${i.qty}   ${KF.money(i.lineTotal)}`).join('\n');
  const txt =
`==============================================
            KIFRAN — TAX INVOICE
        Handcrafted in India · Made to be used
==============================================
Order ID : #${o.id}
Date     : ${new Date(o.date).toLocaleString('en-IN')}
Payment  : ${o.payment}
Status   : ${o.status}
----------------------------------------------
BILL TO
${o.customer.name}
${o.customer.address}, ${o.customer.city}, ${o.customer.state} - ${o.customer.pincode}
${o.customer.country}
${o.customer.phone} · ${o.customer.email}
----------------------------------------------
ITEMS
${lines}
----------------------------------------------
Subtotal        ${KF.money(o.totals.subtotal)}
Shipping        ${o.totals.shipping === 0 ? 'FREE' : KF.money(o.totals.shipping)}
${o.totals.discount ? 'Discount        - ' + KF.money(o.totals.discount) + '\n' : ''}GST (18%)       ${KF.money(o.totals.gst)}
GRAND TOTAL     ${KF.money(o.totals.grand)}
==============================================
        Thank you for choosing KIFRAN.
==============================================`;
  const blob = new Blob([txt], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `KIFRAN-Invoice-${o.id}.txt`;
  a.click();
  toast('Invoice downloaded', 'ok');
});

document.getElementById('continueShop').addEventListener('click', () => window.location.href = 'index.html#shop');

/* ---------- init ---------- */
renderSummary();
