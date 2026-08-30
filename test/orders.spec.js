// YOU WRITE THIS
// Tests the full saga lifecycle: create → advance (x3) → delivered
// Also tests the failure/compensation path.

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src/app');

chai.use(chaiHttp);
const { expect } = chai;

// Helper: register a user and return the token
async function getToken() {
  const res = await chai.request(app)
    .post('/auth/register')
    .send({ email: `order_test_${Date.now()}@example.com`, password: 'testpass' });
  return res.body.token;
}

describe('Order Saga — happy path', () => {
  let token;
  let orderId;

  before(async () => {
    // Get a token before all tests in this block run
    token = await getToken();
  });

  it('should create an order with status PENDING', async () => {
    // POST /orders with items and the Bearer token.
    // Assert status 201 and order.status === 'PENDING'.
    // Save orderId = res.body.id for the next tests.
  });

  it('should advance to PAYMENT_OK', async () => {
    // POST /orders/:orderId/advance with { fail: false }
    // Assert order.status === 'PAYMENT_OK'
    // Assert saga_steps has 1 completed step with step_name === 'payment'
  });

  it('should advance to RESERVED', async () => {
    // Same, expect status 'RESERVED'
  });

  it('should advance to SHIPPED', async () => {
    // Same, expect status 'SHIPPED'
  });

  it('should advance to DELIVERED', async () => {
    // Same, expect status 'DELIVERED'
  });
});

describe('Order Saga — compensation (failure) path', () => {
  let token;
  let orderId;

  before(async () => {
    token = await getToken();
  });

  it('should create an order', async () => {
    // Create a new order for the failure path test
  });

  it('should advance once (to PAYMENT_OK)', async () => {
    // Advance once so there is at least one completed step to compensate
  });

  it('should cancel and compensate when fail=true', async () => {
    // POST /orders/:orderId/advance with { fail: true }
    // Assert order.status === 'CANCELLED'
    // Assert saga_steps contains a COMPENSATED step
  });

  it('should not allow advancing a cancelled order', async () => {
    // Try to advance a CANCELLED order and expect 400
  });
});
