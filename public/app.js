// Клієнтська логіка магазину (без фреймворків)
(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const formatPrice = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' грн';

  function toast(text, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.dataset.testid = 'toast';
    el.textContent = text;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  // --- Cookie-банер ---
  const banner = $('#cookie-banner');
  let consent = null;
  try { consent = localStorage.getItem('cookieConsent'); } catch {}
  if (banner && !consent) banner.hidden = false;
  const closeBanner = (value) => { try { localStorage.setItem('cookieConsent', value); } catch {} banner.hidden = true; };
  $('#cookie-accept')?.addEventListener('click', () => closeBanner('accepted'));
  $('#cookie-decline')?.addEventListener('click', () => closeBanner('declined'));

  // --- Додавання в кошик через API ---
  async function addToCart(productId, qty, button) {
    const original = button.textContent;
    button.disabled = true;
    button.textContent = 'Додаємо…';
    button.setAttribute('aria-busy', 'true');
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: Number(productId), qty: Number(qty) }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error || 'Помилка', 'error'); return; }
      $('[data-testid="cart-count"]').textContent = data.cart.count;
      toast(data.message);
    } catch {
      toast('Не вдалося з\'єднатися з сервером', 'error');
    } finally {
      button.disabled = false;
      button.textContent = original;
      button.removeAttribute('aria-busy');
    }
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.card .add-to-cart');
    if (btn) addToCart(btn.dataset.productId, 1, btn);
  });

  const buyForm = $('.buy-form');
  if (buyForm) {
    const qtyInput = $('input[name="qty"]', buyForm);
    buyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addToCart($('input[name="productId"]', buyForm).value, qtyInput.value, $('.add-to-cart', buyForm));
    });
    $$('.qty-btn', buyForm).forEach((b) => b.addEventListener('click', () => {
      const min = Number(qtyInput.min), max = Number(qtyInput.max);
      const v = Number(qtyInput.value) || 1;
      qtyInput.value = Math.min(max, Math.max(min, v + (b.dataset.action === 'inc' ? 1 : -1)));
    }));
  }

  // --- Сортування в каталозі ---
  $('#sort-select')?.addEventListener('change', (e) => {
    const url = new URL(location.href);
    url.searchParams.set('sort', e.target.value);
    url.searchParams.delete('page');
    location.href = url.toString();
  });

  // --- Кошик: автооновлення кількості та підтвердження ---
  $$('.auto-submit').forEach((input) => input.addEventListener('change', () => input.form.submit()));
  $$('form.confirm').forEach((f) => f.addEventListener('submit', (e) => {
    if (!confirm(f.dataset.confirm)) e.preventDefault();
  }));

  // --- Вкладки на сторінці товару ---
  const tabs = $('.tabs');
  if (tabs) {
    const open = (name) => {
      $$('[role="tab"]', tabs).forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
      $$('[role="tabpanel"]', tabs).forEach((p) => { p.hidden = p.dataset.panel !== name; });
    };
    $$('[role="tab"]', tabs).forEach((t) => t.addEventListener('click', () => open(t.dataset.tab)));
    open(location.hash === '#reviews' ? 'reviews' : tabs.dataset.open);
    $('[data-testid="reviews-count"]')?.addEventListener('click', () => open('reviews'));
  }

  // --- Показати/сховати пароль, індикатор надійності ---
  $$('.toggle-password').forEach((b) => b.addEventListener('click', () => {
    const input = document.getElementById(b.dataset.target);
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    b.textContent = show ? 'Сховати' : 'Показати';
  }));
  const strength = $('.strength');
  if (strength) {
    $('#f-password').addEventListener('input', (e) => {
      const v = e.target.value;
      let score = 0;
      if (v.length >= 8) score++;
      if (/\d/.test(v) && /[^\d]/.test(v)) score++;
      if (/[A-ZА-ЯІЇЄҐ]/.test(v) && /[^A-Za-z0-9А-Яа-яІіЇїЄєҐґ]/.test(v)) score++;
      strength.textContent = v ? 'Надійність: ' + ['слабкий', 'слабкий', 'середній', 'надійний'][score] : '';
      strength.dataset.level = score;
    });
  }

  // --- Оформлення замовлення ---
  const checkout = $('#checkout-form');
  if (checkout) {
    const summary = $('[data-testid="order-summary"]');
    const update = () => {
      const delivery = $('input[name="delivery"]:checked', checkout);
      const payment = $('input[name="payment"]:checked', checkout);
      $$('[data-show-for]', checkout).forEach((el) => {
        el.hidden = !delivery || !el.dataset.showFor.split(' ').includes(delivery.value);
      });
      $$('[data-show-for-payment]', checkout).forEach((el) => {
        el.hidden = !payment || el.dataset.showForPayment !== payment.value;
      });
      if (delivery) {
        const subtotal = Number(summary.dataset.subtotal), discount = Number(summary.dataset.discount);
        let shipping = Number(delivery.dataset.price);
        if (subtotal - discount >= Number(summary.dataset.freeFrom) || summary.dataset.freeShippingPromo === '1') shipping = 0;
        const sh = $('[data-testid="summary-shipping"]', summary);
        sh.textContent = shipping ? formatPrice(shipping) : 'безкоштовно';
        sh.dataset.price = shipping;
        const total = $('[data-testid="summary-total"]', summary);
        total.textContent = formatPrice(subtotal - discount + shipping);
        total.dataset.price = subtotal - discount + shipping;
      }
    };
    checkout.addEventListener('change', update);
    update();

    const card = $('#f-cardNumber');
    card?.addEventListener('input', () => {
      const digits = card.value.replace(/\D/g, '').slice(0, 16);
      card.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    });
    const exp = $('#f-cardExpiry');
    exp?.addEventListener('input', (e) => {
      let d = exp.value.replace(/\D/g, '').slice(0, 4);
      if (d.length > 2 || (d.length === 2 && e.inputType !== 'deleteContentBackward')) d = d.slice(0, 2) + '/' + d.slice(2);
      exp.value = d;
    });
    checkout.addEventListener('submit', () => {
      const b = $('#place-order');
      b.disabled = true;
      b.textContent = 'Обробка платежу…';
    });
  }
})();
