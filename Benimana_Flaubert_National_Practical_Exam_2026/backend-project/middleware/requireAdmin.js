// Role guard: only an admin may pass. Loads the session user and checks Role.
// Runs after requireAuth, so req.session.userId is guaranteed to be present.
const User = require("../models/User");

async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.session.userId);
    if (!user || user.Role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (err) {
    console.error("requireAdmin error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = requireAdmin;
