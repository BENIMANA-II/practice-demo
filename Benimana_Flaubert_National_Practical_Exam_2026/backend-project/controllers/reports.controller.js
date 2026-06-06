// Reports: a dashboard summary and the Customer Vehicle Reservation-Rental report.
// Data is shared across all approved users, so nothing is filtered by owner.
// The report supports a date range (defaults to today).
const pool = require("../config/db");

// Dashboard: counts + one SUM, plus a small recent-activity list.
async function dashboard(req, res) {
  try {
    const [[customers]] = await pool.query("SELECT COUNT(*) AS total FROM Customer");
    const [[vehicles]] = await pool.query("SELECT COUNT(*) AS total FROM Vehicle");
    const [[available]] = await pool.query(
      "SELECT COUNT(*) AS total FROM Vehicle WHERE Status = 'Available'"
    );
    const [[reservations]] = await pool.query(
      "SELECT COUNT(*) AS total FROM Reservation_Rental"
    );
    const [[fees]] = await pool.query(
      "SELECT COALESCE(SUM(Rental_Fee), 0) AS total FROM Reservation_Rental"
    );

    const [recent] = await pool.query(
      `SELECT rr.Reservation_ID, rr.Reservation_Date, rr.Reservation_Status, rr.Rental_Status,
              rr.Rental_Fee, c.Full_Name, rr.Plate_Number
       FROM Reservation_Rental rr
       JOIN Customer c ON c.Customer_ID = rr.Customer_ID
       ORDER BY rr.Reservation_ID DESC
       LIMIT 5`
    );

    return res.status(200).json({
      data: {
        counts: {
          customers: customers.total,
          vehicles: vehicles.total,
          availableVehicles: available.total,
          reservations: reservations.total,
        },
        totalRentalFees: Number(fees.total),
        recent,
      },
    });
  } catch (err) {
    console.error("reports.dashboard:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// Customer Vehicle Reservation-Rental report: one JOIN query, filtered by date range.
async function reservationReport(req, res) {
  try {
    const { from, to } = req.query;
    const today = new Date().toISOString().slice(0, 10);
    const fromDate = from || today;
    const toDate = to || today;

    const [rows] = await pool.query(
      `SELECT
         c.Full_Name, c.National_ID, c.Phone,
         v.Plate_Number, v.Brand, v.Model, v.Year, v.Vehicle_Type,
         rr.Reservation_Date, rr.Start_Date, rr.End_Date, rr.Reservation_Status,
         rr.Rental_Date, rr.Return_Date, rr.Rental_Fee, rr.Rental_Status
       FROM Reservation_Rental rr
       JOIN Customer c ON c.Customer_ID = rr.Customer_ID
       JOIN Vehicle  v ON v.Plate_Number = rr.Plate_Number
       WHERE rr.Reservation_Date BETWEEN ? AND ?
       ORDER BY rr.Reservation_Date DESC, c.Full_Name ASC`,
      [fromDate, toDate]
    );

    const [[totals]] = await pool.query(
      `SELECT COUNT(*) AS records, COALESCE(SUM(Rental_Fee), 0) AS totalFees
       FROM Reservation_Rental
       WHERE Reservation_Date BETWEEN ? AND ?`,
      [fromDate, toDate]
    );

    return res.status(200).json({
      data: {
        from: fromDate,
        to: toDate,
        rows,
        totals: { records: totals.records, totalFees: Number(totals.totalFees) },
      },
    });
  } catch (err) {
    console.error("reports.reservationReport:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { dashboard, reservationReport };
