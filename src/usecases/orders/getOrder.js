const db = require('../../db/database');

async function getOrder(orderId, user) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
  if (order.user_id !== user.id) throw Object.assign(new Error('Forbidden'), { status: 403 });

  const steps = db.prepare(
    'SELECT * FROM saga_steps WHERE order_id = ? ORDER BY executed_at ASC'
  ).all(orderId);

  return { ...order, items: JSON.parse(order.items), saga_steps: steps };
}

module.exports = getOrder;
