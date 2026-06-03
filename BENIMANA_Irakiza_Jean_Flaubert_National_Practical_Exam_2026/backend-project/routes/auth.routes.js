const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  logout,
  me,
  recoverVerify,
  recoverReset,
} = require('../controllers/auth.controller');

const router = express.Router();

// Throttle credential-guessing on login and the 4-digit recovery flow (only 10,000 combinations).
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const recoverLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

router.post('/register', register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', me);
router.post('/recover/verify', recoverLimiter, recoverVerify);
router.post('/recover/reset', recoverLimiter, recoverReset);

module.exports = router;
