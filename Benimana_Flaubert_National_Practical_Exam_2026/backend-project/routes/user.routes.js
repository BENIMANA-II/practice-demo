// User management routes — admin only (requireAdmin applied in server.js).
const express = require("express");
const u = require("../controllers/user.controller");

const router = express.Router();

router.get("/", u.list);
router.put("/:id/approve", u.approve);

module.exports = router;
