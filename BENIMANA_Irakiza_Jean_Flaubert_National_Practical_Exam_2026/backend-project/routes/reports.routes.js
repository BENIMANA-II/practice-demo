const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const {
  getDashboard,
  availableStockReport,
  stockInReport,
  stockOutReport,
} = require('../controllers/reports.controller');

const router = express.Router();

router.get('/dashboard', requireAuth, getDashboard);
router.get('/available-stock', requireAuth, availableStockReport);
router.get('/stock-in', requireAuth, stockInReport);
router.get('/stock-out', requireAuth, stockOutReport);

module.exports = router;
