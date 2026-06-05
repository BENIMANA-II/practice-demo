// Vehicle routes (protected). Plate_Number is the id param.
// READ is open to any approved user; CREATE/UPDATE/DELETE are admin-only.
const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");
const v = require("../controllers/vehicle.controller");

const router = express.Router();

router.get("/", v.list);
router.post("/", requireAdmin, v.create);
router.put("/:plate", requireAdmin, v.update);
router.delete("/:plate", requireAdmin, v.remove);

module.exports = router;
