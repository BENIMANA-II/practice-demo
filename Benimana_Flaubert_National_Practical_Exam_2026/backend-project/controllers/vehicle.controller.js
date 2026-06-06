// Vehicle CRUD + search. Plate_Number is the primary key (set on create only).
const Vehicle = require("../models/Vehicle");

// Cars use a 3-letter prefix (RAB 123 A); motorcycles use the "RL" prefix (RL 123 A).
const CAR_PLATE_RE = /^R[A-Z]{2} \d{3} [A-Z]$/;
const MOTO_PLATE_RE = /^RL \d{3} [A-Z]$/;
const CURRENT_YEAR = new Date().getFullYear();

function isValidPlate(plate) {
  return CAR_PLATE_RE.test(plate) || MOTO_PLATE_RE.test(plate);
}

function validate(body, isCreate) {
  const errors = {};
  if (isCreate) {
    const plate = String(body.Plate_Number || "").trim().toUpperCase();
    if (!isValidPlate(plate)) {
      errors.Plate_Number = "Plate must look like RAB 123 A (car) or RL 123 A (motorcycle)";
    }
  }
  if (!body.Brand || body.Brand.trim().length < 1) errors.Brand = "Brand is required";
  if (!body.Model || body.Model.trim().length < 1) errors.Model = "Model is required";
  const year = Number(body.Year);
  if (!year || year < 1950 || year > CURRENT_YEAR) {
    errors.Year = `Year must be between 1950 and ${CURRENT_YEAR}`;
  }
  if (!body.Vehicle_Type || body.Vehicle_Type.trim().length < 1) {
    errors.Vehicle_Type = "Vehicle type is required";
  }
  if (!(Number(body.Purchase_Price) > 0)) {
    errors.Purchase_Price = "Purchase price must be greater than 0";
  }
  if (!body.Status || body.Status.trim().length < 1) errors.Status = "Status is required";
  return errors;
}

async function list(req, res) {
  try {
    const rows = await Vehicle.findAll(req.query.search);
    return res.status(200).json({ data: rows });
  } catch (err) {
    console.error("vehicle.list:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function create(req, res) {
  try {
    const errors = validate(req.body, true);
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: Object.values(errors)[0] });
    }
    const plate = String(req.body.Plate_Number).trim().toUpperCase();
    if (await Vehicle.existsByPlate(plate)) {
      return res.status(400).json({ error: "A vehicle with this plate already exists" });
    }
    const created = await Vehicle.create({ ...req.body, Plate_Number: plate }, req.session.userId);
    return res.status(201).json({ data: created });
  } catch (err) {
    console.error("vehicle.create:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function update(req, res) {
  try {
    const plate = req.params.plate;
    const existing = await Vehicle.findById(plate);
    if (!existing) return res.status(404).json({ error: "Vehicle not found" });

    const errors = validate(req.body, false);
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: Object.values(errors)[0] });
    }
    const updated = await Vehicle.update(plate, req.body);
    return res.status(200).json({ data: updated });
  } catch (err) {
    console.error("vehicle.update:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function remove(req, res) {
  try {
    const plate = req.params.plate;
    const existing = await Vehicle.findById(plate);
    if (!existing) return res.status(404).json({ error: "Vehicle not found" });

    const refs = await Vehicle.countReservations(plate);
    if (refs > 0) {
      return res.status(400).json({
        error: "Cannot delete: this vehicle has reservation/rental records",
      });
    }
    await Vehicle.remove(plate);
    return res.status(200).json({ data: { message: "Vehicle deleted" } });
  } catch (err) {
    console.error("vehicle.remove:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { list, create, update, remove };
