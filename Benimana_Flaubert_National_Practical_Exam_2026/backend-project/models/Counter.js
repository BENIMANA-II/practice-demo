// Auto-increment helper. MongoDB has no AUTO_INCREMENT, so we keep a tiny
// "counters" collection ({ _id: <name>, seq: <number> }) and atomically bump it.
// This lets us preserve the integer primary keys (User_ID, Customer_ID,
// Reservation_ID) the frontend and API contract expect.
const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

// Returns the next integer in the named sequence (1, 2, 3, ...).
async function nextSeq(name) {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
}

module.exports = { Counter, nextSeq };
