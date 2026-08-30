// Input: orderId, user
// Output: { orderId, status, timeline: [ saga steps in chronological order ] }

// "Timeline" = the full audit log. Shows what happened, when, and whether it was compensated.

const db = require('../../db/database');

async function getTimeline(orderId, user) {
  // Fetch the order and verify ownership (same pattern as getOrder).
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    throw Object.assign(new Error('Order not found'), { status: 404 });
  }

  if (order.user_id !== user.id) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }

  // Fetch all saga steps for this order, ordered chronologically.
  const steps = db.prepare(
    'SELECT * FROM saga_steps WHERE order_id = ? ORDER BY executed_at ASC'
  ).all(orderId);

  // Return a clean response object.
  return {
    orderId,
    currentStatus: order.status,
    createdAt: order.created_at,
    timeline: steps,
  };
}

module.exports = getTimeline;
