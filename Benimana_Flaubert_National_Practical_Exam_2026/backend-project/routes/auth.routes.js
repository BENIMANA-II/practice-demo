// Auth routes — map HTTP method+path to a controller function only.
const express = require("express");
const rateLimit = require("express-rate-limit");
const auth = require("../controllers/auth.controller");

const router = express.Router();

// Throttle login + recovery (4-digit codes are easy to brute-force).
const tightLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

router.post("/register", auth.register);
router.post("/login", tightLimiter, auth.login);
router.post("/logout", auth.logout);
router.get("/me", auth.me);
router.post("/recover/verify", tightLimiter, auth.recoverVerify);
router.post("/recover/reset", tightLimiter, auth.recoverReset);

module.exports = router;
