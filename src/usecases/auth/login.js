// Input: { email, password }
// Output: { token }

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../db/database');

async function login({ email, password }) {
  // Validate fields are present.
  if (!email || !password) {
    throw Object.assign(new Error('Email and password are required'), { status: 400 })
  }

  // Find the user by email.
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  // Compare the password against the stored hash.
  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  // Generate and return the token (same as register).
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return {
    token
  };
}

module.exports = login;
