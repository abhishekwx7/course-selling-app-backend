const jwt = require("jsonwebtoken");
const { JWT_ADMIN_PASSWORD } = require("../config");

function adminMiddleware(req, res, next) {
  try {
    // ✅ Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    // Format: Bearer TOKEN
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Invalid token format",
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, JWT_ADMIN_PASSWORD);

    // ✅ Attach admin id
    req.userId = decoded.userId;

    next();
  } catch (err) {
    return res.status(403).json({
      message: "Invalid or expired admin token",
    });
  }
}

module.exports = {
  adminMiddleware,
};
