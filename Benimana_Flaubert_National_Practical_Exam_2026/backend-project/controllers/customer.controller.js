// Customer CRUD + search. All logic, validation and status codes live here.
const Customer = require("../models/Customer");

const NAME_RE = /^[A-Za-z]+([ '-][A-Za-z]+)*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(078|079|073|072)\d{7}$/;

function validate(body) {
  const errors = {};
  if (!body.Full_Name || !NAME_RE.test(body.Full_Name.trim())) {
    errors.Full_Name = "Enter a valid full name (letters only)";
  }
  if (!body.National_ID || !/^\d{16}$/.test(String(body.National_ID).trim())) {
    errors.National_ID = "National ID must be 16 digits";
  }
  if (!body.Phone || !PHONE_RE.test(String(body.Phone).trim())) {
    errors.Phone = "Phone must be 10 digits starting 078/079/073/072";
  }
  if (!body.Email || !EMAIL_RE.test(body.Email.trim())) {
    errors.Email = "Enter a valid email address";
  }
  if (!body.Address || body.Address.trim().length < 2) {
    errors.Address = "Address is required";
  }
  return errors;
}

async function list(req, res) {
  try {
    const rows = await Customer.findAll(req.query.search);
    return res.status(200).json({ data: rows });
  } catch (err) {
    console.error("customer.list:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function create(req, res) {
  try {
    const errors = validate(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: Object.values(errors)[0] });
    }
    const dup = await Customer.findByNationalId(req.body.National_ID);
    if (dup) {
      return res.status(400).json({ error: "A customer with this National ID already exists" });
    }
    // owner_id records who created the row; the data itself is shared.
    const created = await Customer.create(req.body, req.session.userId);
    return res.status(201).json({ data: created });
  } catch (err) {
    console.error("customer.create:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function update(req, res) {
  try {
    const existing = await Customer.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Customer not found" });

    const errors = validate(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: Object.values(errors)[0] });
    }
    const dup = await Customer.findByNationalId(req.body.National_ID);
    if (dup && dup.Customer_ID !== Number(req.params.id)) {
      return res.status(400).json({ error: "A customer with this National ID already exists" });
    }
    const updated = await Customer.update(req.params.id, req.body);
    return res.status(200).json({ data: updated });
  } catch (err) {
    console.error("customer.update:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function remove(req, res) {
  try {
    const existing = await Customer.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Customer not found" });

    // Block deleting a customer that still has reservations (no orphans).
    const refs = await Customer.countReservations(req.params.id);
    if (refs > 0) {
      return res.status(400).json({
        error: "Cannot delete: this customer has reservation/rental records",
      });
    }
    await Customer.remove(req.params.id);
    return res.status(200).json({ data: { message: "Customer deleted" } });
  } catch (err) {
    console.error("customer.remove:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { list, create, update, remove };
