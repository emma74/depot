import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  //const token = req.header('Authorization').replace('Bearer ', '');
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: "Token missing or malformed" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded token to request
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Admin-only tables: block everyone else entirely.
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Shared-read tables: non-admins may GET, everything else is blocked.
export const requireAdminForWrite = (req, res, next) => {
  if (req.method !== 'GET' && req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Read-only access" });
  }
  next();
};