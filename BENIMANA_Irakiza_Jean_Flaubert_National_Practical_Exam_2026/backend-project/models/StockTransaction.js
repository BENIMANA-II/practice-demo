// Database shape for one stock movement: a product moving in or out of a warehouse.
const mongoose = require('mongoose');

const TRANSACTION_TYPES = ['STOCK_IN', 'STOCK_OUT'];

const stockTransactionSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    transactionDate: { type: Date, required: true },
    quantityMoved: { type: Number, required: true, min: 1 },
    transactionType: { type: String, required: true, enum: TRANSACTION_TYPES },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
module.exports.TRANSACTION_TYPES = TRANSACTION_TYPES;
