// Database shape for a product in the catalogue.
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    productCode: { type: String, required: true, trim: true, uppercase: true },
    productName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    quantityInStock: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0.01 },
    supplierName: { type: String, required: true, trim: true },
    dateReceived: { type: Date, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

// productCode is unique per owner (each user keeps their own product catalogue).
productSchema.index({ owner: 1, productCode: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);
