const express = require('express');
const auth = require('../middleware/auth');
const createOrder = require('../usecases/orders/createOrder');
const getOrder = require('../usecases/orders/getOrder');
const advanceOrder = require('../usecases/orders/advanceOrder');
const getTimeline = require('../usecases/orders/getTimeline');

const router = express.Router();

// All order endpoints require a valid JWT.
// Alternative: router.use(auth) to apply it once for the entire router.

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order (starts the saga)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: { type: string }
 *                     qty: { type: integer }
 *                     price: { type: number }
 *     responses:
 *       201: { description: Order created with status PENDING }
 *       400: { description: Missing or invalid items }
 */
router.post('/', auth, async (req, res, next) => {
  try {
    const result = await createOrder(req.body, req.user);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order details + saga steps
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Order with saga_steps array }
 *       404: { description: Order not found }
 */
router.get('/:id', auth, async (req, res, next) => {
  try {
    const result = await getOrder(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /orders/{id}/advance:
 *   post:
 *     summary: Advance the saga to the next step (or trigger compensation)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fail:
 *                 type: boolean
 *                 description: Simulate a step failure (triggers compensation/rollback)
 *                 example: false
 *     responses:
 *       200: { description: Updated order state }
 */
router.post('/:id/advance', auth, async (req, res, next) => {
  try {
    const result = await advanceOrder(req.params.id, req.body, req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /orders/{id}/timeline:
 *   get:
 *     summary: Full audit log of all saga steps for this order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Array of saga steps with timestamps }
 */
router.get('/:id/timeline', auth, async (req, res, next) => {
  try {
    const result = await getTimeline(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
