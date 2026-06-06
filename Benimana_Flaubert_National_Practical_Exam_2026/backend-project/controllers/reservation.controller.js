// Reservation_Rental CRUD + search. Validates the linked customer/vehicle belong
// to the same user and that the date ranges are consistent.
const Reservation = require("../models/Reservation");
const Customer = require("../models/Customer");
const Vehicle = require("../models/Vehicle");

const RES_STATUS = ["Pending", "Confirmed", "Cancelled"];
const RENTAL_STATUS = ["Not Started", "Ongoing", "Returned"];

// Local calendar date as YYYY-MM-DD (string compare is safe for this format).
function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Date rules:
//  - Reservation date and Start date must be today.
//  - End date must be today or in the future.
//  - Rental date (if set) must be today.
//  - Return date (if set) must be today or in the future.
function validateDates(body) {
  const errors = {};
  const today = todayStr();
  const res = (body.Reservation_Date || "").slice(0, 10);
  const start = (body.Start_Date || "").slice(0, 10);
  const end = (body.End_Date || "").slice(0, 10);
  const rental = (body.Rental_Date || "").slice(0, 10);
  const ret = (body.Return_Date || "").slice(0, 10);

  if (!res) errors.Reservation_Date = "Reservation date is required";
  else if (res !== today) errors.Reservation_Date = "Reservation date must be today";

  if (!start) errors.Start_Date = "Start date is required";
  else if (start !== today) errors.Start_Date = "Start date must be today";

  if (!end) errors.End_Date = "End date is required";
  else if (end < today) errors.End_Date = "End date must be today or in the future";

  if (rental && rental !== today) errors.Rental_Date = "Rental date must be today";

  if (ret && ret < today) errors.Return_Date = "Return date must be today or in the future";

  return errors;
}

async function validate(body) {
  const errors = {};
  if (!body.Customer_ID) errors.Customer_ID = "Select a customer";
  if (!body.Plate_Number) errors.Plate_Number = "Select a vehicle";
  if (!RES_STATUS.includes(body.Reservation_Status)) {
    errors.Reservation_Status = "Select a reservation status";
  }
  if (!RENTAL_STATUS.includes(body.Rental_Status)) {
    errors.Rental_Status = "Select a rental status";
  }
  if (body.Rental_Fee === undefined || Number(body.Rental_Fee) < 0) {
    errors.Rental_Fee = "Rental fee must be 0 or more";
  }
  Object.assign(errors, validateDates(body));

  // Referenced rows must exist (data is shared, so no owner filter).
  if (body.Customer_ID) {
    const c = await Customer.findById(body.Customer_ID);
    if (!c) errors.Customer_ID = "Selected customer not found";
  }
  if (body.Plate_Number) {
    const v = await Vehicle.findById(body.Plate_Number);
    if (!v) errors.Plate_Number = "Selected vehicle not found";
  }
  return errors;
}

async function list(req, res) {
  try {
    const rows = await Reservation.findAll(req.query.search);
    return res.status(200).json({ data: rows });
  } catch (err) {
    console.error("reservation.list:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function create(req, res) {
  try {
    const errors = await validate(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: Object.values(errors)[0] });
    }
    const created = await Reservation.create(req.body, req.session.userId);
    return res.status(201).json({ data: created });
  } catch (err) {
    console.error("reservation.create:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function update(req, res) {
  try {
    const existing = await Reservation.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Reservation not found" });

    const errors = await validate(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: Object.values(errors)[0] });
    }
    const updated = await Reservation.update(req.params.id, req.body);
    return res.status(200).json({ data: updated });
  } catch (err) {
    console.error("reservation.update:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function remove(req, res) {
  try {
    const existing = await Reservation.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Reservation not found" });
    await Reservation.remove(req.params.id);
    return res.status(200).json({ data: { message: "Reservation deleted" } });
  } catch (err) {
    console.error("reservation.remove:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { list, create, update, remove };
