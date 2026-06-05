// Data-access module for Customer.
// Data is SHARED: every approved user sees and edits the same records.
// owner_id still records WHO created each row, but is not used to filter reads.
const pool = require("../config/db");

// List with optional search across name / national id / phone / email.
async function findAll(search) {
  let sql = "SELECT * FROM Customer";
  const params = [];
  if (search) {
    sql +=
      " WHERE (Full_Name LIKE ? OR National_ID LIKE ? OR Phone LIKE ? OR Email LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  sql += " ORDER BY Customer_ID DESC";
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM Customer WHERE Customer_ID = ?", [id]);
  return rows[0] || null;
}

async function findByNationalId(nationalId) {
  const [rows] = await pool.query("SELECT * FROM Customer WHERE National_ID = ?", [
    nationalId,
  ]);
  return rows[0] || null;
}

async function create(data, ownerId) {
  const [result] = await pool.query(
    `INSERT INTO Customer (Full_Name, National_ID, Phone, Email, Address, owner_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.Full_Name, data.National_ID, data.Phone, data.Email, data.Address, ownerId]
  );
  return findById(result.insertId);
}

async function update(id, data) {
  await pool.query(
    `UPDATE Customer SET Full_Name = ?, National_ID = ?, Phone = ?, Email = ?, Address = ?
     WHERE Customer_ID = ?`,
    [data.Full_Name, data.National_ID, data.Phone, data.Email, data.Address, id]
  );
  return findById(id);
}

async function remove(id) {
  await pool.query("DELETE FROM Customer WHERE Customer_ID = ?", [id]);
}

// Used before delete to block removing a customer that has reservations.
async function countReservations(id) {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS c FROM Reservation_Rental WHERE Customer_ID = ?",
    [id]
  );
  return rows[0].c;
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
