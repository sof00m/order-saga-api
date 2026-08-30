// Input: orderId (string), user (from req.user)
// Output: order object with its saga_steps array

const db = require('../../db/database');

async function getOrder(orderId, user) {
  // Fetch the order.
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    throw Object.assign(new Error('Order not found'), { status: 404 })
  }

  // Authorization check. users should only see their own orders.
  if (order.user_id !== user.id) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  // Fetch all saga steps for this order, ordered by execution time.
  const steps = db.prepare(
    'SELECT * FROM saga_steps WHERE order_id = ? ORDER BY executed_at ASC'
  ).all(orderId);

  // Return order with parsed items and steps.
  return { ...order, items: JSON.parse(order.items), saga_steps: steps };
}

module.exports = getOrder;
