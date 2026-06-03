// Create, list, update and delete stock movements, and make sure a stock-out never
// removes more than is actually available. All actions are limited to the logged-in user.
const mongoose = require('mongoose');
const StockTransaction = require('../models/StockTransaction');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');

const { TRANSACTION_TYPES } = StockTransaction;

// Computes a product's available stock for the current owner: base stock + all stock-in - all stock-out.
// `excludeId` lets an update ignore the transaction being edited so it isn't double-counted.
async function getAvailableStock(productId, ownerId, excludeId = null) {
  const product = await Product.findOne({ _id: productId, owner: ownerId }).lean();
  if (!product) return null;

  const match = { product: new mongoose.Types.ObjectId(productId), owner: new mongoose.Types.ObjectId(ownerId) };
  if (excludeId) match._id = { $ne: new mongoose.Types.ObjectId(excludeId) };

  const [totals] = await StockTransaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalIn: { $sum: { $cond: [{ $eq: ['$transactionType', 'STOCK_IN'] }, '$quantityMoved', 0] } },
        totalOut: { $sum: { $cond: [{ $eq: ['$transactionType', 'STOCK_OUT'] }, '$quantityMoved', 0] } },
      },
    },
  ]);

  const totalIn = totals ? totals.totalIn : 0;
  const totalOut = totals ? totals.totalOut : 0;
  return product.quantityInStock + totalIn - totalOut;
}

async function validateTransactionInput(body, ownerId, excludeId = null) {
  const { product, warehouse, transactionDate, quantityMoved, transactionType } = body;

  if (!product || !warehouse || !transactionDate || !transactionType) {
    return { error: 'Product, warehouse, date and type are all required.' };
  }
  if (!TRANSACTION_TYPES.includes(transactionType)) {
    return { error: 'Transaction type must be STOCK_IN or STOCK_OUT.' };
  }
  const quantity = Number(quantityMoved);
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { error: 'Quantity moved must be a whole number of at least 1.' };
  }
  if (new Date(transactionDate) > new Date()) {
    return { error: 'Transaction date cannot be in the future.' };
  }

  const productDoc = await Product.findOne({ _id: product, owner: ownerId }).lean();
  if (!productDoc) return { error: 'Selected product was not found.' };
  const warehouseDoc = await Warehouse.findOne({ _id: warehouse, owner: ownerId }).lean();
  if (!warehouseDoc) return { error: 'Selected warehouse was not found.' };

  // A stock-out can never remove more than is currently available.
  if (transactionType === 'STOCK_OUT') {
    const available = await getAvailableStock(product, ownerId, excludeId);
    if (quantity > available) {
      return { error: `Stock-out (${quantity}) exceeds available stock (${available}).` };
    }
  }

  return { value: { product, warehouse, transactionDate, quantityMoved: quantity, transactionType } };
}

async function populated(id) {
  return StockTransaction.findById(id)
    .populate('product', 'productCode productName')
    .populate('warehouse', 'warehouseCode warehouseName')
    .lean();
}

async function createTransaction(req, res) {
  try {
    const { error, value } = await validateTransactionInput(req.body, req.session.userId);
    if (error) return res.status(400).json({ error });

    const created = await StockTransaction.create({ ...value, owner: req.session.userId });
    return res.status(201).json({ data: await populated(created._id) });
  } catch (err) {
    console.error('createTransaction error:', err);
    return res.status(500).json({ error: 'Unable to record transaction. Please try again.' });
  }
}

async function listTransactions(req, res) {
  try {
    const transactions = await StockTransaction.find({ owner: req.session.userId })
      .populate('product', 'productCode productName')
      .populate('warehouse', 'warehouseCode warehouseName')
      .sort({ transactionDate: -1, createdAt: -1 })
      .lean();
    return res.status(200).json({ data: transactions });
  } catch (err) {
    console.error('listTransactions error:', err);
    return res.status(500).json({ error: 'Unable to load transactions. Please try again.' });
  }
}

async function updateTransaction(req, res) {
  try {
    const existing = await StockTransaction.findOne({ _id: req.params.id, owner: req.session.userId });
    if (!existing) return res.status(404).json({ error: 'Transaction not found.' });

    const { error, value } = await validateTransactionInput(req.body, req.session.userId, existing._id);
    if (error) return res.status(400).json({ error });

    existing.set(value);
    await existing.save();
    return res.status(200).json({ data: await populated(existing._id) });
  } catch (err) {
    console.error('updateTransaction error:', err);
    return res.status(500).json({ error: 'Unable to update transaction. Please try again.' });
  }
}

async function deleteTransaction(req, res) {
  try {
    // Row-level delete only — scoped to the owner so users cannot remove others' records.
    const deleted = await StockTransaction.findOneAndDelete({ _id: req.params.id, owner: req.session.userId });
    if (!deleted) return res.status(404).json({ error: 'Transaction not found.' });
    return res.status(200).json({ data: { _id: deleted._id } });
  } catch (err) {
    console.error('deleteTransaction error:', err);
    return res.status(500).json({ error: 'Unable to delete transaction. Please try again.' });
  }
}

module.exports = { createTransaction, listTransactions, updateTransaction, deleteTransaction };
