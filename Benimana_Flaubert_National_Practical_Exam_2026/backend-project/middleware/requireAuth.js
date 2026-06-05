// Session-check middleware. Returns 401 when there is no logged-in user.
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

module.exports = requireAuth;
