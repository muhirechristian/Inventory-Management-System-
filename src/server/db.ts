import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { runDataSeeder } from './seedMoreData.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'hardware.db');
export const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency & performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      username TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      stores TEXT NOT NULL DEFAULT 'store1',
      is_admin INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS login_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      login_at TEXT NOT NULL DEFAULT (datetime('now')),
      logout_at TEXT
    );

    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      location TEXT,
      phone TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT 'pcs',
      cost_price REAL NOT NULL DEFAULT 0,
      selling_price REAL NOT NULL DEFAULT 0,
      min_stock REAL NOT NULL DEFAULT 5,
      pack_units TEXT DEFAULT '[]',
      image_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS store_inventory (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      min_stock_threshold REAL NOT NULL DEFAULT 5,
      last_updated TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(store_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      sale_number TEXT UNIQUE NOT NULL,
      store_id TEXT NOT NULL,
      user_id TEXT,
      user_name TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      subtotal REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      payment_status TEXT NOT NULL DEFAULT 'paid',
      payment_method TEXT NOT NULL DEFAULT 'cash',
      is_deleted INTEGER NOT NULL DEFAULT 0,
      deleted_at TEXT,
      deleted_by TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_sku TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT 'pcs',
      quantity REAL NOT NULL DEFAULT 1,
      selling_price REAL NOT NULL DEFAULT 0,
      buying_price REAL NOT NULL DEFAULT 0,
      total_price REAL NOT NULL DEFAULT 0,
      FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL DEFAULT 'invoice', -- 'invoice', 'dn', 'proforma'
      sale_id TEXT,
      store_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT,
      status TEXT NOT NULL DEFAULT 'paid',
      issue_date TEXT NOT NULL DEFAULT (date('now')),
      due_date TEXT,
      subtotal REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      items_json TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS returns (
      id TEXT PRIMARY KEY,
      return_number TEXT UNIQUE NOT NULL,
      sale_id TEXT,
      store_id TEXT NOT NULL,
      user_id TEXT,
      user_name TEXT,
      customer_name TEXT,
      reason TEXT,
      total_amount REAL NOT NULL DEFAULT 0,
      return_status TEXT NOT NULL DEFAULT 'completed',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS return_items (
      id TEXT PRIMARY KEY,
      return_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      unit TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      FOREIGN KEY(return_id) REFERENCES returns(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS customers_suppliers (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'customer', -- 'customer' or 'supplier'
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      balance REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      amount REAL NOT NULL DEFAULT 0,
      paid_amount REAL NOT NULL DEFAULT 0,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'overdue', 'paid'
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      user_id TEXT,
      user_name TEXT,
      description TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'Other',
      payment_method TEXT NOT NULL DEFAULT 'cash',
      date TEXT NOT NULL DEFAULT (date('now')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stock_adjustments (
      id TEXT PRIMARY KEY,
      adjustment_number TEXT UNIQUE NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      from_store TEXT NOT NULL,
      to_store TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      reason TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_requests (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      product_id TEXT,
      kind TEXT NOT NULL DEFAULT 'new', -- 'new', 'edit'
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sku TEXT,
      unit TEXT NOT NULL,
      price REAL NOT NULL,
      cost_price REAL,
      quantity REAL,
      min_stock REAL,
      pack_units TEXT DEFAULT '[]',
      requested_by TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
      review_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  seedInitialData();
  runDataSeeder();
}

function seedInitialData() {
  // Check if stores exist
  const storeCount = db.prepare('SELECT COUNT(*) as count FROM stores').get() as { count: number };
  if (storeCount.count === 0) {
    const insertStore = db.prepare('INSERT INTO stores (id, name, code, location, phone) VALUES (?, ?, ?, ?, ?)');
    insertStore.run('store1', 'Gisozi', 'store1', 'Gisozi Hardware Market, Kigali', '+250 788 123 456');
    insertStore.run('store2', 'Kinyinya', 'store2', 'Kinyinya Main Road, Kigali', '+250 788 654 321');
  }

  // Check if admin user exists
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin123', salt);
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, username, password_hash, role, stores, is_admin, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertUser.run(
      'user_admin_1',
      'System Administrator',
      'admin@codev.io',
      'admin',
      hash,
      'admin',
      JSON.stringify(['store1', 'store2']),
      1,
      1
    );

    const staffHash = bcrypt.hashSync('staff123', salt);
    insertUser.run(
      'user_staff_1',
      'Eric Mugisha',
      'eric@codev.io',
      'eric',
      staffHash,
      'staff',
      JSON.stringify(['store1']),
      0,
      1
    );

    const managerHash = bcrypt.hashSync('manager123', salt);
    insertUser.run(
      'user_manager_1',
      'Aline Uwase',
      'aline@codev.io',
      'aline',
      managerHash,
      'manager',
      JSON.stringify(['store1', 'store2']),
      0,
      1
    );
  }

  // Check if products exist
  const prodCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (prodCount.count === 0) {
    const productsData = [
      {
        id: 'p_1',
        sku: 'CEM-TOR-50',
        name: 'Tororo Cement 32.5R 50kg',
        category: 'Building Materials',
        unit: 'bags',
        cost_price: 11500,
        selling_price: 13500,
        min_stock: 50,
        pack_units: JSON.stringify([{ name: 'pallet', factor: 40, price: 530000 }]),
        store1_qty: 180,
        store2_qty: 95
      },
      {
        id: 'p_2',
        sku: 'CEM-CIM-50',
        name: 'Cimerwa Blue Plus 42.5N 50kg',
        category: 'Building Materials',
        unit: 'bags',
        cost_price: 12500,
        selling_price: 14800,
        min_stock: 40,
        pack_units: JSON.stringify([{ name: 'pallet', factor: 40, price: 580000 }]),
        store1_qty: 140,
        store2_qty: 60
      },
      {
        id: 'p_3',
        sku: 'IRN-SHT-28',
        name: 'Iron Sheets Gauge 28 (3m Red)',
        category: 'Roofing & Metals',
        unit: 'pcs',
        cost_price: 14000,
        selling_price: 16500,
        min_stock: 30,
        pack_units: JSON.stringify([{ name: 'bundle', factor: 20, price: 320000 }]),
        store1_qty: 85,
        store2_qty: 40
      },
      {
        id: 'p_4',
        sku: 'PNT-SAD-20L',
        name: 'Sadolin Weatherguard White 20L',
        category: 'Paints & Finishes',
        unit: 'buckets',
        cost_price: 68000,
        selling_price: 82000,
        min_stock: 10,
        pack_units: JSON.stringify([]),
        store1_qty: 24,
        store2_qty: 12
      },
      {
        id: 'p_5',
        sku: 'PNT-GLS-4L',
        name: 'Gloss Oil Paint Brilliant White 4L',
        category: 'Paints & Finishes',
        unit: 'tins',
        cost_price: 18000,
        selling_price: 23500,
        min_stock: 15,
        pack_units: JSON.stringify([{ name: 'carton', factor: 4, price: 90000 }]),
        store1_qty: 36,
        store2_qty: 18
      },
      {
        id: 'p_6',
        sku: 'PIP-PVC-110',
        name: 'PVC Drainage Pipe 110mm x 6m',
        category: 'Plumbing',
        unit: 'pcs',
        cost_price: 16000,
        selling_price: 21000,
        min_stock: 15,
        pack_units: JSON.stringify([]),
        store1_qty: 42,
        store2_qty: 25
      },
      {
        id: 'p_7',
        sku: 'PIP-PPR-25',
        name: 'PPR Hot & Cold Water Pipe 25mm x 4m',
        category: 'Plumbing',
        unit: 'pcs',
        cost_price: 4200,
        selling_price: 5800,
        min_stock: 25,
        pack_units: JSON.stringify([{ name: 'bundle', factor: 10, price: 56000 }]),
        store1_qty: 110,
        store2_qty: 55
      },
      {
        id: 'p_8',
        sku: 'ELC-CBL-2.5',
        name: 'Copper Electric Cable 2.5mm² 100m Roll',
        category: 'Electricals',
        unit: 'rolls',
        cost_price: 45000,
        selling_price: 56000,
        min_stock: 8,
        pack_units: JSON.stringify([]),
        store1_qty: 18,
        store2_qty: 9
      },
      {
        id: 'p_9',
        sku: 'ELC-MCB-32A',
        name: 'Schneider Circuit Breaker Single Pole 32A',
        category: 'Electricals',
        unit: 'pcs',
        cost_price: 4800,
        selling_price: 6800,
        min_stock: 20,
        pack_units: JSON.stringify([{ name: 'box', factor: 12, price: 78000 }]),
        store1_qty: 65,
        store2_qty: 30
      },
      {
        id: 'p_10',
        sku: 'NAL-CON-4IN',
        name: 'Steel Concrete Nails 4-inch (Box 1kg)',
        category: 'Fasteners & Hardware',
        unit: 'boxes',
        cost_price: 2800,
        selling_price: 3800,
        min_stock: 20,
        pack_units: JSON.stringify([{ name: 'carton', factor: 20, price: 72000 }]),
        store1_qty: 88,
        store2_qty: 45
      },
      {
        id: 'p_11',
        sku: 'BAR-DEF-12M',
        name: 'Deformed Reinforcement Bar T12 (12m)',
        category: 'Building Materials',
        unit: 'bars',
        cost_price: 13500,
        selling_price: 16200,
        min_stock: 40,
        pack_units: JSON.stringify([]),
        store1_qty: 15, // Low stock in store 1!
        store2_qty: 60
      },
      {
        id: 'p_12',
        sku: 'TLS-WHL-BRW',
        name: 'Heavy Duty Construction Wheelbarrow',
        category: 'Tools & Equipment',
        unit: 'pcs',
        cost_price: 42000,
        selling_price: 54000,
        min_stock: 6,
        pack_units: JSON.stringify([]),
        store1_qty: 4, // Low stock!
        store2_qty: 8
      }
    ];

    const insertProd = db.prepare(`
      INSERT INTO products (id, sku, name, category, unit, cost_price, selling_price, min_stock, pack_units)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertInv = db.prepare(`
      INSERT INTO store_inventory (id, store_id, product_id, quantity, min_stock_threshold)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const p of productsData) {
      insertProd.run(p.id, p.sku, p.name, p.category, p.unit, p.cost_price, p.selling_price, p.min_stock, p.pack_units);
      insertInv.run(`${p.id}_store1`, 'store1', p.id, p.store1_qty, p.min_stock);
      insertInv.run(`${p.id}_store2`, 'store2', p.id, p.store2_qty, p.min_stock);
    }
  }

  // Check if customers/suppliers exist
  const csCount = db.prepare('SELECT COUNT(*) as count FROM customers_suppliers').get() as { count: number };
  if (csCount.count === 0) {
    const insertCS = db.prepare(`
      INSERT INTO customers_suppliers (id, type, name, phone, email, address, balance)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertCS.run('cs_1', 'customer', 'Kigali Prime Builders Ltd', '+250 788 333 444', 'info@primebuilders.rw', 'Kacyiru, Kigali', 150000);
    insertCS.run('cs_2', 'customer', 'Jean Paul Habimana', '+250 783 222 111', 'jp.habimana@gmail.com', 'Gisozi Sector', 0);
    insertCS.run('cs_3', 'customer', 'Horizon Construction Agency', '+250 785 999 888', 'horizon@rwanda.rw', 'Nyarugenge, Kigali', 420000);
    insertCS.run('cs_4', 'supplier', 'Cimerwa Cement Distributors', '+250 788 111 222', 'sales@cimerwa.rw', 'Bugarama / Kigali Depot', 0);
    insertCS.run('cs_5', 'supplier', 'Roto Tanks & Pipes Rwanda', '+250 788 444 555', 'orders@rototanks.rw', 'Special Economic Zone, Masoro', 0);
  }

  // Check if sales exist
  const salesCount = db.prepare('SELECT COUNT(*) as count FROM sales').get() as { count: number };
  if (salesCount.count === 0) {
    const insertSale = db.prepare(`
      INSERT INTO sales (id, sale_number, store_id, user_id, user_name, customer_name, customer_phone, subtotal, discount, total_amount, payment_status, payment_method, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
    `);

    const insertSaleItem = db.prepare(`
      INSERT INTO sale_items (id, sale_id, product_id, product_name, product_sku, unit, quantity, selling_price, buying_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Sale 1
    insertSale.run(
      'sale_1',
      'SAL-2026-0001',
      'store1',
      'user_admin_1',
      'System Administrator',
      'Kigali Prime Builders Ltd',
      '+250 788 333 444',
      270000,
      0,
      270000,
      'paid',
      'bank',
      '-2 hours'
    );
    insertSaleItem.run('si_1', 'sale_1', 'p_1', 'Tororo Cement 32.5R 50kg', 'CEM-TOR-50', 'bags', 20, 13500, 11500, 270000);

    // Sale 2
    insertSale.run(
      'sale_2',
      'SAL-2026-0002',
      'store1',
      'user_staff_1',
      'Eric Mugisha',
      'Jean Paul Habimana',
      '+250 783 222 111',
      105500,
      5500,
      100000,
      'paid',
      'cash',
      '-4 hours'
    );
    insertSaleItem.run('si_2', 'sale_2', 'p_4', 'Sadolin Weatherguard White 20L', 'PNT-SAD-20L', 'buckets', 1, 82000, 68000, 82000);
    insertSaleItem.run('si_3', 'sale_2', 'p_5', 'Gloss Oil Paint Brilliant White 4L', 'PNT-GLS-4L', 'tins', 1, 23500, 18000, 23500);

    // Sale 3 (loan / unpaid)
    insertSale.run(
      'sale_3',
      'SAL-2026-0003',
      'store1',
      'user_admin_1',
      'System Administrator',
      'Horizon Construction Agency',
      '+250 785 999 888',
      420000,
      0,
      420000,
      'unpaid',
      'loan',
      '-1 day'
    );
    insertSaleItem.run('si_4', 'sale_3', 'p_3', 'Iron Sheets Gauge 28 (3m Red)', 'IRN-SHT-28', 'pcs', 20, 16500, 14000, 330000);
    insertSaleItem.run('si_5', 'sale_3', 'p_10', 'Steel Concrete Nails 4-inch (Box 1kg)', 'NAL-CON-4IN', 'boxes', 10, 3800, 2800, 38000);
    insertSaleItem.run('si_6', 'sale_3', 'p_12', 'Heavy Duty Construction Wheelbarrow', 'TLS-WHL-BRW', 'pcs', 1, 54000, 42000, 54000);

    // Corresponding Loan
    const insertLoan = db.prepare(`
      INSERT INTO loans (id, store_id, customer_name, customer_phone, amount, paid_amount, due_date, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, date('now', '+3 days'), 'pending', ?)
    `);
    insertLoan.run('loan_1', 'store1', 'Horizon Construction Agency', '+250 785 999 888', 420000, 0, 'Project in Kagugu, payment expected this week');

    // Corresponding Invoices
    const insertInvoice = db.prepare(`
      INSERT INTO invoices (id, invoice_number, type, sale_id, store_id, customer_name, customer_email, customer_phone, status, issue_date, due_date, subtotal, discount, total_amount, items_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'), ?, ?, ?, ?, ?)
    `);
    insertInvoice.run(
      'inv_1',
      'INV-2026-0001',
      'invoice',
      'sale_1',
      'store1',
      'Kigali Prime Builders Ltd',
      'info@primebuilders.rw',
      '+250 788 333 444',
      'paid',
      dateString(0),
      270000,
      0,
      270000,
      JSON.stringify([{ name: 'Tororo Cement 32.5R 50kg', sku: 'CEM-TOR-50', unit: 'bags', quantity: 20, price: 13500, total: 270000 }])
    );

    // Initial expenses
    const insertExp = db.prepare(`
      INSERT INTO expenses (id, store_id, user_id, user_name, description, amount, category, payment_method, date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'), ?)
    `);
    insertExp.run('exp_1', 'store1', 'user_admin_1', 'System Administrator', 'Truck Transport for Cement delivery from Nyabugogo', 45000, 'Transport', 'cash', 'Offloaded 200 bags');
    insertExp.run('exp_2', 'store1', 'user_staff_1', 'Eric Mugisha', 'Store consumables, cleaning supplies, and receipts paper', 12500, 'Maintenance', 'mobile', 'MoMo payment to supplier');
  }
}

function dateString(daysOffset: number = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}
