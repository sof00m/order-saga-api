const db = require('../../db/database');

async function getDeliveries(user) {
  const deliveries = db.prepare(`
    SELECT wd.*
    FROM webhook_deliveries wd
    JOIN webhook_subscriptions ws ON wd.subscription_id = ws.id
    WHERE ws.user_id = ?
    ORDER BY wd.created_at DESC
  `).all(user.id);

  return deliveries.map(d => ({ ...d, payload: JSON.parse(d.payload) }));
}

module.exports = getDeliveries;
