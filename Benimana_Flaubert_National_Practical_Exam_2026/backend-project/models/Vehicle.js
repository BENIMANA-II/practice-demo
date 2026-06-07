// Data-access module for Vehicle (MongoDB/Mongoose).
// Plate_Number is the natural primary key (a string), so no counter is needed.
// Data is SHARED across approved users; owner_id only records the creator.
const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    Plate_Number: { type: String, required: true, unique: true, index: true },
    Brand: { type: String, required: true },
    Model: { type: String, required: true },
    Year: { type: Number, required: true },
    Vehicle_Type: { type: String, required: true },
    Purchase_Price: { type: Number, required: true },
    Status: { type: String, default: "Available" },
    owner_id: { type: Number, required: true, index: true },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "vehicles", versionKey: false }
);

const VehicleModel =
  mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);

const PROJECTION =
  "-_id Plate_Number Brand Model Year Vehicle_Type Purchase_Price Status owner_id created_at";

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findAll(search) {
  const filter = {};
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { Plate_Number: rx },
      { Brand: rx },
      { Model: rx },
      { Vehicle_Type: rx },
      { Status: rx },
    ];
  }
  return VehicleModel.find(filter).select(PROJECTION).sort({ created_at: -1 }).lean();
}

async function findById(plate) {
  return VehicleModel.findOne({ Plate_Number: plate }).select(PROJECTION).lean();
}

async function existsByPlate(plate) {
  const doc = await VehicleModel.exists({ Plate_Number: plate });
  return Boolean(doc);
}

async function create(data, ownerId) {
  await VehicleModel.create({
    Plate_Number: data.Plate_Number,
    Brand: data.Brand,
    Model: data.Model,
    Year: data.Year,
    Vehicle_Type: data.Vehicle_Type,
    Purchase_Price: data.Purchase_Price,
    Status: data.Status,
    owner_id: ownerId,
  });
  return findById(data.Plate_Number);
}

// Plate_Number (PK) is not editable; everything else is.
async function update(plate, data) {
  await VehicleModel.updateOne(
    { Plate_Number: plate },
    {
      $set: {
        Brand: data.Brand,
        Model: data.Model,
        Year: data.Year,
        Vehicle_Type: data.Vehicle_Type,
        Purchase_Price: data.Purchase_Price,
        Status: data.Status,
      },
    }
  );
  return findById(plate);
}

async function remove(plate) {
  await VehicleModel.deleteOne({ Plate_Number: plate });
}

async function countReservations(plate) {
  return mongoose.model("ReservationRental").countDocuments({ Plate_Number: plate });
}

module.exports = {
  findAll,
  findById,
  existsByPlate,
  create,
  update,
  remove,
  countReservations,
};
