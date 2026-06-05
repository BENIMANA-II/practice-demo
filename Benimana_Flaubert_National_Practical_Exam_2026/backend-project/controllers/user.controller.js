// Admin-only user management: list accounts and approve pending ones.
const User = require("../models/User");

async function list(req, res) {
  try {
    const users = await User.findAll();
    return res.status(200).json({ data: users });
  } catch (err) {
    console.error("user.list:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function approve(req, res) {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: "User not found" });
    if (target.Status === "approved") {
      return res.status(400).json({ error: "User is already approved" });
    }
    const updated = await User.approve(req.params.id);
    return res.status(200).json({ data: updated });
  } catch (err) {
    console.error("user.approve:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { list, approve };
