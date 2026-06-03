const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const StockTransaction = require('../models/StockTransaction');

const BCRYPT_ROUNDS = 10;

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// Idempotent: each block only runs when its collection is empty, so restarts never duplicate data.
async function seedDatabase() {
  try {
    let admin = await User.findOne({ isAdmin: true });

    if (!admin && (await User.countDocuments()) === 0) {
      const username = (process.env.SEED_ADMIN_USERNAME || 'admin').toLowerCase();
      const password = process.env.SEED_ADMIN_PASSWORD || 'change-me';
      const recoveryCode = process.env.SEED_ADMIN_RECOVERY_CODE || '1234';

      const [passwordHash, recoveryCodeHash] = await Promise.all([
        bcrypt.hash(password, BCRYPT_ROUNDS),
        bcrypt.hash(recoveryCode, BCRYPT_ROUNDS),
      ]);

      admin = await User.create({
        fullName: 'System Administrator',
        username,
        email: 'admin@stockhub.rw',
        phone: '0780000000',
        password: passwordHash,
        recoveryCodeHash,
        isAdmin: true,
      });
      console.log(`Seeded admin user: ${admin.username}`); // never log password/recovery code
    }

    if (!admin) return; // nothing to attach sample data to

    // Sample products (owned by admin) so dashboard/reports render non-empty immediately.
    if ((await Product.countDocuments({ owner: admin._id })) === 0) {
      await Product.insertMany([
        { productCode: 'PRD001', productName: 'Bluetooth Speaker', category: 'Electronics', quantityInStock: 120, unitPrice: 25000, supplierName: 'Kigali Audio Ltd', dateReceived: daysAgo(20), owner: admin._id },
        { productCode: 'PRD002', productName: 'Office Chair', category: 'Furniture', quantityInStock: 40, unitPrice: 65000, supplierName: 'ComfortSeat Rwanda', dateReceived: daysAgo(15), owner: admin._id },
        { productCode: 'PRD003', productName: 'A4 Paper Ream', category: 'Stationery', quantityInStock: 300, unitPrice: 6500, supplierName: 'PaperPlus Ltd', dateReceived: daysAgo(10), owner: admin._id },
      ]);
      console.log('Seeded sample products.');
    }

    if ((await Warehouse.countDocuments({ owner: admin._id })) === 0) {
      await Warehouse.insertMany([
        { warehouseCode: 'WH001', warehouseName: 'Central Depot', warehouseLocation: 'Kigali - Gikondo', owner: admin._id },
        { warehouseCode: 'WH002', warehouseName: 'North Branch Store', warehouseLocation: 'Musanze', owner: admin._id },
      ]);
      console.log('Seeded sample warehouses.');
    }

    if ((await StockTransaction.countDocuments({ owner: admin._id })) === 0) {
      const products = await Product.find({ owner: admin._id }).lean();
      const warehouses = await Warehouse.find({ owner: admin._id }).lean();
      if (products.length && warehouses.length) {
        await StockTransaction.insertMany([
          { product: products[0]._id, warehouse: warehouses[0]._id, transactionDate: new Date(), quantityMoved: 30, transactionType: 'STOCK_IN', owner: admin._id },
          { product: products[0]._id, warehouse: warehouses[0]._id, transactionDate: new Date(), quantityMoved: 10, transactionType: 'STOCK_OUT', owner: admin._id },
          { product: products[1]._id, warehouse: warehouses[1]._id, transactionDate: daysAgo(3), quantityMoved: 15, transactionType: 'STOCK_IN', owner: admin._id },
          { product: products[2]._id, warehouse: warehouses[0]._id, transactionDate: daysAgo(1), quantityMoved: 50, transactionType: 'STOCK_OUT', owner: admin._id },
        ]);
        console.log('Seeded sample stock transactions.');
      }
    }
  } catch (error) {
    console.error('Seeding error:', error.message);
  }
}

module.exports = seedDatabase;
