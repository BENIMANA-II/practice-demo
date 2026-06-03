// Builds the numbers shown on the Dashboard and the three stock reports,
// using MongoDB aggregation to add things up directly in the database.
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const StockTransaction = require('../models/StockTransaction');

// Maps the daily / weekly / monthly filter to a concrete [start, end] date window (default: today).
function getDateRange(period) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let start;
  if (period === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  } else if (period === 'weekly') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0); // daily
  }
  return { start, end };
}

// Builds a $sum-over-$map expression that totals quantityMoved for a transaction type,
// optionally restricted to the requested period window.
function sumByType(type, period) {
  const typeMatch = { $eq: ['$$t.transactionType', type] };
  const cond = period
    ? { $and: [typeMatch, { $gte: ['$$t.transactionDate', period.start] }, { $lte: ['$$t.transactionDate', period.end] }] }
    : typeMatch;
  return {
    $sum: { $map: { input: '$txns', as: 't', in: { $cond: [cond, '$$t.quantityMoved', 0] } } },
  };
}

// Single aggregation powering the dashboard: counts, a stock-value SUM, and recent activity rows.
async function getDashboard(req, res) {
  try {
    const owner = new mongoose.Types.ObjectId(req.session.userId);
    const { start, end } = getDateRange('daily');

    const [productCount, warehouseCount, transactionCount, todayCount] = await Promise.all([
      Product.countDocuments({ owner }),
      Warehouse.countDocuments({ owner }),
      StockTransaction.countDocuments({ owner }),
      StockTransaction.countDocuments({ owner, transactionDate: { $gte: start, $lte: end } }),
    ]);

    // Total stock value = value of CURRENT available stock per product:
    // (base quantityInStock + stock-in - stock-out) x unitPrice, summed over the user's products.
    const [valueAgg] = await Product.aggregate([
      { $match: { owner } },
      {
        $lookup: {
          from: 'stocktransactions',
          let: { pid: '$_id' },
          pipeline: [{ $match: { $expr: { $and: [{ $eq: ['$product', '$$pid'] }, { $eq: ['$owner', owner] }] } } }],
          as: 'txns',
        },
      },
      {
        $addFields: {
          netQuantity: {
            $add: [
              '$quantityInStock',
              {
                $sum: {
                  $map: {
                    input: '$txns',
                    as: 't',
                    in: {
                      $cond: [{ $eq: ['$$t.transactionType', 'STOCK_IN'] }, '$$t.quantityMoved', { $multiply: [-1, '$$t.quantityMoved'] }],
                    },
                  },
                },
              },
            ],
          },
        },
      },
      { $group: { _id: null, totalStockValue: { $sum: { $multiply: ['$netQuantity', '$unitPrice'] } } } },
    ]);

    const recent = await StockTransaction.find({ owner })
      .populate('product', 'productName unitPrice')
      .populate('warehouse', 'warehouseName')
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(5)
      .lean();

    const recentActivity = recent.map((t) => ({
      _id: t._id,
      productName: t.product ? t.product.productName : 'Unknown',
      warehouseName: t.warehouse ? t.warehouse.warehouseName : 'Unknown',
      transactionType: t.transactionType,
      quantityMoved: t.quantityMoved,
      // Movement value (magnitude); the type tells the sign on the client.
      value: t.product ? t.product.unitPrice * t.quantityMoved : 0,
      transactionDate: t.transactionDate,
    }));

    return res.status(200).json({
      data: {
        stats: {
          totalProducts: productCount,
          totalWarehouses: warehouseCount,
          totalTransactions: transactionCount,
          todayTransactions: todayCount,
          totalStockValue: valueAgg ? valueAgg.totalStockValue : 0,
        },
        recentActivity,
      },
    });
  } catch (error) {
    console.error('getDashboard error:', error);
    return res.status(500).json({ error: 'Unable to load dashboard. Please try again.' });
  }
}

// Available Stock report: per product, base stock + period movements and the all-time available balance.
async function availableStockReport(req, res) {
  try {
    const owner = new mongoose.Types.ObjectId(req.session.userId);
    const period = getDateRange(req.query.period);

    const rows = await Product.aggregate([
      { $match: { owner } },
      {
        $lookup: {
          from: 'stocktransactions',
          let: { pid: '$_id' },
          pipeline: [{ $match: { $expr: { $and: [{ $eq: ['$product', '$$pid'] }, { $eq: ['$owner', owner] }] } } }],
          as: 'txns',
        },
      },
      {
        $addFields: {
          allIn: sumByType('STOCK_IN', null),
          allOut: sumByType('STOCK_OUT', null),
          stockIn: sumByType('STOCK_IN', period),
          stockOut: sumByType('STOCK_OUT', period),
        },
      },
      { $addFields: { available: { $subtract: [{ $add: ['$quantityInStock', '$allIn'] }, '$allOut'] } } },
      {
        $project: {
          _id: 1,
          productCode: 1,
          productName: 1,
          category: 1,
          quantityInStock: 1,
          stockIn: 1,
          stockOut: 1,
          available: 1,
        },
      },
      { $sort: { productName: 1 } },
    ]);

    return res.status(200).json({ data: rows });
  } catch (error) {
    console.error('availableStockReport error:', error);
    return res.status(500).json({ error: 'Unable to load report. Please try again.' });
  }
}

// Shared detailed-list aggregation for the Stock In and Stock Out reports.
async function movementReport(req, res, transactionType) {
  try {
    const owner = new mongoose.Types.ObjectId(req.session.userId);
    const { start, end } = getDateRange(req.query.period);

    const rows = await StockTransaction.aggregate([
      { $match: { owner, transactionType, transactionDate: { $gte: start, $lte: end } } },
      { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'warehouses', localField: 'warehouse', foreignField: '_id', as: 'warehouse' } },
      { $unwind: { path: '$warehouse', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          transactionDate: 1,
          quantityMoved: 1,
          productCode: '$product.productCode',
          productName: '$product.productName',
          warehouseName: '$warehouse.warehouseName',
          // Movement value = quantity moved x the product's unit price.
          value: { $multiply: ['$quantityMoved', { $ifNull: ['$product.unitPrice', 0] }] },
        },
      },
      { $sort: { transactionDate: -1 } },
    ]);

    return res.status(200).json({ data: rows });
  } catch (error) {
    console.error('movementReport error:', error);
    return res.status(500).json({ error: 'Unable to load report. Please try again.' });
  }
}

const stockInReport = (req, res) => movementReport(req, res, 'STOCK_IN');
const stockOutReport = (req, res) => movementReport(req, res, 'STOCK_OUT');

module.exports = { getDashboard, availableStockReport, stockInReport, stockOutReport };
