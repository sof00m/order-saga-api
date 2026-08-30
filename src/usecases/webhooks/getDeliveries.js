// Input: user (from req.user)
// Output: list of webhook delivery attempts for this user's subscriptions

const db = require('../../db/database');

async function getDeliveries(user) {
  // Fetch all deliveries for subscriptions that belong to this user.
  const deliveries = db.prepare(`
      SELECT wd.*
      FROM webhook_deliveries wd
      JOIN webhook_subscriptions ws ON wd.subscription_id = ws.id
      WHERE ws.user_id = ?
      ORDER BY wd.created_at DESC
    `).all(user.id);

  // Parse payload (JSON string - object) for each delivery, then return.
  return deliveries.map(d => ({ ...d, payload: JSON.parse(d.payload) }));
}

module.exports = getDeliveries;
