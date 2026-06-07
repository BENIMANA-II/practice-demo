// Reports: a dashboard summary and the Customer Vehicle Reservation-Rental report.
// Data is shared across all approved users, so nothing is filtered by owner.
// The report supports a date range (defaults to today).
const mongoose = require("mongoose");
// Requiring the model modules guarantees their schemas are registered before we
// look them up with mongoose.model(...) below.
require("../models/Customer");
require("../models/Vehicle");
require("../models/Reservation");

const Customer = () => mongoose.model("Customer");
const Vehicle = () => mongoose.model("Vehicle");
const Reservation = () => mongoose.model("ReservationRental");

// Dashboard: counts + one SUM, plus a small recent-activity list.
async function dashboard(req, res) {
  try {
    const customers = await Customer().countDocuments();
    const vehicles = await Vehicle().countDocuments();
    const available = await Vehicle().countDocuments({ Status: "Available" });
    const reservations = await Reservation().countDocuments();

    const feeAgg = await Reservation().aggregate([
      { $group: { _id: null, total: { $sum: "$Rental_Fee" } } },
    ]);
    const totalRentalFees = feeAgg.length ? feeAgg[0].total : 0;

    const recent = await Reservation().aggregate([
      {
        $lookup: {
          from: "customers",
          localField: "Customer_ID",
          foreignField: "Customer_ID",
          as: "_customer",
        },
      },
      { $unwind: "$_customer" },
      { $sort: { Reservation_ID: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          Reservation_ID: 1,
          Reservation_Date: 1,
          Reservation_Status: 1,
          Rental_Status: 1,
          Rental_Fee: 1,
          Plate_Number: 1,
          Full_Name: "$_customer.Full_Name",
        },
      },
    ]);

    return res.status(200).json({
      data: {
        counts: {
          customers,
          vehicles,
          availableVehicles: available,
          reservations,
        },
        totalRentalFees: Number(totalRentalFees),
        recent,
      },
    });
  } catch (err) {
    console.error("reports.dashboard:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// Customer Vehicle Reservation-Rental report: one $lookup join, filtered by date range.
async function reservationReport(req, res) {
  try {
    const { from, to } = req.query;
    const today = new Date().toISOString().slice(0, 10);
    const fromDate = from || today;
    const toDate = to || today;

    // Reservation_Date is stored as a "YYYY-MM-DD" string, so a lexicographic
    // range ($gte/$lte) is equivalent to SQL's BETWEEN on a DATE column.
    const dateFilter = { Reservation_Date: { $gte: fromDate, $lte: toDate } };

    const rows = await Reservation().aggregate([
      { $match: dateFilter },
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
        $project: {
          _id: 0,
          Full_Name: "$_customer.Full_Name",
          National_ID: "$_customer.National_ID",
          Phone: "$_customer.Phone",
          Plate_Number: "$_vehicle.Plate_Number",
          Brand: "$_vehicle.Brand",
          Model: "$_vehicle.Model",
          Year: "$_vehicle.Year",
          Vehicle_Type: "$_vehicle.Vehicle_Type",
          Reservation_Date: 1,
          Start_Date: 1,
          End_Date: 1,
          Reservation_Status: 1,
          Rental_Date: 1,
          Return_Date: 1,
          Rental_Fee: 1,
          Rental_Status: 1,
        },
      },
      { $sort: { Reservation_Date: -1, Full_Name: 1 } },
    ]);

    const totalsAgg = await Reservation().aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          records: { $sum: 1 },
          totalFees: { $sum: "$Rental_Fee" },
        },
      },
    ]);
    const totals = totalsAgg.length
      ? { records: totalsAgg[0].records, totalFees: Number(totalsAgg[0].totalFees) }
      : { records: 0, totalFees: 0 };

    return res.status(200).json({
      data: { from: fromDate, to: toDate, rows, totals },
    });
  } catch (err) {
    console.error("reports.reservationReport:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { dashboard, reservationReport };
