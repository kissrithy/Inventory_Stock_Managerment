const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'inventory-stock-management-super-secret-key-2026';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If demo mode or test header, fallback to admin user
    const demoUserId = req.headers['x-demo-user-id'];
    if (demoUserId) {
      const user = db.prepare('SELECT id, username, email, full_name, role, department FROM users WHERE id = ?').get(demoUserId);
      if (user) {
        req.user = user;
        return next();
      }
    }
    return res.status(401).json({ error: 'Access token required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, email, full_name, role, department, is_active FROM users WHERE id = ?').get(decoded.id);
    if (!user || !user.is_active) {
      return res.status(403).json({ error: 'User account disabled or not found.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (roles.length > 0 && !roles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied for this operation.' });
    }
    next();
  };
}

function logAudit(userId, username, action, moduleName, description, ip = '127.0.0.1') {
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, username, action, module, description, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId || null, username || 'System', action, moduleName, description, ip);
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
}

module.exports = {
  JWT_SECRET,
  authMiddleware,
  requireRole,
  logAudit
};
