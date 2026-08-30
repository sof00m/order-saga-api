const express = require('express');
const auth = require('../middleware/auth');
const registerWebhook = require('../usecases/webhooks/registerWebhook');
const getDeliveries = require('../usecases/webhooks/getDeliveries');

const router = express.Router();

/**
 * @swagger
 * /webhooks:
 *   post:
 *     summary: Register a webhook URL to receive order events
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url, events]
 *             properties:
 *               url:
 *                 type: string
 *                 example: https://myapp.com/webhooks/orders
 *               events:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["order.payment_completed", "order.cancelled"]
 *     responses:
 *       201: { description: Subscription created }
 */
router.post('/', auth, async (req, res, next) => {
  try {
    const result = await registerWebhook(req.body, req.user);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /webhooks/deliveries:
 *   get:
 *     summary: Get webhook delivery log (with retry info)
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of delivery attempts }
 */
router.get('/deliveries', auth, async (req, res, next) => {
  try {
    const result = await getDeliveries(req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
