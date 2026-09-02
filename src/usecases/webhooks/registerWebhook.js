const { v4: uuidv4 } = require('uuid');
const db = require('../../db/database');

async function registerWebhook({ url, events }, user) {
  if (!url || !Array.isArray(events) || events.length === 0) {
    throw Object.assign(new Error('url and events are required'), { status: 400 });
  }

  try { new URL(url); } catch {
    throw Object.assign(new Error('Invalid URL format'), { status: 400 });
  }

  const id = uuidv4();
  db.prepare(
    'INSERT INTO webhook_subscriptions (id, user_id, url, events) VALUES (?, ?, ?, ?)'
  ).run(id, user.id, url, JSON.stringify(events));

  const sub = db.prepare('SELECT * FROM webhook_subscriptions WHERE id = ?').get(id);
  return { ...sub, events: JSON.parse(sub.events) };
}

module.exports = registerWebhook;
