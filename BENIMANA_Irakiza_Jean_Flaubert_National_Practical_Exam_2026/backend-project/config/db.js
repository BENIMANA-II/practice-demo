// Connects the app to the MongoDB database.
const mongoose = require('mongoose');

// Wraps mongoose.connect with clear success/failure logging; the caller decides what to do on failure.
async function connectDB(mongoUri) {
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected:', mongoose.connection.name);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
}

module.exports = connectDB;
