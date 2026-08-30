// Input: { items: [{ name, qty, price }] } + req.user (from auth middleware)
// Output: the newly created order object

const { v4: uuidv4 } = require('uuid');
const db = require('../../db/database');

async function createOrder({ items }, user) {
  if (!Array.isArray(items) || items.length === 0) {
    throw Object.assign(new Error('items must be a non-empty array'), { status: 400 });
  }

  // Validate each item has name, qty, and price.
  items.forEach(item => {
    if (!item.name || !item.qty || !item.price) {
      throw Object.assign(new Error('item dont have correct data'), { status: 400 });
    }
  });

  // Insert the order. Status starts as 'PENDING' (the saga hasn't started yet).
  const id = uuidv4();
  db.prepare(`
      INSERT INTO orders (id, user_id, items, status)
      VALUES (?, ?, ?, 'PENDING')
    `).run(id, user.id, JSON.stringify(items));
  // items is stored as a JSON string because SQLite has no array type.

  // Return the order from the database (re-read it so the response is consistent).
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  return { ...order, items: JSON.parse(order.items), saga_steps: [] };
}

module.exports = createOrder;
