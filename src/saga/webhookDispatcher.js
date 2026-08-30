// Called by the orchestrator every time an order changes state.
// Finds all subscribers interested in that event and attempts delivery.
// On failure, records retry info using exponential backoff.

const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

function dispatch(orderId, event, payload) {
  // Find all subscriptions that include this event
  const subscriptions = db.prepare(
    'SELECT * FROM webhook_subscriptions WHERE events LIKE ?'
  ).all(`%${event}%`);

  for (const sub of subscriptions) {
    const deliveryId = uuidv4();
    db.prepare(`
      INSERT INTO webhook_deliveries (id, subscription_id, order_id, event, payload, status, attempts)
      VALUES (?, ?, ?, ?, ?, 'PENDING', 0)
    `).run(deliveryId, sub.id, orderId, event, JSON.stringify(payload));

    // Fire-and-forget: attempt delivery immediately, don't block the saga
    deliver(deliveryId, sub.url).catch(() => { });
  }
}

// Attempts to deliver a webhook payload via HTTP POST.
// On success: mark DELIVERED. On failure: schedule retry with exponential backoff.
async function deliver(deliveryId, url) {
  const delivery = db.prepare('SELECT * FROM webhook_deliveries WHERE id = ?').get(deliveryId);
  if (!delivery) return;

  try {
    // POST the payload to the subscriber's URL.
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: delivery.payload,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    // On success, mark as DELIVERED.
    db.prepare(`
        UPDATE webhook_deliveries
        SET status = 'DELIVERED', attempts = attempts + 1
        WHERE id = ?
      `).run(deliveryId);

  } catch (err) {
    // On failure, increment attempts and schedule a retry.
    // Exponential backoff: wait 30s, 60s, 120s, 240s before each retry.
    // Formula: delay = 2^attempts * 30 seconds.
    // Max 4 attempts, then mark as FAILED (no more retries).

    const newAttempts = (delivery.attempts || 0) + 1;
    const isFinal = newAttempts >= 4;
    const delaySeconds = Math.pow(2, newAttempts) * 30;
    const nextRetry = isFinal ? null : `datetime('now', '+${delaySeconds} seconds')`;

    db.prepare(`
        UPDATE webhook_deliveries
        SET attempts = ?, status = ?, next_retry_at = ${nextRetry ? nextRetry : 'NULL'}
        WHERE id = ?
      `).run(newAttempts, isFinal ? 'FAILED' : 'PENDING', deliveryId);
  }
}

module.exports = { dispatch, deliver };
