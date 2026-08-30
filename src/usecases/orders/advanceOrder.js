// Input: orderId, { fail: boolean }, user
// Output: updated order with saga_steps

// This delegates the real logic to the saga orchestrator.
// Your job here is: validate, authorize, call orchestrator, return result.

const db = require('../../db/database');
const orchestrator = require('../../saga/orchestrator');

async function advanceOrder(orderId, { fail = false }, user) {
  // Fetch the order and verify it belongs to this user (same as getOrder).
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    throw Object.assign(new Error('Order not found'), { status: 404 });
  }

  if (order.user_id !== user.id) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }

  // Block advancement on terminal states.
  if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
    throw Object.assign(new Error(`Order is already ${order.status}`), { status: 400 });
  }

  // Call the orchestrator. It handles all the saga logic.
  return orchestrator.advance(orderId, fail);
}

module.exports = advanceOrder;
