// Data-access module for Customer (MongoDB/Mongoose).
// Data is SHARED: every approved user sees and edits the same records.
// owner_id still records WHO created each row, but is not used to filter reads.
// Customer_ID is kept as an auto-incrementing integer to match the API contract.
const mongoose = require("mongoose");
const { nextSeq } = require("./Counter");

const customerSchema = new mongoose.Schema(
  {
    Customer_ID: { type: Number, unique: true, index: true },
    Full_Name: { type: String, required: true },
    National_ID: { type: String, required: true, unique: true },
    Phone: { type: String, required: true },
    Email: { type: String, required: true },
    Address: { type: String, required: true },
    owner_id: { type: Number, required: true, index: true },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "customers", versionKey: false }
);

const CustomerModel =
  mongoose.models.Customer || mongoose.model("Customer", customerSchema);

const PROJECTION =
  "-_id Customer_ID Full_Name National_ID Phone Email Address owner_id created_at";

// Escape a user string so it is treated literally inside a regex search.
function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// List with optional search across name / national id / phone / email.
async function findAll(search) {
  const filter = {};
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { Full_Name: rx },
      { National_ID: rx },
      { Phone: rx },
      { Email: rx },
    ];
  }
  return CustomerModel.find(filter).select(PROJECTION).sort({ Customer_ID: -1 }).lean();
}

async function findById(id) {
  return CustomerModel.findOne({ Customer_ID: Number(id) }).select(PROJECTION).lean();
}

async function findByNationalId(nationalId) {
  return CustomerModel.findOne({ National_ID: String(nationalId) })
    .select(PROJECTION)
    .lean();
}

async function create(data, ownerId) {
  const Customer_ID = await nextSeq("customers");
  await CustomerModel.create({
    Customer_ID,
    Full_Name: data.Full_Name,
    National_ID: data.National_ID,
    Phone: data.Phone,
    Email: data.Email,
    Address: data.Address,
    owner_id: ownerId,
  });
  return findById(Customer_ID);
}

async function update(id, data) {
  await CustomerModel.updateOne(
    { Customer_ID: Number(id) },
    {
      $set: {
        Full_Name: data.Full_Name,
        National_ID: data.National_ID,
        Phone: data.Phone,
        Email: data.Email,
        Address: data.Address,
      },
    }
  );
  return findById(id);
}

async function remove(id) {
  await CustomerModel.deleteOne({ Customer_ID: Number(id) });
}

// Used before delete to block removing a customer that has reservations.
async function countReservations(id) {
  return mongoose.model("ReservationRental").countDocuments({ Customer_ID: Number(id) });
}

module.exports = {
  findAll,
  findById,
  findByNationalId,
  create,
  update,
  remove,
  countReservations,
};
