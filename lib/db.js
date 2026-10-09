// Проста файлова "база даних": весь стан тримається в пам'яті й
// зберігається в data/db.json після кожної зміни.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const seed = require('../data/seed');

const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'db.json');

let state = null;

function hashPassword(password) {
  return crypto.createHash('sha256').update('demo-shop:' + password).digest('hex');
}

function fresh() {
  const clone = (x) => JSON.parse(JSON.stringify(x));
  return {
    products: clone(seed.products),
    users: seed.users.map((u) => ({ ...u, password: hashPassword(u.password), cart: [], createdAt: '2026-01-01T00:00:00.000Z' })),
    reviews: clone(seed.reviews),
    orders: clone(seed.orders),
    nextIds: { user: seed.users.length + 1, order: 1003, review: seed.reviews.length + 1 },
  };
}

function load() {
  try {
    state = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    state = fresh();
    save();
  }
  return state;
}

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
}

function reset() {
  state = fresh();
  save();
  return state;
}

function db() {
  return state || load();
}

function nextId(kind) {
  const s = db();
  return s.nextIds[kind]++;
}

module.exports = { db, save, reset, nextId, hashPassword, categories: seed.categories };
