const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src/app');

chai.use(chaiHttp);
const { expect } = chai;

// Unique email per test run so tests never conflict with each other
const uniqueEmail = () => `test_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

describe('POST /auth/register', () => {
  it('should register a new user and return a token', async () => {
    const res = await chai.request(app)
      .post('/auth/register')
      .send({ email: uniqueEmail(), password: 'password123' });

    expect(res).to.have.status(201);
    expect(res.body).to.have.property('token');
    expect(res.body.token).to.be.a('string');
  });

  it('should return 400 if email is missing', async () => {
    const res = await chai.request(app)
      .post('/auth/register')
      .send({ password: 'password123' });

    expect(res).to.have.status(400);
  });

  it('should return 400 if password is missing', async () => {
    const res = await chai.request(app)
      .post('/auth/register')
      .send({ email: uniqueEmail() });

    expect(res).to.have.status(400);
  });

  it('should return 409 if the email is already registered', async () => {
    const email = uniqueEmail();

    await chai.request(app).post('/auth/register').send({ email, password: 'pass' });
    const res = await chai.request(app).post('/auth/register').send({ email, password: 'pass' });

    expect(res).to.have.status(409);
  });
});

describe('POST /auth/login', () => {
  const email = uniqueEmail();
  const password = 'testpass123';

  // Register once before all login tests
  before(async () => {
    await chai.request(app).post('/auth/register').send({ email, password });
  });

  it('should login with correct credentials and return a token', async () => {
    const res = await chai.request(app)
      .post('/auth/login')
      .send({ email, password });

    expect(res).to.have.status(200);
    expect(res.body).to.have.property('token');
    expect(res.body.token).to.be.a('string');
  });

  it('should return 401 for wrong password', async () => {
    const res = await chai.request(app)
      .post('/auth/login')
      .send({ email, password: 'wrongpassword' });

    expect(res).to.have.status(401);
  });

  it('should return 401 for non-existent email', async () => {
    const res = await chai.request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'pass' });

    expect(res).to.have.status(401);
  });
});
