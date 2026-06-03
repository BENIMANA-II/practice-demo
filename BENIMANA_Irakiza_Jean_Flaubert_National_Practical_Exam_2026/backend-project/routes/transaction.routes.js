const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const {
  createTransaction,
  listTransactions,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transaction.controller');

const router = express.Router();

router.post('/', requireAuth, createTransaction);
router.get('/', requireAuth, listTransactions);
router.put('/:id', requireAuth, updateTransaction);
router.delete('/:id', requireAuth, deleteTransaction);

module.exports = router;
