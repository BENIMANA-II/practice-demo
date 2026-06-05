// MySQL connection pool.
// We explicitly pass host, user, password AND database from the environment
// so the connection step is unambiguous, then export the pool for the models.
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Return DATE/DATETIME as plain "YYYY-MM-DD" strings so they are not shifted
  // by the server timezone when serialized to JSON (Rwanda is UTC+2).
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
