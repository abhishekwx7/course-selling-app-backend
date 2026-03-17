const jwt = require("jsonwebtoken");
const { JWT_USER_PASSWORD } = require("../config");

function userMiddleware(req, res, next) {
  try {
    // ✅ Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    // Format: "Bearer TOKEN"
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Invalid token format",
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, JWT_USER_PASSWORD);

    // ✅ Attach userId
    req.userId = decoded.userId;

    next();
  } catch (err) {
    return res.status(403).json({
      message: "Invalid or expired token",
    });
  }
}

module.exports = {
  userMiddleware,
};
