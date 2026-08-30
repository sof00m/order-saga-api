// The heart of the project.
// Implements the Saga pattern: each order moves through steps sequentially.
// If any step fails, the orchestrator runs compensation (rollback) in reverse order.

const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const webhookDispatcher = require('./webhookDispatcher');

// The 3 saga steps in order. Each successful step maps to an order status.
const STEPS = ['payment', 'inventory', 'shipping'];

const STEP_TO_STATUS = {
  payment: 'PAYMENT_OK',
  inventory: 'RESERVED',
  shipping: 'SHIPPED',
};

// Returns the index of the last completed step (-1 = not started yet)
function getCurrentStepIndex(orderStatus) {
  const map = {
    PENDING: -1,
    PAYMENT_OK: 0,
    RESERVED: 1,
    SHIPPED: 2,
    DELIVERED: 3,
  };
  return map[orderStatus] ?? -1;
}

// Advance the saga forward (or trigger compensation if fail=true)
function advance(orderId, fail = false) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });

  if (fail) {
    return compensate(order);
  }

  const nextStepIndex = getCurrentStepIndex(order.status) + 1;

  // All steps done — mark as DELIVERED
  if (nextStepIndex >= STEPS.length) {
    db.prepare(`UPDATE orders SET status = 'DELIVERED', updated_at = datetime('now') WHERE id = ?`).run(orderId);
    webhookDispatcher.dispatch(orderId, 'order.delivered', { orderId, status: 'DELIVERED' });
    return fetchWithSteps(orderId);
  }

  const stepName = STEPS[nextStepIndex];
  const newStatus = STEP_TO_STATUS[stepName];

  // Record the completed step in saga_steps (this is the audit log)
  db.prepare(`
    INSERT INTO saga_steps (id, order_id, step_name, status, executed_at)
    VALUES (?, ?, ?, 'COMPLETED', datetime('now'))
  `).run(uuidv4(), orderId, stepName);

  db.prepare(`UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(newStatus, orderId);

  webhookDispatcher.dispatch(orderId, `order.${stepName}_completed`, { orderId, status: newStatus });

  return fetchWithSteps(orderId);
}

// Runs compensation: marks all completed steps as COMPENSATED (in reverse), sets order to CANCELLED
function compensate(order) {
  db.prepare(`UPDATE orders SET status = 'COMPENSATING', updated_at = datetime('now') WHERE id = ?`).run(order.id);

  // Fetch completed steps in reverse order (most recent first)
  const completedSteps = db.prepare(`
    SELECT * FROM saga_steps WHERE order_id = ? AND status = 'COMPLETED' ORDER BY executed_at DESC
  `).all(order.id);

  for (const step of completedSteps) {
    db.prepare(`
      UPDATE saga_steps SET status = 'COMPENSATED', compensated_at = datetime('now') WHERE id = ?
    `).run(step.id);
  }

  db.prepare(`UPDATE orders SET status = 'CANCELLED', updated_at = datetime('now') WHERE id = ?`).run(order.id);

  webhookDispatcher.dispatch(order.id, 'order.cancelled', { orderId: order.id, status: 'CANCELLED' });

  return fetchWithSteps(order.id);
}

function fetchWithSteps(orderId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const steps = db.prepare('SELECT * FROM saga_steps WHERE order_id = ? ORDER BY executed_at ASC').all(orderId);
  return { ...order, items: JSON.parse(order.items), saga_steps: steps };
}

module.exports = { advance };
