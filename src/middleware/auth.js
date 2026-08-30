const jwt = require('jsonwebtoken');

// This middleware runs before every protected route.
// It reads the JWT from the Authorization header, verifies it, and attaches the user to req.user.

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if(!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;  // e.g. { id, email, iat, exp }
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = authMiddleware;
