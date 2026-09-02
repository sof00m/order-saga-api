const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../db/database');

async function register({ email, password }) {
  if (!email || !password) {
    throw Object.assign(new Error('Email and password are required'), { status: 400 });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    throw Object.assign(new Error('Email already registered'), { status: 409 });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const id = uuidv4();
  db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(id, email, passwordHash);

  const token = jwt.sign({ id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { token };
}

module.exports = register;
