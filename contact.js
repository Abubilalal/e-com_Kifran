/* ============================================================
   KIFRAN — contact.js
   Client-side contact form (validation + friendly confirmation).
   No backend: messages are acknowledged locally, matching the
   rest of the demo store's localStorage architecture.
============================================================ */
(function () {
  var S = window.KFShop;

  /* footer / trust band */
  if (S) document.getElementById('contactFooter').innerHTML = S.trustBand() + S.newsletter() + S.footer();

  var phone = document.getElementById('cf-phone');
  phone.addEventListener('input', function () { phone.value = phone.value.replace(/\D/g, '').slice(0, 10); });

  function setErr(id, msg) {
    var e = document.getElementById('ecf-' + id);
    var inp = document.getElementById('cf-' + id);
    if (e) e.textContent = msg || '';
    if (inp) inp.classList.toggle('invalid', !!msg);
  }

  function validate() {
    var ok = true;
    var name = document.getElementById('cf-name').value.trim();
    var email = document.getElementById('cf-email').value.trim();
    var ph = document.getElementById('cf-phone').value.trim();
    var msg = document.getElementById('cf-msg').value.trim();

    if (!name) { setErr('name', 'Please enter your name'); ok = false; } else setErr('name', '');
    if (!email) { setErr('email', 'Please enter your email'); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('email', 'Enter a valid email'); ok = false; }
    else setErr('email', '');
    if (ph && ph.length !== 10) { setErr('phone', 'Enter 10 digits'); ok = false; } else setErr('phone', '');
    if (!msg) { setErr('msg', 'Please write a short message'); ok = false; } else setErr('msg', '');
    return ok;
  }

  document.getElementById('cfSubmit').addEventListener('click', function () {
    if (!validate()) { if (S) S.toast('Please fix the highlighted fields', 'bad'); return; }
    var btn = this;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    setTimeout(function () {
      ['name', 'email', 'phone', 'msg'].forEach(function (id) { document.getElementById('cf-' + id).value = ''; });
      document.getElementById('cf-topic').selectedIndex = 0;
      btn.disabled = false;
      btn.textContent = 'Send message';
      if (S) S.toast('Thanks — your message is on its way. We\u2019ll reply shortly.', 'ok');
    }, 1000);
  });
})();
