// Data-access module for Reservation_Rental (the movement/event entity).
// Data is SHARED across approved users; Recorded_By only records the creator.
// MongoDB has no JOIN, so findAll/findById use an aggregation $lookup to attach
// the customer + vehicle display fields the old SQL JOIN returned.
const mongoose = require("mongoose");
const { nextSeq } = require("./Counter");

const reservationSchema = new mongoose.Schema(
  {
    Reservation_ID: { type: Number, unique: true, index: true },
    Customer_ID: { type: Number, required: true, index: true },
    Plate_Number: { type: String, required: true, index: true },
    Recorded_By: { type: Number, required: true, index: true },
    // Dates are kept as "YYYY-MM-DD" strings (as the old MySQL layer returned
    // them) so the frontend's string slicing/compares keep working unchanged.
    Reservation_Date: { type: String, required: true },
    Start_Date: { type: String, required: true },
    End_Date: { type: String, required: true },
    Reservation_Status: { type: String, default: "Pending" },
    Rental_Date: { type: String, default: null },
    Return_Date: { type: String, default: null },
    Rental_Fee: { type: Number, default: 0 },
    Rental_Status: { type: String, default: "Not Started" },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "reservation_rentals", versionKey: false }
);

const ReservationModel =
  mongoose.models.ReservationRental ||
  mongoose.model("ReservationRental", reservationSchema);

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Pipeline stages that attach customer + vehicle fields and drop internal keys,
// mirroring "SELECT rr.*, c.Full_Name, c.National_ID, c.Phone, v.Brand, v.Model,
// v.Year, v.Vehicle_Type FROM Reservation_Rental rr JOIN Customer c JOIN Vehicle v".
const JOIN_STAGES = [
  {
    $lookup: {
      from: "customers",
      localField: "Customer_ID",
      foreignField: "Customer_ID",
      as: "_customer",
    },
  },
  {
    $lookup: {
      from: "vehicles",
      localField: "Plate_Number",
      foreignField: "Plate_Number",
      as: "_vehicle",
    },
  },
  { $unwind: "$_customer" },
  { $unwind: "$_vehicle" },
  {
    $addFields: {
      Full_Name: "$_customer.Full_Name",
      National_ID: "$_customer.National_ID",
      Phone: "$_customer.Phone",
      Brand: "$_vehicle.Brand",
      Model: "$_vehicle.Model",
      Year: "$_vehicle.Year",
      Vehicle_Type: "$_vehicle.Vehicle_Type",
    },
  },
  { $project: { _id: 0, _customer: 0, _vehicle: 0 } },
];

async function findAll(search) {
  const pipeline = [...JOIN_STAGES];
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    pipeline.push({
      $match: {
        $or: [
          { Full_Name: rx },
          { National_ID: rx },
          { Plate_Number: rx },
          { Reservation_Status: rx },
          { Rental_Status: rx },
        ],
      },
    });
  }
  pipeline.push({ $sort: { Reservation_ID: -1 } });
  return ReservationModel.aggregate(pipeline);
}

async function findById(id) {
  const pipeline = [
    { $match: { Reservation_ID: Number(id) } },
    ...JOIN_STAGES,
  ];
  const rows = await ReservationModel.aggregate(pipeline);
  return rows[0] || null;
}

async function create(data, ownerId) {
  const Reservation_ID = await nextSeq("reservation_rentals");
  await ReservationModel.create({
    Reservation_ID,
    Customer_ID: data.Customer_ID,
    Plate_Number: data.Plate_Number,
    Recorded_By: ownerId,
    Reservation_Date: data.Reservation_Date,
    Start_Date: data.Start_Date,
    End_Date: data.End_Date,
    Reservation_Status: data.Reservation_Status,
    Rental_Date: data.Rental_Date || null,
    Return_Date: data.Return_Date || null,
    Rental_Fee: data.Rental_Fee,
    Rental_Status: data.Rental_Status,
  });
  return findById(Reservation_ID);
}

async function update(id, data) {
  await ReservationModel.updateOne(
    { Reservation_ID: Number(id) },
    {
      $set: {
        Customer_ID: data.Customer_ID,
        Plate_Number: data.Plate_Number,
        Reservation_Date: data.Reservation_Date,
        Start_Date: data.Start_Date,
        End_Date: data.End_Date,
        Reservation_Status: data.Reservation_Status,
        Rental_Date: data.Rental_Date || null,
        Return_Date: data.Return_Date || null,
        Rental_Fee: data.Rental_Fee,
        Rental_Status: data.Rental_Status,
      },
    }
  );
  return findById(id);
}

async function remove(id) {
  await ReservationModel.deleteOne({ Reservation_ID: Number(id) });
}

module.exports = { findAll, findById, create, update, remove };
