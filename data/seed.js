// Початкові дані магазину. Після `npm run reset` або POST /api/test/reset
// база повертається саме до цього стану, тож тести можуть на нього покладатися.

const categories = [
  { slug: 'electronics', name: 'Електроніка', color: '#3b82f6' },
  { slug: 'clothing', name: 'Одяг', color: '#ec4899' },
  { slug: 'home', name: 'Дім і кухня', color: '#f59e0b' },
  { slug: 'books', name: 'Книги', color: '#10b981' },
  { slug: 'sport', name: 'Спорт', color: '#8b5cf6' },
];

// [назва, бренд, ціна, стара ціна | null, рейтинг, залишок]
const raw = {
  electronics: [
    ['Смартфон Nova X1 128 ГБ', 'Nova', 12999, 14999, 4.6, 15],
    ['Смартфон Nova X1 Pro 256 ГБ', 'Nova', 18999, null, 4.8, 7],
    ['Навушники бездротові AirBeat', 'SoundMax', 2499, 2999, 4.3, 40],
    ['Навушники накладні Studio 500', 'SoundMax', 3899, null, 4.5, 0],
    ['Ноутбук Volt 14" i5/16/512', 'Volt', 32999, 35999, 4.7, 5],
    ['Ноутбук Volt 16" i7/32/1TB', 'Volt', 51999, null, 4.9, 2],
    ['Планшет Nova Tab 11"', 'Nova', 10499, null, 4.2, 12],
    ['Розумний годинник Pulse 3', 'Pulse', 4599, 5299, 4.1, 25],
    ['Павербанк 20000 мА·год', 'Volt', 1199, null, 4.4, 60],
    ['Колонка портативна BoomGo', 'SoundMax', 1799, null, 3.9, 18],
  ],
  clothing: [
    ['Футболка бавовняна базова', 'UrbanWear', 399, null, 4.2, 100],
    ['Худі оверсайз чорне', 'UrbanWear', 1299, 1599, 4.6, 30],
    ['Джинси slim fit', 'DenimCo', 1499, null, 4.0, 22],
    ['Куртка демісезонна', 'NorthLine', 3299, 3999, 4.7, 8],
    ['Кросівки повсякденні', 'Stride', 2599, null, 4.5, 14],
    ['Шкарпетки (набір 5 пар)', 'UrbanWear', 249, null, 4.8, 200],
    ['Сорочка лляна', 'DenimCo', 1099, null, 3.8, 0],
    ['Шапка в\'язана', 'NorthLine', 449, 599, 4.3, 45],
    ['Сукня літня', 'UrbanWear', 1399, null, 4.4, 10],
    ['Пуховик зимовий', 'NorthLine', 5999, 7499, 4.9, 3],
  ],
  home: [
    ['Кавоварка рожкова Barista', 'HomePro', 6499, 7299, 4.5, 9],
    ['Чайник електричний 1.7 л', 'HomePro', 899, null, 4.1, 50],
    ['Набір каструль 6 предметів', 'ChefLine', 2799, null, 4.6, 11],
    ['Пилосос робот CleanBot', 'CleanBot', 8999, 10999, 4.4, 6],
    ['Ковдра двоспальна', 'SoftHome', 1599, null, 4.7, 20],
    ['Настільна лампа LED', 'LightUp', 749, null, 4.0, 35],
    ['Блендер занурювальний', 'ChefLine', 1299, 1499, 4.2, 0],
    ['Набір ножів 5 шт.', 'ChefLine', 1899, null, 4.8, 16],
    ['Подушка ортопедична', 'SoftHome', 999, null, 4.3, 28],
    ['Мультиварка 5 л', 'HomePro', 2999, null, 3.7, 4],
  ],
  books: [
    ['Чиста архітектура', 'Видавництво А', 549, null, 4.9, 30],
    ['JavaScript: детальний посібник', 'Видавництво Б', 899, 999, 4.7, 12],
    ['Тестування програмного забезпечення', 'Видавництво А', 649, null, 4.6, 25],
    ['Мистецтво автоматизації тестів', 'Видавництво Б', 729, null, 4.8, 0],
    ['Кобзар', 'Класика', 399, null, 5.0, 50],
    ['Тигролови', 'Класика', 299, null, 4.8, 40],
    ['Атомні звички', 'Видавництво А', 459, 529, 4.7, 60],
    ['Дюна', 'Фантастика UA', 699, null, 4.9, 15],
    ['Гаррі Поттер і філософський камінь', 'Фантастика UA', 499, null, 4.9, 33],
    ['Алгоритми для початківців', 'Видавництво Б', 589, null, 4.3, 9],
  ],
  sport: [
    ['Килимок для йоги 6 мм', 'FitLife', 699, null, 4.5, 40],
    ['Гантелі розбірні 2×10 кг', 'IronGym', 2499, 2899, 4.6, 7],
    ['Велосипед гірський 29"', 'TrailMax', 15999, 17999, 4.7, 3],
    ['М\'яч футбольний', 'Kickoff', 799, null, 4.4, 25],
    ['Скакалка швидкісна', 'FitLife', 249, null, 4.1, 80],
    ['Фітнес-браслет Pulse Band', 'Pulse', 1499, null, 4.0, 0],
    ['Рюкзак туристичний 40 л', 'TrailMax', 2199, null, 4.8, 13],
    ['Пляшка для води 750 мл', 'FitLife', 349, 399, 4.3, 90],
    ['Ракетка для бадмінтону (пара)', 'Kickoff', 999, null, 3.9, 17],
    ['Еспандер еластичний набір', 'IronGym', 549, null, 4.5, 34],
  ],
};

const products = [];
let id = 1;
for (const [category, items] of Object.entries(raw)) {
  for (const [name, brand, price, oldPrice, rating, stock] of items) {
    const catName = categories.find((c) => c.slug === category).name;
    products.push({
      id: id,
      sku: `SKU-${String(id).padStart(4, '0')}`,
      name,
      brand,
      category,
      price,
      oldPrice,
      rating,
      stock,
      description: `${name} від бренду ${brand}. Якісний товар з категорії «${catName}» з гарантією 12 місяців та доставкою по всій Україні.`,
      specs: {
        'Бренд': brand,
        'Артикул': `SKU-${String(id).padStart(4, '0')}`,
        'Гарантія': '12 місяців',
        'Країна виробництва': ['Україна', 'Польща', 'Китай', 'Німеччина'][id % 4],
      },
      createdAt: new Date(Date.UTC(2026, 0, 1 + id)).toISOString(),
    });
    id++;
  }
}

// Паролі зберігаються у відкритому вигляді лише тут, у базі вони хешуються.
const users = [
  { id: 1, name: 'Тестовий Користувач', email: 'user@shop.test', password: 'Password123', phone: '+380501234567', locked: false },
  { id: 2, name: 'Заблокований Користувач', email: 'locked@shop.test', password: 'Password123', phone: '', locked: true },
  { id: 3, name: 'Покупець З Історією', email: 'buyer@shop.test', password: 'Password123', phone: '+380671112233', locked: false },
];

const reviews = [
  { id: 1, productId: 1, author: 'Олена', rating: 5, text: 'Чудовий смартфон, батарея тримає два дні.', createdAt: '2026-03-02T10:00:00.000Z' },
  { id: 2, productId: 1, author: 'Максим', rating: 4, text: 'Гарний екран, але камера могла б бути кращою.', createdAt: '2026-03-10T10:00:00.000Z' },
  { id: 3, productId: 31, author: 'Ірина', rating: 5, text: 'Must read для кожного розробника.', createdAt: '2026-04-01T10:00:00.000Z' },
];

// Користувач buyer@shop.test одразу має два замовлення для тестів історії.
const orders = [
  {
    id: 1001, userId: 3, status: 'Доставлено', createdAt: '2026-05-12T09:30:00.000Z',
    items: [{ productId: 31, name: 'Чиста архітектура', price: 549, qty: 2 }],
    customer: { name: 'Покупець З Історією', email: 'buyer@shop.test', phone: '+380671112233', city: 'Київ', address: 'вул. Хрещатик, 1', zip: '01001' },
    delivery: 'courier', payment: 'card', promo: null,
    subtotal: 1098, discount: 0, shipping: 100, total: 1198,
  },
  {
    id: 1002, userId: 3, status: 'Нове', createdAt: '2026-09-20T14:05:00.000Z',
    items: [{ productId: 41, name: 'Килимок для йоги 6 мм', price: 699, qty: 1 }, { productId: 48, name: 'Пляшка для води 750 мл', price: 349, qty: 2 }],
    customer: { name: 'Покупець З Історією', email: 'buyer@shop.test', phone: '+380671112233', city: 'Львів', address: 'пл. Ринок, 10', zip: '79000' },
    delivery: 'post', payment: 'cash', promo: null,
    subtotal: 1397, discount: 0, shipping: 60, total: 1457,
  },
];

module.exports = { categories, products, users, reviews, orders };
