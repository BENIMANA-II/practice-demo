const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const {
  createProduct,
  listProducts,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');

const router = express.Router();

router.post('/', requireAuth, createProduct);
router.get('/', requireAuth, listProducts);
router.put('/:id', requireAuth, updateProduct);
router.delete('/:id', requireAuth, deleteProduct);

module.exports = router;
