// Session check for every non-auth route: returns 401 when there is no logged-in user.
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated. Please sign in.' });
  }
  next();
}

module.exports = requireAuth;
