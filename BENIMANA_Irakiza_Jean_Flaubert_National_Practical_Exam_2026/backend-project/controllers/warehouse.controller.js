// Create, list, update and delete warehouses. Every action is limited to the logged-in user's data.
const Warehouse = require('../models/Warehouse');
const StockTransaction = require('../models/StockTransaction');

// Validates and normalizes warehouse input shared by create and update.
function validateWarehouseInput(body) {
  const { warehouseCode, warehouseName, warehouseLocation } = body;
  if (!warehouseCode || !warehouseName || !warehouseLocation) {
    return { error: 'All warehouse fields are required.' };
  }
  return {
    value: {
      warehouseCode: warehouseCode.trim().toUpperCase(),
      warehouseName: warehouseName.trim(),
      warehouseLocation: warehouseLocation.trim(),
    },
  };
}

async function createWarehouse(req, res) {
  try {
    const { error, value } = validateWarehouseInput(req.body);
    if (error) return res.status(400).json({ error });

    const duplicate = await Warehouse.findOne({ owner: req.session.userId, warehouseCode: value.warehouseCode });
    if (duplicate) return res.status(400).json({ error: 'A warehouse with this code already exists.' });

    const warehouse = await Warehouse.create({ ...value, owner: req.session.userId }); // owner set server-side
    return res.status(201).json({ data: warehouse });
  } catch (error) {
    console.error('createWarehouse error:', error);
    return res.status(500).json({ error: 'Unable to add warehouse. Please try again.' });
  }
}

async function listWarehouses(req, res) {
  try {
    const warehouses = await Warehouse.find({ owner: req.session.userId }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ data: warehouses });
  } catch (error) {
    console.error('listWarehouses error:', error);
    return res.status(500).json({ error: 'Unable to load warehouses. Please try again.' });
  }
}

async function updateWarehouse(req, res) {
  try {
    const existing = await Warehouse.findOne({ _id: req.params.id, owner: req.session.userId });
    if (!existing) return res.status(404).json({ error: 'Warehouse not found.' });

    const { error, value } = validateWarehouseInput(req.body);
    if (error) return res.status(400).json({ error });

    const duplicate = await Warehouse.findOne({
      owner: req.session.userId,
      warehouseCode: value.warehouseCode,
      _id: { $ne: existing._id },
    });
    if (duplicate) return res.status(400).json({ error: 'A warehouse with this code already exists.' });

    existing.set(value);
    await existing.save();
    return res.status(200).json({ data: existing });
  } catch (error) {
    console.error('updateWarehouse error:', error);
    return res.status(500).json({ error: 'Unable to update warehouse. Please try again.' });
  }
}

async function deleteWarehouse(req, res) {
  try {
    const warehouse = await Warehouse.findOne({ _id: req.params.id, owner: req.session.userId });
    if (!warehouse) return res.status(404).json({ error: 'Warehouse not found.' });

    // Guard referential integrity: a warehouse still used by transactions cannot be deleted.
    const referenced = await StockTransaction.countDocuments({ warehouse: warehouse._id, owner: req.session.userId });
    if (referenced > 0) {
      return res.status(400).json({ error: 'Cannot delete: this warehouse has stock transactions.' });
    }

    await warehouse.deleteOne();
    return res.status(200).json({ data: { _id: warehouse._id } });
  } catch (error) {
    console.error('deleteWarehouse error:', error);
    return res.status(500).json({ error: 'Unable to delete warehouse. Please try again.' });
  }
}

module.exports = { createWarehouse, listWarehouses, updateWarehouse, deleteWarehouse };
