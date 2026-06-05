// Reports routes (protected).
const express = require("express");
const reports = require("../controllers/reports.controller");

const router = express.Router();

router.get("/dashboard", reports.dashboard);
router.get("/reservations", reports.reservationReport);

module.exports = router;
