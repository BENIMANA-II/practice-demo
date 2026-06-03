// Database shape for a warehouse (depot or branch store).
const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
  {
    warehouseCode: { type: String, required: true, trim: true, uppercase: true },
    warehouseName: { type: String, required: true, trim: true },
    warehouseLocation: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

// warehouseCode is unique per owner.
warehouseSchema.index({ owner: 1, warehouseCode: 1 }, { unique: true });

module.exports = mongoose.model('Warehouse', warehouseSchema);
