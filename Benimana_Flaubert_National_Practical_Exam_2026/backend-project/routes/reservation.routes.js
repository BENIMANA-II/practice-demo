// Reservation_Rental routes (protected).
const express = require("express");
const r = require("../controllers/reservation.controller");

const router = express.Router();

router.get("/", r.list);
router.post("/", r.create);
router.put("/:id", r.update);
router.delete("/:id", r.remove);

module.exports = router;
