// Data-access module for Vehicle. Plate_Number is the natural PK.
// Data is SHARED across approved users; owner_id only records the creator.
const pool = require("../config/db");

async function findAll(search) {
  let sql = "SELECT * FROM Vehicle";
  const params = [];
  if (search) {
    sql +=
      " WHERE (Plate_Number LIKE ? OR Brand LIKE ? OR Model LIKE ? OR Vehicle_Type LIKE ? OR Status LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like, like, like);
  }
  sql += " ORDER BY created_at DESC";
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findById(plate) {
  const [rows] = await pool.query("SELECT * FROM Vehicle WHERE Plate_Number = ?", [plate]);
  return rows[0] || null;
}

async function existsByPlate(plate) {
  const [rows] = await pool.query(
    "SELECT Plate_Number FROM Vehicle WHERE Plate_Number = ?",
    [plate]
  );
  return rows.length > 0;
}

async function create(data, ownerId) {
  await pool.query(
    `INSERT INTO Vehicle (Plate_Number, Brand, Model, Year, Vehicle_Type, Purchase_Price, Status, owner_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.Plate_Number,
      data.Brand,
      data.Model,
      data.Year,
      data.Vehicle_Type,
      data.Purchase_Price,
      data.Status,
      ownerId,
    ]
  );
  return findById(data.Plate_Number);
}

// Plate_Number (PK) is not editable; everything else is.
async function update(plate, data) {
  await pool.query(
    `UPDATE Vehicle SET Brand = ?, Model = ?, Year = ?, Vehicle_Type = ?, Purchase_Price = ?, Status = ?
     WHERE Plate_Number = ?`,
    [
      data.Brand,
      data.Model,
      data.Year,
      data.Vehicle_Type,
      data.Purchase_Price,
      data.Status,
      plate,
    ]
  );
  return findById(plate);
}

async function remove(plate) {
  await pool.query("DELETE FROM Vehicle WHERE Plate_Number = ?", [plate]);
}

async function countReservations(plate) {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS c FROM Reservation_Rental WHERE Plate_Number = ?",
    [plate]
  );
  return rows[0].c;
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
