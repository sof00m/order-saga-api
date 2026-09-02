const db = require('../../db/database');
const orchestrator = require('../../saga/orchestrator');

async function advanceOrder(orderId, { fail = false }, user) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
  if (order.user_id !== user.id) throw Object.assign(new Error('Forbidden'), { status: 403 });

  if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
    throw Object.assign(new Error(`Order is already ${order.status}`), { status: 400 });
  }

  return orchestrator.advance(orderId, fail);
}

module.exports = advanceOrder;
