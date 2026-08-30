const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src/app');

chai.use(chaiHttp);
const { expect } = chai;

const uniqueEmail = () => `order_test_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

// Registers a user and returns their JWT token
async function getToken() {
  const res = await chai.request(app)
    .post('/auth/register')
    .send({ email: uniqueEmail(), password: 'testpass123' });
  return res.body.token;
}

const sampleItems = [{ name: 'Laptop', qty: 1, price: 999.99 }];

// ─── Happy path ──────────────────────────────────────────────────────────────

describe('Order Saga — happy path (PENDING → DELIVERED)', () => {
  let token;
  let orderId;

  before(async () => { token = await getToken(); });

  it('POST /orders → status PENDING, saga_steps empty', async () => {
    const res = await chai.request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: sampleItems });

    expect(res).to.have.status(201);
    expect(res.body.status).to.equal('PENDING');
    expect(res.body.saga_steps).to.be.an('array').with.lengthOf(0);
    orderId = res.body.id;
  });

  it('advance → PAYMENT_OK, payment step COMPLETED', async () => {
    const res = await chai.request(app)
      .post(`/orders/${orderId}/advance`)
      .set('Authorization', `Bearer ${token}`)
      .send({ fail: false });

    expect(res).to.have.status(200);
    expect(res.body.status).to.equal('PAYMENT_OK');
    expect(res.body.saga_steps).to.have.lengthOf(1);
    expect(res.body.saga_steps[0].step_name).to.equal('payment');
    expect(res.body.saga_steps[0].status).to.equal('COMPLETED');
  });

  it('advance → RESERVED', async () => {
    const res = await chai.request(app)
      .post(`/orders/${orderId}/advance`)
      .set('Authorization', `Bearer ${token}`)
      .send({ fail: false });

    expect(res).to.have.status(200);
    expect(res.body.status).to.equal('RESERVED');
  });

  it('advance → SHIPPED', async () => {
    const res = await chai.request(app)
      .post(`/orders/${orderId}/advance`)
      .set('Authorization', `Bearer ${token}`)
      .send({ fail: false });

    expect(res).to.have.status(200);
    expect(res.body.status).to.equal('SHIPPED');
  });

  it('advance → DELIVERED, all 3 steps COMPLETED', async () => {
    const res = await chai.request(app)
      .post(`/orders/${orderId}/advance`)
      .set('Authorization', `Bearer ${token}`)
      .send({ fail: false });

    expect(res).to.have.status(200);
    expect(res.body.status).to.equal('DELIVERED');
    expect(res.body.saga_steps).to.have.lengthOf(3);
  });

  it('advance on DELIVERED order → 400', async () => {
    const res = await chai.request(app)
      .post(`/orders/${orderId}/advance`)
      .set('Authorization', `Bearer ${token}`)
      .send({ fail: false });

    expect(res).to.have.status(400);
  });
});

// ─── Compensation path ────────────────────────────────────────────────────────

describe('Order Saga — compensation (fail → CANCELLED)', () => {
  let token;
  let orderId;

  before(async () => {
    token = await getToken();

    // Create order and advance once so there is a step to compensate
    const created = await chai.request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: sampleItems });
    orderId = created.body.id;

    await chai.request(app)
      .post(`/orders/${orderId}/advance`)
      .set('Authorization', `Bearer ${token}`)
      .send({ fail: false });
  });

  it('fail=true → CANCELLED, step COMPENSATED with compensated_at timestamp', async () => {
    const res = await chai.request(app)
      .post(`/orders/${orderId}/advance`)
      .set('Authorization', `Bearer ${token}`)
      .send({ fail: true });

    expect(res).to.have.status(200);
    expect(res.body.status).to.equal('CANCELLED');
    expect(res.body.saga_steps[0].status).to.equal('COMPENSATED');
    expect(res.body.saga_steps[0].compensated_at).to.not.be.null;
  });

  it('advance on CANCELLED order → 400', async () => {
    const res = await chai.request(app)
      .post(`/orders/${orderId}/advance`)
      .set('Authorization', `Bearer ${token}`)
      .send({ fail: false });

    expect(res).to.have.status(400);
  });
});

// ─── Authorization ────────────────────────────────────────────────────────────

describe('Order authorization', () => {
  let token1;
  let token2;
  let orderId;

  before(async () => {
    token1 = await getToken();
    token2 = await getToken();

    const res = await chai.request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token1}`)
      .send({ items: sampleItems });
    orderId = res.body.id;
  });

  it('should return 403 when accessing another user\'s order', async () => {
    const res = await chai.request(app)
      .get(`/orders/${orderId}`)
      .set('Authorization', `Bearer ${token2}`);

    expect(res).to.have.status(403);
  });

  it('should return 401 when no token provided', async () => {
    const res = await chai.request(app)
      .get(`/orders/${orderId}`);

    expect(res).to.have.status(401);
  });
});
