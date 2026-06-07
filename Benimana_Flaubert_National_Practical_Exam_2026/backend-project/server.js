// VRS backend entry point: Express + cors + sessions + MongoDB.
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const { seedData } = require("./config/seed");
const requireAuth = require("./middleware/requireAuth");
const requireAdmin = require("./middleware/requireAdmin");

const authRoutes = require("./routes/auth.routes");
const customerRoutes = require("./routes/customer.routes");
const vehicleRoutes = require("./routes/vehicle.routes");
const reservationRoutes = require("./routes/reservation.routes");
const reportsRoutes = require("./routes/reports.routes");
const userRoutes = require("./routes/user.routes");

// --- Validate required configuration before doing anything else. ---
const required = ["SESSION_SECRET", "MONGODB_URI"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("Missing required env vars: " + missing.join(", "));
  console.error("Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === "production";

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(rateLimit({ windowMs: 60 * 1000, max: 200 }));

if (isProd) app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  })
);

// Public auth routes; everything else requires a session.
app.use("/api/auth", authRoutes);
app.use("/api/customers", requireAuth, customerRoutes);
app.use("/api/vehicles", requireAuth, vehicleRoutes);
app.use("/api/reservations", requireAuth, reservationRoutes);
app.use("/api/reports", requireAuth, reportsRoutes);
// User management is admin-only.
app.use("/api/users", requireAuth, requireAdmin, userRoutes);

app.get("/api/health", (req, res) => res.json({ data: { status: "ok" } }));

// --- Start: connect to MongoDB, seed, then listen. ---
async function start() {
  try {
    await connectDB();
    console.log("Connected to MongoDB.");
    await seedData();
    app.listen(PORT, () => {
      console.log(`VRS backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
