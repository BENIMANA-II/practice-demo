// Idempotent seeding for MongoDB.
// Collections and indexes are created lazily by Mongoose on first write, so there
// is no schema step (unlike MySQL). We just seed one admin (from env) and a few
// sample rows owned by that admin, never duplicating on restart.
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Customer = require("../models/Customer");
const Vehicle = require("../models/Vehicle");
const Reservation = require("../models/Reservation");

async function seedData() {
  const username = process.env.SEED_ADMIN_USERNAME || "admin";
  const password = process.env.SEED_ADMIN_PASSWORD || "change-me";
  const recoveryCode = process.env.SEED_ADMIN_RECOVERY_CODE || "1234";

  // 1) Ensure the admin exists, then force it to an approved admin (covers
  //    upgrades from older databases the same way the MySQL seed did).
  let admin = await User.findByUsername(username);
  if (!admin) {
    const passwordHash = await bcrypt.hash(password, 10);
    const recoveryHash = await bcrypt.hash(recoveryCode, 10);
    admin = await User.create({ username, passwordHash, role: "admin", recoveryHash });
    console.log(`Seeded admin user "${username}".`);
  }
  await User.approve(admin.User_ID);
  // approve() only sets Status; make sure the role is admin too.
  const mongoose = require("mongoose");
  await mongoose
    .model("User")
    .updateOne({ User_ID: admin.User_ID }, { $set: { Role: "admin", Status: "approved" } });
  const adminId = admin.User_ID;

  // 2) Sample customers
  const customerCount = await mongoose.model("Customer").countDocuments({ owner_id: adminId });
  if (customerCount === 0) {
    await Customer.create(
      {
        Full_Name: "Alice Mukamana",
        National_ID: "1199870012345678",
        Phone: "0788123456",
        Email: "alice@example.com",
        Address: "Huye, Southern Province",
      },
      adminId
    );
    await Customer.create(
      {
        Full_Name: "Eric Niyonzima",
        National_ID: "1198880087654321",
        Phone: "0722987654",
        Email: "eric@example.com",
        Address: "Tumba, Huye",
      },
      adminId
    );
  }

  // 3) Sample vehicles
  const vehicleCount = await mongoose.model("Vehicle").countDocuments({ owner_id: adminId });
  if (vehicleCount === 0) {
    await Vehicle.create(
      {
        Plate_Number: "RAB 123 A",
        Brand: "Toyota",
        Model: "RAV4",
        Year: 2021,
        Vehicle_Type: "SUV",
        Purchase_Price: 28000000,
        Status: "Available",
      },
      adminId
    );
    await Vehicle.create(
      {
        Plate_Number: "RAC 456 B",
        Brand: "Hyundai",
        Model: "Tucson",
        Year: 2020,
        Vehicle_Type: "SUV",
        Purchase_Price: 24000000,
        Status: "Available",
      },
      adminId
    );
  }

  // 4) One sample reservation (dated today) linking the first customer + vehicle
  const rrCount = await mongoose
    .model("ReservationRental")
    .countDocuments({ Recorded_By: adminId });
  if (rrCount === 0) {
    const cust = await mongoose
      .model("Customer")
      .findOne({ owner_id: adminId })
      .sort({ Customer_ID: 1 })
      .lean();
    const veh = await mongoose
      .model("Vehicle")
      .findOne({ owner_id: adminId })
      .sort({ Plate_Number: 1 })
      .lean();
    if (cust && veh) {
      const today = new Date().toISOString().slice(0, 10);
      await Reservation.create(
        {
          Customer_ID: cust.Customer_ID,
          Plate_Number: veh.Plate_Number,
          Reservation_Date: today,
          Start_Date: today,
          End_Date: today,
          Reservation_Status: "Confirmed",
          Rental_Date: today,
          Return_Date: null,
          Rental_Fee: 150000,
          Rental_Status: "Ongoing",
        },
        adminId
      );
    }
  }
}

module.exports = { seedData };
