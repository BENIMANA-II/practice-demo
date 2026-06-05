// Data-access module for Users. Returns plain objects; holds no HTTP logic.
const pool = require("../config/db");

// Public-safe columns (never expose Password or RecoveryCodeHash).
const PUBLIC = "User_ID, UserName, Role, Status, created_at";

async function findByUsername(username) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC} FROM Users WHERE UserName = ?`,
    [username]
  );
  return rows[0] || null;
}

// Includes secret columns — used only for bcrypt.compare during login/recovery.
async function findByUsernameWithSecrets(username) {
  const [rows] = await pool.query(
    "SELECT User_ID, UserName, Role, Status, Password, RecoveryCodeHash FROM Users WHERE UserName = ?",
    [username]
  );
  return rows[0] || null;
}

// All users, newest first — used by the admin approvals page.
async function findAll() {
  const [rows] = await pool.query(`SELECT ${PUBLIC} FROM Users ORDER BY User_ID DESC`);
  return rows;
}

// Admin approves a pending account so it can log in.
async function approve(userId) {
  await pool.query("UPDATE Users SET Status = 'approved' WHERE User_ID = ?", [userId]);
  return findById(userId);
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC} FROM Users WHERE User_ID = ?`,
    [id]
  );
  return rows[0] || null;
}

async function create({ username, passwordHash, role, recoveryHash }) {
  const [result] = await pool.query(
    "INSERT INTO Users (UserName, Password, Role, RecoveryCodeHash) VALUES (?, ?, ?, ?)",
    [username, passwordHash, role || "staff", recoveryHash]
  );
  return findById(result.insertId);
}

async function updatePassword(userId, passwordHash) {
  await pool.query("UPDATE Users SET Password = ? WHERE User_ID = ?", [
    passwordHash,
    userId,
  ]);
}

async function updateRecoveryHash(userId, recoveryHash) {
  await pool.query("UPDATE Users SET RecoveryCodeHash = ? WHERE User_ID = ?", [
    recoveryHash,
    userId,
  ]);
}

module.exports = {
  findByUsername,
  findByUsernameWithSecrets,
  findAll,
  approve,
  findById,
  create,
  updatePassword,
  updateRecoveryHash,
};
