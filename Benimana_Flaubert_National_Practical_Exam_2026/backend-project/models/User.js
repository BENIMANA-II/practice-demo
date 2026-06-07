// Data-access module for Users (MongoDB/Mongoose).
// Keeps the SAME function names and return shapes the old MySQL module had, so
// the controllers and the frontend are unaffected: User_ID stays an integer and
// secret fields (Password, RecoveryCodeHash) are never returned by default.
const mongoose = require("mongoose");
const { nextSeq } = require("./Counter");

const userSchema = new mongoose.Schema(
  {
    User_ID: { type: Number, unique: true, index: true },
    UserName: { type: String, required: true, unique: true },
    Password: { type: String, required: true },
    Role: { type: String, default: "staff" },
    // New accounts start 'pending' and need admin approval before they can log in.
    Status: { type: String, default: "pending" },
    RecoveryCodeHash: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "users", versionKey: false }
);

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

// Public-safe projection (never expose Password or RecoveryCodeHash).
const PUBLIC = "-_id User_ID UserName Role Status created_at";

async function findByUsername(username) {
  return UserModel.findOne({ UserName: username }).select(PUBLIC).lean();
}

// Includes secret fields — used only for bcrypt.compare during login/recovery.
async function findByUsernameWithSecrets(username) {
  return UserModel.findOne({ UserName: username })
    .select("-_id User_ID UserName Role Status Password RecoveryCodeHash")
    .lean();
}

// All users, newest first — used by the admin approvals page.
async function findAll() {
  return UserModel.find().select(PUBLIC).sort({ User_ID: -1 }).lean();
}

// Admin approves a pending account so it can log in.
async function approve(userId) {
  await UserModel.updateOne({ User_ID: Number(userId) }, { $set: { Status: "approved" } });
  return findById(userId);
}

async function findById(id) {
  return UserModel.findOne({ User_ID: Number(id) }).select(PUBLIC).lean();
}

async function create({ username, passwordHash, role, recoveryHash }) {
  const User_ID = await nextSeq("users");
  await UserModel.create({
    User_ID,
    UserName: username,
    Password: passwordHash,
    Role: role || "staff",
    RecoveryCodeHash: recoveryHash,
  });
  return findById(User_ID);
}

async function updatePassword(userId, passwordHash) {
  await UserModel.updateOne({ User_ID: Number(userId) }, { $set: { Password: passwordHash } });
}

async function updateRecoveryHash(userId, recoveryHash) {
  await UserModel.updateOne(
    { User_ID: Number(userId) },
    { $set: { RecoveryCodeHash: recoveryHash } }
  );
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
