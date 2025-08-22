// Middleware to check if user is admin
module.exports = function (req, res, next) {
  if (req.user && req.user.role === 'admin') {
    console.log("👮‍♂️ Admin middleware called")
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admins only.' });
};
