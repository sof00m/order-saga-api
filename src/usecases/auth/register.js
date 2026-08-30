// Input:  { email, password } (from req.body)
// Output: { token } (JWT that the client will use for protected routes)

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../db/database');

async function register({ email, password }) {
  // Validate that both fields are present.
  if (!email || !password) {
    throw Object.assign(new Error('Email and password are required'), { status: 400 })
  }

  // Check if the email is already taken.
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    throw Object.assign(new Error('Email already registered'), { status: 409 })
  }

  // Hash the password (never store plain text).
  const passwordHash = bcrypt.hashSync(password, 10);

  // Insert the new user into the database.
  const id = uuidv4();
  db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(id, email, passwordHash);

  // Generate and return a JWT token.
  const token = jwt.sign({ id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return {
    token
  };
}

module.exports = register;
