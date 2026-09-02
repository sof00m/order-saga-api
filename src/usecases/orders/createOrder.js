const { v4: uuidv4 } = require('uuid');
const db = require('../../db/database');

async function createOrder({ items }, user) {
  if (!Array.isArray(items) || items.length === 0) {
    throw Object.assign(new Error('items must be a non-empty array'), { status: 400 });
  }

  items.forEach(item => {
    if (!item.name || !item.qty || !item.price) {
      throw Object.assign(new Error('Each item requires name, qty and price'), { status: 400 });
    }
  });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO orders (id, user_id, items, status)
    VALUES (?, ?, ?, 'PENDING')
  `).run(id, user.id, JSON.stringify(items));

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  return { ...order, items: JSON.parse(order.items), saga_steps: [] };
}

module.exports = createOrder;
