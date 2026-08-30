// Input: { url, events: ['order.payment_completed', 'order.cancelled', ...] }, user
// Output: the created subscription

const { v4: uuidv4 } = require('uuid');
const db = require('../../db/database');

async function registerWebhook({ url, events }, user) {
  // Validate url and events are present.
  if (!url || !Array.isArray(events) || events.length === 0) {
    throw Object.assign(new Error('url and events are required'), { status: 400 });
  }

  // Validate the url format.
  try {
    new URL(url)
  } catch {
    throw Object.assign(new Error('not the right format'), { status: 400 });
  }

  // Insert the subscription.
  const id = uuidv4();
  db.prepare(`
      INSERT INTO webhook_subscriptions (id, user_id, url, events) VALUES (?, ?, ?, ?)
    `).run(id, user.id, url, JSON.stringify(events));
  // events stored as JSON string, same pattern as items in orders.

  // Return the created subscription.
  const sub = db.prepare('SELECT * FROM webhook_subscriptions WHERE id = ?').get(id);
  return { ...sub, events: JSON.parse(sub.events) };
}

module.exports = registerWebhook;
