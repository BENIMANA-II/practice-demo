// MongoDB connection via Mongoose.
// A single MONGODB_URI carries host, credentials, database name and TLS, so the
// same code works for a local mongod and for MongoDB Atlas (just swap the URI).
const mongoose = require("mongoose");

// Fail fast on bad queries instead of silently buffering them forever.
mongoose.set("bufferTimeoutMS", 10000);
mongoose.set("strictQuery", true);

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  // dbName lets Atlas users keep the database out of the URI if they prefer.
  await mongoose.connect(uri, {
    dbName: process.env.DB_NAME || undefined,
    serverSelectionTimeoutMS: 15000,
  });
  return mongoose.connection;
}

module.exports = connectDB;
