// Data-access module for Reservation_Rental (the movement/event entity).
// Data is SHARED across approved users; Recorded_By only records the creator.
// Joins to Customer + Vehicle so lists/report show names, not ids.
const pool = require("../config/db");

const SELECT_JOINED = `
  SELECT rr.*,
         c.Full_Name, c.National_ID, c.Phone,
         v.Brand, v.Model, v.Year, v.Vehicle_Type
  FROM Reservation_Rental rr
  JOIN Customer c ON c.Customer_ID = rr.Customer_ID
  JOIN Vehicle  v ON v.Plate_Number = rr.Plate_Number
`;

async function findAll(search) {
  let sql = SELECT_JOINED;
  const params = [];
  if (search) {
    sql +=
      " WHERE (c.Full_Name LIKE ? OR c.National_ID LIKE ? OR rr.Plate_Number LIKE ? OR rr.Reservation_Status LIKE ? OR rr.Rental_Status LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like, like, like);
  }
  sql += " ORDER BY rr.Reservation_ID DESC";
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    SELECT_JOINED + " WHERE rr.Reservation_ID = ?",
    [id]
  );
  return rows[0] || null;
}

async function create(data, ownerId) {
  const [result] = await pool.query(
    `INSERT INTO Reservation_Rental
      (Customer_ID, Plate_Number, Recorded_By, Reservation_Date, Start_Date, End_Date,
       Reservation_Status, Rental_Date, Return_Date, Rental_Fee, Rental_Status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.Customer_ID,
      data.Plate_Number,
      ownerId,
      data.Reservation_Date,
      data.Start_Date,
      data.End_Date,
      data.Reservation_Status,
      data.Rental_Date || null,
      data.Return_Date || null,
      data.Rental_Fee,
      data.Rental_Status,
    ]
  );
  return findById(result.insertId);
}

async function update(id, data) {
  await pool.query(
    `UPDATE Reservation_Rental SET
       Customer_ID = ?, Plate_Number = ?, Reservation_Date = ?, Start_Date = ?, End_Date = ?,
       Reservation_Status = ?, Rental_Date = ?, Return_Date = ?, Rental_Fee = ?, Rental_Status = ?
     WHERE Reservation_ID = ?`,
    [
      data.Customer_ID,
      data.Plate_Number,
      data.Reservation_Date,
      data.Start_Date,
      data.End_Date,
      data.Reservation_Status,
      data.Rental_Date || null,
      data.Return_Date || null,
      data.Rental_Fee,
      data.Rental_Status,
      id,
    ]
  );
  return findById(id);
}

async function remove(id) {
  await pool.query("DELETE FROM Reservation_Rental WHERE Reservation_ID = ?", [id]);
}

module.exports = { findAll, findById, create, update, remove };
