// Create, list, update and delete products. Every action is limited to the logged-in user's data.
const Product = require('../models/Product');
const StockTransaction = require('../models/StockTransaction');

// Validates and normalizes product input shared by create and update.
function validateProductInput(body) {
  const { productCode, productName, category, quantityInStock, unitPrice, supplierName, dateReceived } = body;
  if (!productCode || !productName || !category || !supplierName || !dateReceived) {
    return { error: 'All product fields are required.' };
  }
  const quantity = Number(quantityInStock);
  const price = Number(unitPrice);
  if (!Number.isInteger(quantity) || quantity < 0) {
    return { error: 'Quantity in stock must be a non-negative whole number.' };
  }
  if (!(price > 0)) {
    return { error: 'Unit price must be greater than zero.' };
  }
  if (new Date(dateReceived) > new Date()) {
    return { error: 'Date received cannot be in the future.' };
  }
  return {
    value: {
      productCode: productCode.trim().toUpperCase(),
      productName: productName.trim(),
      category: category.trim(),
      quantityInStock: quantity,
      unitPrice: price,
      supplierName: supplierName.trim(),
      dateReceived,
    },
  };
}

async function createProduct(req, res) {
  try {
    const { error, value } = validateProductInput(req.body);
    if (error) return res.status(400).json({ error });

    const duplicate = await Product.findOne({ owner: req.session.userId, productCode: value.productCode });
    if (duplicate) return res.status(400).json({ error: 'A product with this code already exists.' });

    const product = await Product.create({ ...value, owner: req.session.userId }); // owner set server-side
    return res.status(201).json({ data: product });
  } catch (error) {
    console.error('createProduct error:', error);
    return res.status(500).json({ error: 'Unable to add product. Please try again.' });
  }
}

async function listProducts(req, res) {
  try {
    const products = await Product.find({ owner: req.session.userId }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ data: products });
  } catch (error) {
    console.error('listProducts error:', error);
    return res.status(500).json({ error: 'Unable to load products. Please try again.' });
  }
}

async function updateProduct(req, res) {
  try {
    const existing = await Product.findOne({ _id: req.params.id, owner: req.session.userId });
    if (!existing) return res.status(404).json({ error: 'Product not found.' });

    const { error, value } = validateProductInput(req.body);
    if (error) return res.status(400).json({ error });

    // Reject a duplicate code on another product owned by the same user.
    const duplicate = await Product.findOne({
      owner: req.session.userId,
      productCode: value.productCode,
      _id: { $ne: existing._id },
    });
    if (duplicate) return res.status(400).json({ error: 'A product with this code already exists.' });

    existing.set(value);
    await existing.save();
    return res.status(200).json({ data: existing });
  } catch (error) {
    console.error('updateProduct error:', error);
    return res.status(500).json({ error: 'Unable to update product. Please try again.' });
  }
}

async function deleteProduct(req, res) {
  try {
    const product = await Product.findOne({ _id: req.params.id, owner: req.session.userId });
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    // Guard referential integrity: a product still used by transactions cannot be deleted.
    const referenced = await StockTransaction.countDocuments({ product: product._id, owner: req.session.userId });
    if (referenced > 0) {
      return res.status(400).json({ error: 'Cannot delete: this product has stock transactions.' });
    }

    await product.deleteOne();
    return res.status(200).json({ data: { _id: product._id } });
  } catch (error) {
    console.error('deleteProduct error:', error);
    return res.status(500).json({ error: 'Unable to delete product. Please try again.' });
  }
}

module.exports = { createProduct, listProducts, updateProduct, deleteProduct };
