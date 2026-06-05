// Database bootstrap + idempotent seeding.
// 1) create the VRS database if missing, 2) create the tables (schema.sql),
// 3) seed one admin (from env) and a few sample rows owned by that admin.
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const pool = require("./db");

// Step 1 + 2: create database and tables. Uses its own connection (with
// multipleStatements) because the schema file holds several statements and the
// database may not exist yet when the app first starts.
async function initializeDatabase() {
  const admin = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });

  await admin.query(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` ` +
      `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await admin.changeUser({ database: process.env.DB_NAME });

  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await admin.query(schema);

  // Migration: add Users.Status to databases created before the approval feature.
  // (CREATE TABLE IF NOT EXISTS will not alter an already-existing table.)
  const [cols] = await admin.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND LOWER(TABLE_NAME) = 'users' AND LOWER(COLUMN_NAME) = 'status'`,
    [process.env.DB_NAME]
  );
  if (cols.length === 0) {
    await admin.query(
      "ALTER TABLE Users ADD COLUMN Status VARCHAR(20) NOT NULL DEFAULT 'pending'"
    );
  }

  await admin.end();
}

// Step 3: seed admin + sample data. Never duplicates on restart.
async function seedData() {
  const username = process.env.SEED_ADMIN_USERNAME || "admin";
  const password = process.env.SEED_ADMIN_PASSWORD || "change-me";
  const recoveryCode = process.env.SEED_ADMIN_RECOVERY_CODE || "1234";

  const [existing] = await pool.query(
    "SELECT User_ID FROM Users WHERE UserName = ?",
    [username]
  );

  let adminId;
  if (existing.length > 0) {
    adminId = existing[0].User_ID;
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    const recoveryHash = await bcrypt.hash(recoveryCode, 10);
    const [result] = await pool.query(
      "INSERT INTO Users (UserName, Password, Role, Status, RecoveryCodeHash) VALUES (?, ?, ?, ?, ?)",
      [username, passwordHash, "admin", "approved", recoveryHash]
    );
    adminId = result.insertId;
    console.log(`Seeded admin user "${username}".`);
  }

  // The admin is always an approved admin (covers upgrades from older databases).
  await pool.query(
    "UPDATE Users SET Role = 'admin', Status = 'approved' WHERE User_ID = ?",
    [adminId]
  );

  // Sample customers
  const [customerCount] = await pool.query(
    "SELECT COUNT(*) AS c FROM Customer WHERE owner_id = ?",
    [adminId]
  );
  if (customerCount[0].c === 0) {
    await pool.query(
      `INSERT INTO Customer (Full_Name, National_ID, Phone, Email, Address, owner_id)
       VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)`,
      [
        "Alice Mukamana", "1199870012345678", "0788123456", "alice@example.com", "Huye, Southern Province", adminId,
        "Eric Niyonzima", "1198880087654321", "0722987654", "eric@example.com", "Tumba, Huye", adminId,
      ]
    );
  }

  // Sample vehicles
  const [vehicleCount] = await pool.query(
    "SELECT COUNT(*) AS c FROM Vehicle WHERE owner_id = ?",
    [adminId]
  );
  if (vehicleCount[0].c === 0) {
    await pool.query(
      `INSERT INTO Vehicle (Plate_Number, Brand, Model, Year, Vehicle_Type, Purchase_Price, Status, owner_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "RAB 123 A", "Toyota", "RAV4", 2021, "SUV", 28000000, "Available", adminId,
        "RAC 456 B", "Hyundai", "Tucson", 2020, "SUV", 24000000, "Available", adminId,
      ]
    );
  }

  // One sample reservation (dated today) linking the first customer + vehicle
  const [rrCount] = await pool.query(
    "SELECT COUNT(*) AS c FROM Reservation_Rental WHERE Recorded_By = ?",
    [adminId]
  );
  if (rrCount[0].c === 0) {
    const [cust] = await pool.query(
      "SELECT Customer_ID FROM Customer WHERE owner_id = ? ORDER BY Customer_ID LIMIT 1",
      [adminId]
    );
    const [veh] = await pool.query(
      "SELECT Plate_Number FROM Vehicle WHERE owner_id = ? ORDER BY Plate_Number LIMIT 1",
      [adminId]
    );
    if (cust.length && veh.length) {
      const today = new Date().toISOString().slice(0, 10);
      await pool.query(
        `INSERT INTO Reservation_Rental
          (Customer_ID, Plate_Number, Recorded_By, Reservation_Date, Start_Date, End_Date,
           Reservation_Status, Rental_Date, Return_Date, Rental_Fee, Rental_Status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cust[0].Customer_ID, veh[0].Plate_Number, adminId,
          today, today, today, "Confirmed", today, null, 150000, "Ongoing",
        ]
      );
    }
  }
}

module.exports = { initializeDatabase, seedData };
