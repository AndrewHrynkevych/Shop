const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { db, save, reset, nextId, hashPassword, categories } = require('./lib/db');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
// Штучна затримка для API кошика, щоб тренувати очікування в тестах.
const LATENCY_MS = Number(process.env.LATENCY_MS ?? 400);
const PER_PAGE = 12;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/static', express.static(path.join(__dirname, 'public')));

// ---------- Утиліти ----------

const formatPrice = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' грн';
const formatDate = (iso) => {
  const d = new Date(iso);
  const p = (x) => String(x).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+380\d{9}$/;

function parseCookies(header = '') {
  const out = {};
  header.split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function findProduct(id) {
  return db().products.find((p) => p.id === Number(id));
}

function safeNext(next) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

// ---------- Сесії (в пам'яті) ----------

const sessions = new Map();

app.use((req, res, next) => {
  let sid = parseCookies(req.headers.cookie).sid;
  if (!sid || !sessions.has(sid)) {
    sid = crypto.randomUUID();
    sessions.set(sid, { cart: [], promo: null, userId: null, flash: null, orderIds: [] });
    res.cookie('sid', sid, { httpOnly: true, sameSite: 'lax', path: '/' });
  }
  req.session = sessions.get(sid);
  req.user = req.session.userId ? db().users.find((u) => u.id === req.session.userId) || null : null;
  next();
});

function getCart(req) {
  return req.user ? req.user.cart : req.session.cart;
}

function setFlash(req, type, text) {
  req.session.flash = { type, text };
}

// ---------- Кошик, промокоди, доставка ----------

const PROMOS = {
  SAVE10: { type: 'percent', value: 10, label: 'Знижка 10%' },
  MINUS200: { type: 'fixed', value: 200, min: 1000, label: 'Знижка 200 грн' },
  FREESHIP: { type: 'shipping', label: 'Безкоштовна доставка' },
  EXPIRED2025: { type: 'expired' },
};

const DELIVERY = {
  courier: { label: 'Кур\'єр', price: 100 },
  post: { label: 'Відділення пошти', price: 60 },
  pickup: { label: 'Самовивіз з магазину', price: 0 },
};
const FREE_SHIPPING_FROM = 3000;
const STORES = ['Київ, вул. Хрещатик, 22', 'Львів, вул. Городоцька, 15', 'Одеса, вул. Дерибасівська, 7'];

function validatePromo(code, subtotal) {
  const promo = PROMOS[code];
  if (!promo) return 'Промокод не знайдено';
  if (promo.type === 'expired') return 'Термін дії промокоду минув';
  if (promo.min && subtotal < promo.min) return `Мінімальна сума для цього промокоду — ${formatPrice(promo.min)}`;
  return null;
}

function cartSummary(cart, promoCode, delivery) {
  const items = cart
    .map((line) => {
      const product = findProduct(line.productId);
      return product ? { product, qty: line.qty, lineTotal: product.price * line.qty } : null;
    })
    .filter(Boolean);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  let discount = 0;
  let promo = null;
  let promoError = null;
  if (promoCode) {
    promoError = validatePromo(promoCode, subtotal);
    if (!promoError) {
      promo = { code: promoCode, ...PROMOS[promoCode] };
      if (promo.type === 'percent') discount = Math.round((subtotal * promo.value) / 100);
      if (promo.type === 'fixed') discount = promo.value;
    }
  }
  let shipping = null;
  if (delivery && DELIVERY[delivery]) {
    shipping = DELIVERY[delivery].price;
    if (subtotal - discount >= FREE_SHIPPING_FROM || (promo && promo.type === 'shipping')) shipping = 0;
  }
  const total = subtotal - discount + (shipping || 0);
  return { items, count, subtotal, discount, promo, promoError, shipping, total };
}

function addToCart(cart, product, qty) {
  if (!Number.isInteger(qty) || qty < 1) return 'Кількість має бути цілим числом від 1';
  if (product.stock === 0) return 'Товару немає в наявності';
  const line = cart.find((l) => l.productId === product.id);
  const already = line ? line.qty : 0;
  const max = Math.min(product.stock, 10);
  if (already + qty > max) return `Можна додати не більше ${max} шт. цього товару`;
  if (line) line.qty += qty;
  else cart.push({ productId: product.id, qty });
  return null;
}

function setCartQty(cart, product, qty) {
  const max = Math.min(product.stock, 10);
  if (!Number.isInteger(qty) || qty < 0) return 'Некоректна кількість';
  if (qty > max) return `Доступно не більше ${max} шт.`;
  const idx = cart.findIndex((l) => l.productId === product.id);
  if (idx === -1) return 'Товару немає в кошику';
  if (qty === 0) cart.splice(idx, 1);
  else cart[idx].qty = qty;
  return null;
}

// Спільні змінні для всіх шаблонів
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.cartCount = getCart(req).reduce((s, l) => s + l.qty, 0);
  res.locals.flash = req.session.flash;
  req.session.flash = null;
  res.locals.categories = categories;
  res.locals.formatPrice = formatPrice;
  res.locals.formatDate = formatDate;
  res.locals.currentPath = req.path;
  res.locals.q = typeof req.query.q === 'string' ? req.query.q : '';
  next();
});

function requireAuth(req, res, next) {
  if (req.user) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Потрібна авторизація' });
  res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
}

// ---------- Каталог ----------

const SORTS = {
  popular: { label: 'За популярністю', fn: (a, b) => b.rating - a.rating || a.id - b.id },
  price_asc: { label: 'Від дешевих до дорогих', fn: (a, b) => a.price - b.price || a.id - b.id },
  price_desc: { label: 'Від дорогих до дешевих', fn: (a, b) => b.price - a.price || a.id - b.id },
  name_asc: { label: 'За назвою (А–Я)', fn: (a, b) => a.name.localeCompare(b.name, 'uk') },
  newest: { label: 'Новинки', fn: (a, b) => b.createdAt.localeCompare(a.createdAt) },
};

function queryProducts(query) {
  const asArray = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
  const f = {
    q: typeof query.q === 'string' ? query.q.trim() : '',
    category: typeof query.category === 'string' ? query.category : '',
    brands: asArray(query.brand).filter(Boolean),
    minPrice: query.minPrice !== undefined && query.minPrice !== '' ? Number(query.minPrice) : null,
    maxPrice: query.maxPrice !== undefined && query.maxPrice !== '' ? Number(query.maxPrice) : null,
    inStock: query.inStock === '1' || query.inStock === 'on' || query.inStock === 'true',
    onSale: query.onSale === '1' || query.onSale === 'on' || query.onSale === 'true',
    minRating: query.minRating ? Number(query.minRating) : null,
    sort: SORTS[query.sort] ? query.sort : 'popular',
    page: Math.max(1, parseInt(query.page, 10) || 1),
  };
  const errors = [];
  if (Number.isNaN(f.minPrice) || (f.minPrice !== null && f.minPrice < 0)) { errors.push('Мінімальна ціна має бути невід\'ємним числом'); f.minPrice = null; }
  if (Number.isNaN(f.maxPrice) || (f.maxPrice !== null && f.maxPrice < 0)) { errors.push('Максимальна ціна має бути невід\'ємним числом'); f.maxPrice = null; }
  if (f.minPrice !== null && f.maxPrice !== null && f.minPrice > f.maxPrice) {
    errors.push('Мінімальна ціна не може бути більшою за максимальну');
  }

  let list = db().products.slice();
  if (f.q) {
    const needle = f.q.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(needle) || p.brand.toLowerCase().includes(needle) || p.sku.toLowerCase() === needle);
  }
  if (f.category) list = list.filter((p) => p.category === f.category);
  // Бренди для фільтра рахуються після пошуку й категорії, але до решти фільтрів
  const availableBrands = [...new Set(list.map((p) => p.brand))].sort((a, b) => a.localeCompare(b, 'uk'));
  if (f.brands.length) list = list.filter((p) => f.brands.includes(p.brand));
  if (!errors.length) {
    if (f.minPrice !== null) list = list.filter((p) => p.price >= f.minPrice);
    if (f.maxPrice !== null) list = list.filter((p) => p.price <= f.maxPrice);
  }
  if (f.inStock) list = list.filter((p) => p.stock > 0);
  if (f.onSale) list = list.filter((p) => p.oldPrice);
  if (f.minRating) list = list.filter((p) => p.rating >= f.minRating);
  list.sort(SORTS[f.sort].fn);

  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  if (f.page > pages) f.page = pages;
  const items = list.slice((f.page - 1) * PER_PAGE, f.page * PER_PAGE);
  return { items, total, pages, page: f.page, filters: f, errors, availableBrands };
}

function pageUrl(query, page) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (k === 'page') continue;
    (Array.isArray(v) ? v : [v]).forEach((x) => x !== '' && params.append(k, x));
  }
  if (page > 1) params.set('page', page);
  const s = params.toString();
  return '/catalog' + (s ? '?' + s : '');
}

// ---------- Сторінки ----------

app.get('/', (req, res) => {
  const products = db().products;
  const sale = products.filter((p) => p.oldPrice && p.stock > 0).slice(0, 4);
  const top = products.slice().sort(SORTS.popular.fn).slice(0, 8);
  res.render('home', { title: 'Головна', sale, top });
});

app.get('/catalog', (req, res) => {
  const result = queryProducts(req.query);
  const category = categories.find((c) => c.slug === result.filters.category);
  res.render('catalog', {
    title: category ? category.name : 'Каталог',
    ...result,
    category,
    sorts: SORTS,
    pageUrl: (p) => pageUrl(req.query, p),
  });
});

app.get('/product/:id', (req, res) => {
  const product = findProduct(req.params.id);
  if (!product) return res.status(404).render('404', { title: 'Не знайдено' });
  const reviews = db().reviews.filter((r) => r.productId === product.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const related = db().products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const category = categories.find((c) => c.slug === product.category);
  const inCart = getCart(req).find((l) => l.productId === product.id);
  res.render('product', { title: product.name, product, reviews, related, category, inCartQty: inCart ? inCart.qty : 0, reviewErrors: {}, reviewForm: {} });
});

app.post('/product/:id/reviews', requireAuth, (req, res) => {
  const product = findProduct(req.params.id);
  if (!product) return res.status(404).render('404', { title: 'Не знайдено' });
  const rating = Number(req.body.rating);
  const text = (req.body.text || '').trim();
  const errors = {};
  if (!(rating >= 1 && rating <= 5)) errors.rating = 'Оберіть оцінку від 1 до 5';
  if (text.length < 10) errors.text = 'Відгук має містити щонайменше 10 символів';
  else if (text.length > 1000) errors.text = 'Відгук не може бути довшим за 1000 символів';
  if (Object.keys(errors).length) {
    const reviews = db().reviews.filter((r) => r.productId === product.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const related = db().products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
    const category = categories.find((c) => c.slug === product.category);
    return res.status(422).render('product', { title: product.name, product, reviews, related, category, inCartQty: 0, reviewErrors: errors, reviewForm: req.body, openTab: 'reviews' });
  }
  db().reviews.push({ id: nextId('review'), productId: product.id, author: req.user.name.split(' ')[0], rating, text, createdAt: new Date().toISOString() });
  save();
  setFlash(req, 'success', 'Дякуємо! Ваш відгук опубліковано');
  res.redirect(`/product/${product.id}#reviews`);
});

// ---------- Кошик ----------

app.get('/cart', (req, res) => {
  const summary = cartSummary(getCart(req), req.session.promo);
  res.render('cart', { title: 'Кошик', summary, promoInput: req.session.promo || '' });
});

app.post('/cart/add', (req, res) => {
  const product = findProduct(req.body.productId);
  if (!product) return res.status(404).render('404', { title: 'Не знайдено' });
  const err = addToCart(getCart(req), product, Number(req.body.qty || 1));
  if (err) setFlash(req, 'error', err);
  else { save(); setFlash(req, 'success', `«${product.name}» додано до кошика`); }
  res.redirect(safeNext(req.body.next) || '/cart');
});

app.post('/cart/update', (req, res) => {
  const product = findProduct(req.body.productId);
  if (product) {
    const err = setCartQty(getCart(req), product, Number(req.body.qty));
    if (err) setFlash(req, 'error', err);
    else save();
  }
  res.redirect('/cart');
});

app.post('/cart/remove', (req, res) => {
  const product = findProduct(req.body.productId);
  if (product) {
    setCartQty(getCart(req), product, 0);
    save();
    setFlash(req, 'info', `«${product.name}» видалено з кошика`);
  }
  res.redirect('/cart');
});

app.post('/cart/clear', (req, res) => {
  getCart(req).length = 0;
  req.session.promo = null;
  save();
  setFlash(req, 'info', 'Кошик очищено');
  res.redirect('/cart');
});

app.post('/cart/promo', (req, res) => {
  const code = (req.body.code || '').trim().toUpperCase();
  if (!code) {
    setFlash(req, 'error', 'Введіть промокод');
  } else {
    const { subtotal } = cartSummary(getCart(req));
    const err = validatePromo(code, subtotal);
    if (err) setFlash(req, 'error', err);
    else { req.session.promo = code; setFlash(req, 'success', `Промокод ${code} застосовано`); }
  }
  res.redirect('/cart');
});

app.post('/cart/promo/remove', (req, res) => {
  req.session.promo = null;
  setFlash(req, 'info', 'Промокод видалено');
  res.redirect('/cart');
});

// ---------- Оформлення замовлення ----------

function luhn(num) {
  let sum = 0;
  let dbl = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i]);
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

function validateCheckout(body) {
  const errors = {};
  const v = (k) => (body[k] || '').trim();
  if (v('name').length < 2) errors.name = 'Вкажіть ім\'я та прізвище';
  if (!EMAIL_RE.test(v('email'))) errors.email = 'Вкажіть коректний email';
  if (!PHONE_RE.test(v('phone').replace(/[\s()-]/g, ''))) errors.phone = 'Телефон у форматі +380XXXXXXXXX';
  if (!DELIVERY[v('delivery')]) errors.delivery = 'Оберіть спосіб доставки';
  if (v('delivery') === 'courier') {
    if (!v('city')) errors.city = 'Вкажіть місто';
    if (v('address').length < 5) errors.address = 'Вкажіть адресу доставки';
  }
  if (v('delivery') === 'post') {
    if (!v('city')) errors.city = 'Вкажіть місто';
    if (!/^\d{1,5}$/.test(v('postOffice'))) errors.postOffice = 'Вкажіть номер відділення';
  }
  if (v('delivery') === 'pickup' && !STORES.includes(v('store'))) errors.store = 'Оберіть магазин';
  if (!['card', 'cash'].includes(v('payment'))) errors.payment = 'Оберіть спосіб оплати';
  if (v('payment') === 'card') {
    const num = v('cardNumber').replace(/\s/g, '');
    if (!/^\d{16}$/.test(num) || !luhn(num)) errors.cardNumber = 'Некоректний номер картки';
    const m = v('cardExpiry').match(/^(\d{2})\/(\d{2})$/);
    if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) errors.cardExpiry = 'Термін дії у форматі ММ/РР';
    else {
      const now = new Date();
      const exp = new Date(2000 + Number(m[2]), Number(m[1]), 1); // перший день наступного місяця
      if (exp <= now) errors.cardExpiry = 'Термін дії картки минув';
    }
    if (!/^\d{3}$/.test(v('cardCvv'))) errors.cardCvv = 'CVV — 3 цифри';
  }
  if (v('comment').length > 500) errors.comment = 'Коментар не довший за 500 символів';
  if (!body.terms) errors.terms = 'Потрібно погодитися з умовами';
  return errors;
}

function renderCheckout(req, res, form, errors, status = 200) {
  const summary = cartSummary(getCart(req), req.session.promo, form.delivery || 'courier');
  res.status(status).render('checkout', { title: 'Оформлення замовлення', summary, form, errors, DELIVERY, STORES, FREE_SHIPPING_FROM });
}

app.get('/checkout', (req, res) => {
  if (!getCart(req).length) {
    setFlash(req, 'error', 'Кошик порожній');
    return res.redirect('/cart');
  }
  const u = req.user;
  renderCheckout(req, res, { name: u ? u.name : '', email: u ? u.email : '', phone: u ? u.phone : '', delivery: 'courier', payment: 'card' }, {});
});

app.post('/checkout', async (req, res) => {
  const cart = getCart(req);
  if (!cart.length) {
    setFlash(req, 'error', 'Кошик порожній');
    return res.redirect('/cart');
  }
  const form = req.body;
  const errors = validateCheckout(form);
  if (Object.keys(errors).length) return renderCheckout(req, res, form, errors, 422);

  // Перевірка залишків на момент оформлення
  for (const line of cart) {
    const p = findProduct(line.productId);
    if (!p || p.stock < line.qty) {
      return renderCheckout(req, res, form, { _form: `Товару «${p ? p.name : line.productId}» недостатньо на складі (доступно ${p ? p.stock : 0})` }, 409);
    }
  }
  // "Банк" обробляє платіж
  await sleep(LATENCY_MS * 2);
  const cardNum = (form.cardNumber || '').replace(/\s/g, '');
  if (form.payment === 'card' && cardNum === '4000000000000002') {
    return renderCheckout(req, res, form, { _form: 'Платіж відхилено банком. Спробуйте іншу картку.' }, 402);
  }

  const summary = cartSummary(cart, req.session.promo, form.delivery);
  const order = {
    id: nextId('order'),
    userId: req.user ? req.user.id : null,
    status: 'Нове',
    createdAt: new Date().toISOString(),
    items: summary.items.map((i) => ({ productId: i.product.id, name: i.product.name, price: i.product.price, qty: i.qty })),
    customer: {
      name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
      city: (form.city || '').trim(), address: (form.address || '').trim(),
      postOffice: (form.postOffice || '').trim(), store: form.delivery === 'pickup' ? form.store : '',
    },
    delivery: form.delivery,
    payment: form.payment,
    cardLast4: form.payment === 'card' ? cardNum.slice(-4) : null,
    comment: (form.comment || '').trim(),
    promo: summary.promo ? summary.promo.code : null,
    subtotal: summary.subtotal,
    discount: summary.discount,
    shipping: summary.shipping,
    total: summary.total,
  };
  summary.items.forEach((i) => { i.product.stock -= i.qty; });
  db().orders.push(order);
  cart.length = 0;
  req.session.promo = null;
  req.session.orderIds.push(order.id);
  save();
  res.redirect(`/order/${order.id}/success`);
});

function canSeeOrder(req, order) {
  return order && ((req.user && order.userId === req.user.id) || req.session.orderIds.includes(order.id));
}

app.get('/order/:id/success', (req, res) => {
  const order = db().orders.find((o) => o.id === Number(req.params.id));
  if (!canSeeOrder(req, order)) return res.status(404).render('404', { title: 'Не знайдено' });
  res.render('order-success', { title: 'Замовлення оформлено', order, DELIVERY });
});

// ---------- Авторизація ----------

app.get('/login', (req, res) => {
  if (req.user) return res.redirect('/account');
  res.render('login', { title: 'Вхід', form: { next: req.query.next || '' }, errors: {} });
});

function mergeGuestCart(req, user) {
  for (const line of req.session.cart) {
    const p = findProduct(line.productId);
    if (!p) continue;
    const existing = user.cart.find((l) => l.productId === p.id);
    const max = Math.min(p.stock, 10);
    if (existing) existing.qty = Math.min(max, existing.qty + line.qty);
    else user.cart.push({ productId: p.id, qty: Math.min(max, line.qty) });
  }
  req.session.cart = [];
}

function authenticate(email, password) {
  const errors = {};
  email = (email || '').trim().toLowerCase();
  if (!email) errors.email = 'Введіть email';
  if (!password) errors.password = 'Введіть пароль';
  if (Object.keys(errors).length) return { errors };
  const user = db().users.find((u) => u.email === email);
  if (!user || user.password !== hashPassword(password)) return { errors: { _form: 'Невірний email або пароль' } };
  if (user.locked) return { errors: { _form: 'Обліковий запис заблоковано. Зверніться до служби підтримки.' } };
  return { user };
}

app.post('/login', async (req, res) => {
  await sleep(LATENCY_MS);
  const { user, errors } = authenticate(req.body.email, req.body.password);
  if (errors) return res.status(401).render('login', { title: 'Вхід', form: req.body, errors });
  mergeGuestCart(req, user);
  req.session.userId = user.id;
  save();
  setFlash(req, 'success', `Вітаємо, ${user.name}!`);
  res.redirect(safeNext(req.body.next) || '/account');
});

app.post('/logout', (req, res) => {
  req.session.userId = null;
  req.session.promo = null;
  setFlash(req, 'info', 'Ви вийшли з облікового запису');
  res.redirect('/');
});

app.get('/register', (req, res) => {
  if (req.user) return res.redirect('/account');
  res.render('register', { title: 'Реєстрація', form: {}, errors: {} });
});

app.post('/register', (req, res) => {
  const b = req.body;
  const name = (b.name || '').trim();
  const email = (b.email || '').trim().toLowerCase();
  const errors = {};
  if (name.length < 2) errors.name = 'Ім\'я має містити щонайменше 2 символи';
  if (!EMAIL_RE.test(email)) errors.email = 'Вкажіть коректний email';
  else if (db().users.some((u) => u.email === email)) errors.email = 'Користувач з таким email вже існує';
  if (b.phone && !PHONE_RE.test(b.phone.trim())) errors.phone = 'Телефон у форматі +380XXXXXXXXX';
  const pw = b.password || '';
  if (pw.length < 8 || !/[A-Za-zА-Яа-яІіЇїЄєҐґ]/.test(pw) || !/\d/.test(pw)) errors.password = 'Пароль: мінімум 8 символів, літери та цифри';
  if (pw !== b.confirmPassword) errors.confirmPassword = 'Паролі не збігаються';
  if (!b.terms) errors.terms = 'Потрібно погодитися з умовами';
  if (Object.keys(errors).length) return res.status(422).render('register', { title: 'Реєстрація', form: b, errors });

  const user = {
    id: nextId('user'), name, email, phone: (b.phone || '').trim(), password: hashPassword(pw),
    locked: false, cart: [], newsletter: !!b.newsletter, createdAt: new Date().toISOString(),
  };
  db().users.push(user);
  mergeGuestCart(req, user);
  req.session.userId = user.id;
  save();
  setFlash(req, 'success', 'Реєстрація успішна! Ласкаво просимо.');
  res.redirect('/account');
});

// ---------- Особистий кабінет ----------

app.get('/account', requireAuth, (req, res) => {
  res.render('account', { title: 'Особистий кабінет', form: req.user, errors: {} });
});

app.post('/account', requireAuth, (req, res) => {
  const name = (req.body.name || '').trim();
  const phone = (req.body.phone || '').trim();
  const errors = {};
  if (name.length < 2) errors.name = 'Ім\'я має містити щонайменше 2 символи';
  if (phone && !PHONE_RE.test(phone)) errors.phone = 'Телефон у форматі +380XXXXXXXXX';
  if (Object.keys(errors).length) return res.status(422).render('account', { title: 'Особистий кабінет', form: { ...req.user, ...req.body }, errors });
  req.user.name = name;
  req.user.phone = phone;
  save();
  setFlash(req, 'success', 'Дані профілю збережено');
  res.redirect('/account');
});

app.get('/account/orders', requireAuth, (req, res) => {
  const orders = db().orders.filter((o) => o.userId === req.user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.render('orders', { title: 'Мої замовлення', orders });
});

app.get('/account/orders/:id', requireAuth, (req, res) => {
  const order = db().orders.find((o) => o.id === Number(req.params.id) && o.userId === req.user.id);
  if (!order) return res.status(404).render('404', { title: 'Не знайдено' });
  res.render('order', { title: `Замовлення №${order.id}`, order, DELIVERY });
});

app.post('/account/orders/:id/cancel', requireAuth, (req, res) => {
  const order = db().orders.find((o) => o.id === Number(req.params.id) && o.userId === req.user.id);
  if (!order) return res.status(404).render('404', { title: 'Не знайдено' });
  if (order.status !== 'Нове') {
    setFlash(req, 'error', 'Це замовлення вже не можна скасувати');
  } else {
    order.status = 'Скасовано';
    order.items.forEach((i) => { const p = findProduct(i.productId); if (p) p.stock += i.qty; });
    save();
    setFlash(req, 'success', `Замовлення №${order.id} скасовано`);
  }
  res.redirect(`/account/orders/${order.id}`);
});

// ---------- JSON API (для API-тестів і швидкого налаштування стану) ----------

app.get('/api/products', (req, res) => {
  const { items, total, pages, page, errors } = queryProducts(req.query);
  if (errors.length) return res.status(400).json({ errors });
  res.json({ items, total, page, pages, perPage: PER_PAGE });
});

app.get('/api/products/:id', (req, res) => {
  const product = findProduct(req.params.id);
  if (!product) return res.status(404).json({ error: 'Товар не знайдено' });
  res.json(product);
});

app.get('/api/categories', (req, res) => res.json(categories));

function cartJson(req) {
  const s = cartSummary(getCart(req), req.session.promo);
  return {
    items: s.items.map((i) => ({ productId: i.product.id, name: i.product.name, price: i.product.price, qty: i.qty, lineTotal: i.lineTotal })),
    count: s.count, subtotal: s.subtotal, discount: s.discount, promo: s.promo ? s.promo.code : null, total: s.total,
  };
}

app.get('/api/cart', (req, res) => res.json(cartJson(req)));

app.post('/api/cart', async (req, res) => {
  await sleep(LATENCY_MS);
  const product = findProduct(req.body.productId);
  if (!product) return res.status(404).json({ error: 'Товар не знайдено' });
  const err = addToCart(getCart(req), product, Number(req.body.qty ?? 1));
  if (err) return res.status(400).json({ error: err });
  save();
  res.status(201).json({ message: `«${product.name}» додано до кошика`, cart: cartJson(req) });
});

app.patch('/api/cart/:productId', async (req, res) => {
  await sleep(LATENCY_MS);
  const product = findProduct(req.params.productId);
  if (!product) return res.status(404).json({ error: 'Товар не знайдено' });
  const err = setCartQty(getCart(req), product, Number(req.body.qty));
  if (err) return res.status(400).json({ error: err });
  save();
  res.json({ cart: cartJson(req) });
});

app.delete('/api/cart/:productId', (req, res) => {
  const product = findProduct(req.params.productId);
  if (!product) return res.status(404).json({ error: 'Товар не знайдено' });
  setCartQty(getCart(req), product, 0);
  save();
  res.json({ cart: cartJson(req) });
});

app.post('/api/login', (req, res) => {
  const { user, errors } = authenticate(req.body.email, req.body.password);
  if (errors) return res.status(401).json({ errors });
  mergeGuestCart(req, user);
  req.session.userId = user.id;
  save();
  res.json({ id: user.id, name: user.name, email: user.email });
});

app.post('/api/logout', (req, res) => {
  req.session.userId = null;
  res.status(204).end();
});

app.get('/api/me', requireAuth, (req, res) => {
  const { id, name, email, phone } = req.user;
  res.json({ id, name, email, phone });
});

app.get('/api/orders', requireAuth, (req, res) => {
  res.json(db().orders.filter((o) => o.userId === req.user.id));
});

// Скидання бази до початкового стану (виклик у beforeEach / globalSetup)
app.post('/api/test/reset', (req, res) => {
  reset();
  sessions.clear();
  res.json({ ok: true });
});

// ---------- Зображення-заглушки ----------

app.get('/img/product/:id.svg', (req, res) => {
  const p = findProduct(req.params.id);
  const cat = p ? categories.find((c) => c.slug === p.category) : null;
  const color = cat ? cat.color : '#94a3b8';
  const label = p ? p.brand : '?';
  const icon = { electronics: '📱', clothing: '👕', home: '🏠', books: '📚', sport: '⚽' }[p && p.category] || '📦';
  res.type('image/svg+xml').send(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
<rect width="400" height="300" fill="${color}" opacity="0.15"/><text x="200" y="150" font-size="96" text-anchor="middle">${icon}</text>
<text x="200" y="230" font-family="sans-serif" font-size="24" fill="${color}" text-anchor="middle">${label.replace(/[<&>]/g, '')}</text></svg>`);
});

app.get(['/about', '/delivery', '/contacts'], (req, res) => {
  const titles = { '/about': 'Про нас', '/delivery': 'Доставка і оплата', '/contacts': 'Контакти' };
  res.render('info', { title: titles[req.path], page: req.path.slice(1), DELIVERY, FREE_SHIPPING_FROM, STORES });
});

app.use((req, res) => res.status(404).render('404', { title: 'Сторінку не знайдено' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Внутрішня помилка сервера');
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Demo Shop запущено: http://localhost:${PORT}`));
}

module.exports = app;
