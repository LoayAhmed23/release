const jwt = require('jsonwebtoken');

const JWT_SECRET = 'temp_secret'; // In production, use environment variables

function auth(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token') || req.cookies.token;

  // Check if token exists
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
}

module.exports = auth;