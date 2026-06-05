// Customer routes (all protected by requireAuth in server.js).
const express = require("express");
const c = require("../controllers/customer.controller");

const router = express.Router();

router.get("/", c.list);
router.post("/", c.create);
router.put("/:id", c.update);
router.delete("/:id", c.remove);

module.exports = router;
