const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(403).json({ message: 'Malformed token' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Unauthorized / Invalid Token' });
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    };
    next();
  });
};

const verifyAdmin = (req, res, next) => {
  const role = req.user && req.user.role ? String(req.user.role).toLowerCase() : "null";
  if (role !== 'admin') {
    return res.status(403).json({ 
      message: 'Require Admin Role!', 
      debug: { 
        receivedRole: role,
        email: req.user ? req.user.email : 'unknown'
      } 
    });
  }
  next();
};

module.exports = { verifyToken, verifyAdmin };
