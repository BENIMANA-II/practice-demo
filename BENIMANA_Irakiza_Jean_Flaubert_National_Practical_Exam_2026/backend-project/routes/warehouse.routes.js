const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const {
  createWarehouse,
  listWarehouses,
  updateWarehouse,
  deleteWarehouse,
} = require('../controllers/warehouse.controller');

const router = express.Router();

router.post('/', requireAuth, createWarehouse);
router.get('/', requireAuth, listWarehouses);
router.put('/:id', requireAuth, updateWarehouse);
router.delete('/:id', requireAuth, deleteWarehouse);

module.exports = router;
