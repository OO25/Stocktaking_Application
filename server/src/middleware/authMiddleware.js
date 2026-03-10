// Middleware for protecting routes with JWT verification and role checks
// Usage: router.get("/route", requireAuth, requireRole("admin"), handler)

import jwt from "jsonwebtoken";

// Verifies the JWT from the Authorization header and attaches the decoded
// user payload to req.user. Returns 401 if missing or invalid.
export function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // extract from "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "No token provided. Please log in." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // makes req.user.role, req.user.id available downstream
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
}

// Restricts a route to specific roles. Must be used after requireAuth.
// Example: requireRole("admin", "manager")
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}.`,
      });
    }
    next();
  };
}
