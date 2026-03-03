/**
 * Admin role check middleware - must be used AFTER auth middleware
 */
const admin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

module.exports = admin;
