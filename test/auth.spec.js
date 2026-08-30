// YOU WRITE THIS
// Run with: npm test
// Pattern: describe('endpoint') > it('expected behavior')

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src/app');

chai.use(chaiHttp);
const { expect } = chai;

// Unique email per test run so tests don't conflict with each other
const testEmail = `test_${Date.now()}@example.com`;

describe('POST /auth/register', () => {
  it('should register a new user and return a token', async () => {
    // STEP 1: Make a POST request to /auth/register with { email: testEmail, password: '123456' }
    //   const res = await chai.request(app).post('/auth/register').send({ email: testEmail, password: '123456' });

    // STEP 2: Assert the response.
    //   expect(res).to.have.status(201);
    //   expect(res.body).to.have.property('token');
    //   expect(res.body.token).to.be.a('string');
  });

  it('should return 400 if email or password is missing', async () => {
    // Send a request without a password and expect 400.
  });

  it('should return 409 if the email is already registered', async () => {
    // Register twice with the same email and expect 409 on the second attempt.
  });
});

describe('POST /auth/login', () => {
  it('should login and return a token', async () => {
    // Register first, then login with the same credentials and expect a token.
  });

  it('should return 401 for wrong password', async () => {
    // Login with a wrong password and expect 401.
  });
});
