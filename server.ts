import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, initDatabase } from './src/server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB schema & seed data
initDatabase();

import http from 'http';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const server = http.createServer(app);
const JWT_SECRET = process.env.JWT_SECRET || 'codev_business_secret_key_2026';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Auth Helper
interface SessionUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: string;
  stores: string[];
  isAdmin: boolean;
  activeStore: string;
}

function getSessionUser(req: Request): SessionUser | null {
  const token = req.cookies['auth_token'];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    // ensure active store
    const userStoreCookie = req.cookies['active_store'];
    const activeStore = userStoreCookie && ['store1', 'store2'].includes(userStoreCookie)
      ? userStoreCookie
      : (payload.stores && payload.stores[0]) || 'store1';

    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      username: payload.username,
      role: payload.role,
      stores: payload.stores || ['store1'],
      isAdmin: !!payload.isAdmin,
      activeStore
    };
  } catch {
    return null;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  (req as any).user = user;
  next();
}

// ==================== AUTH APIS ====================

app.get('/api/auth/session', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.json({ success: false, user: null });
  }
  return res.json({ success: true, user });
});

app.post('/api/auth/setup', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long' });
    }

    // Check if an admin already exists
    const adminCheck = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1').get() as { count: number };
    if (adminCheck.count > 0) {
      return res.status(400).json({ success: false, error: 'Administrator already set up. Please log in.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const id = 'user_' + Date.now();
    const stores = JSON.stringify(['store1', 'store2']);

    db.prepare(`
      INSERT INTO users (id, name, email, username, password_hash, role, stores, is_admin, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
    `).run(id, name.trim(), email.trim(), email.split('@')[0], hash, 'admin', stores);

    // log
    db.prepare(`
      INSERT INTO login_logs (id, user_id, name, email, role, login_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run('log_' + Date.now(), id, name, email, 'admin');

    const token = jwt.sign(
      { id, name, email, role: 'admin', stores: ['store1', 'store2'], isAdmin: true },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('auth_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 86400 * 1000 });
    res.cookie('active_store', 'store1', { httpOnly: false, sameSite: 'lax', maxAge: 7 * 86400 * 1000 });

    return res.json({
      success: true,
      data: { id, name, email, role: 'admin', stores: ['store1', 'store2'], isAdmin: true, activeStore: 'store1' }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Setup failed' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Email or username and password are required' });
    }

    const user = db.prepare(`
      SELECT * FROM users WHERE (email = ? OR username = ?) AND is_active = 1
    `).get(username.trim().toLowerCase(), username.trim().toLowerCase()) as any;

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    let parsedStores: string[] = ['store1'];
    try {
      parsedStores = JSON.parse(user.stores);
    } catch {
      parsedStores = [user.stores || 'store1'];
    }

    const activeStore = parsedStores[0] || 'store1';

    // Record login log
    db.prepare(`
      INSERT INTO login_logs (id, user_id, name, email, role, login_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run('log_' + Date.now(), user.id, user.name, user.email, user.role);

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        stores: parsedStores,
        isAdmin: !!user.is_admin
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('auth_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 86400 * 1000 });
    res.cookie('active_store', activeStore, { httpOnly: false, sameSite: 'lax', maxAge: 7 * 86400 * 1000 });

    return res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        stores: parsedStores,
        isAdmin: !!user.is_admin,
        activeStore
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Login failed' });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (user) {
    // update latest login log with logout_at
    try {
      db.prepare(`
        UPDATE login_logs SET logout_at = datetime('now')
        WHERE user_id = ? AND logout_at IS NULL
      `).run(user.id);
    } catch {}
  }
  res.clearCookie('auth_token');
  return res.json({ success: true, message: 'Logged out successfully' });
});

app.post('/api/auth/heartbeat', requireAuth, (req: Request, res: Response) => {
  return res.json({ success: true, timestamp: Date.now() });
});

app.post('/api/auth/switch-store', requireAuth, (req: Request, res: Response) => {
  const { store } = req.body;
  if (!['store1', 'store2'].includes(store)) {
    return res.status(400).json({ success: false, error: 'Invalid store identifier' });
  }
  const user = (req as any).user as SessionUser;
  if (!user.isAdmin && !user.stores.includes(store)) {
    return res.status(403).json({ success: false, error: 'You do not have access to this store' });
  }

  res.cookie('active_store', store, { httpOnly: false, sameSite: 'lax', maxAge: 7 * 86400 * 1000 });
  return res.json({ success: true, store });
});

// ==================== DASHBOARD APIS ====================

app.get('/api/dashboard/stats', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SessionUser;
  const store = (req.query.store as string) || user.activeStore || 'store1';

  try {
    // 1. Product count
    const prodCountRes = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
    const productCount = prodCountRes.count;

    // 2. Stock value in this store
    const stockValRes = db.prepare(`
      SELECT SUM(p.cost_price * si.quantity) as totalVal
      FROM products p
      JOIN store_inventory si ON p.id = si.product_id
      WHERE si.store_id = ?
    `).get(store) as { totalVal: number | null };
    const stockValue = stockValRes.totalVal || 0;

    // 3. Sales today in this store
    const salesTodayRes = db.prepare(`
      SELECT
        COUNT(*) as salesCount,
        COALESCE(SUM(total_amount), 0) as totalRevenue,
        COALESCE(SUM(subtotal), 0) as totalSubtotal
      FROM sales
      WHERE store_id = ? AND is_deleted = 0 AND date(created_at) = date('now')
    `).get(store) as { salesCount: number; totalRevenue: number; totalSubtotal: number };

    // 4. Returns today
    const returnsTodayRes = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as returnVal
      FROM returns
      WHERE store_id = ? AND date(created_at) = date('now')
    `).get(store) as { returnVal: number };

    // 5. Loans today
    const loansTodayRes = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as loanVal
      FROM loans
      WHERE store_id = ? AND date(created_at) = date('now')
    `).get(store) as { loanVal: number };

    // 6. Cost of sales today
    const costOfSalesRes = db.prepare(`
      SELECT COALESCE(SUM(si.buying_price * si.quantity), 0) as totalCost
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.store_id = ? AND s.is_deleted = 0 AND date(s.created_at) = date('now')
    `).get(store) as { totalCost: number };

    // 7. Expenses today
    const expensesTodayRes = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as expenseVal
      FROM expenses
      WHERE store_id = ? AND date(date) = date('now')
    `).get(store) as { expenseVal: number };

    // 8. Payments by method today
    const paymentsRes = db.prepare(`
      SELECT payment_method, COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE store_id = ? AND is_deleted = 0 AND date(created_at) = date('now')
      GROUP BY payment_method
    `).all(store) as { payment_method: string; total: number }[];

    const paymentsByMethod = { cash: 0, bank: 0, mobile: 0 };
    for (const p of paymentsRes) {
      if (p.payment_method === 'cash') paymentsByMethod.cash = p.total;
      else if (p.payment_method === 'bank') paymentsByMethod.bank = p.total;
      else if (p.payment_method === 'mobile' || p.payment_method === 'momo') paymentsByMethod.mobile = p.total;
    }

    const revenueToday = salesTodayRes.totalRevenue;
    const returnsToday = returnsTodayRes.returnVal;
    const costOfSalesToday = costOfSalesRes.totalCost;
    const expensesToday = expensesTodayRes.expenseVal;
    const profitToday = revenueToday - costOfSalesToday - expensesToday - returnsToday;

    // 9. Recent Sales (last 5)
    const recentSalesRaw = db.prepare(`
      SELECT s.id as _id, s.sale_number, s.customer_name, s.total_amount, s.created_at,
             (SELECT SUM(quantity) FROM sale_items WHERE sale_id = s.id) as quantitySold,
             (SELECT GROUP_CONCAT(DISTINCT unit) FROM sale_items WHERE sale_id = s.id) as units
      FROM sales s
      WHERE s.store_id = ? AND s.is_deleted = 0
      ORDER BY s.created_at DESC
      LIMIT 5
    `).all(store) as any[];

    const recentSales = recentSalesRaw.map(r => ({
      _id: r._id,
      saleNumber: r.sale_number,
      customerName: r.customer_name,
      totalAmount: r.total_amount,
      createdAt: r.created_at,
      quantitySold: r.quantitySold || 1,
      units: r.units ? r.units.split(',') : ['pcs']
    }));

    // 10. Top moving products in this store
    const topMoving = db.prepare(`
      SELECT
        p.name,
        p.sku,
        p.unit,
        COALESCE(SUM(si.quantity), 0) as soldQuantity,
        COALESCE(SUM(si.total_price), 0) as salesValue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.store_id = ? AND s.is_deleted = 0
      GROUP BY p.id
      ORDER BY soldQuantity DESC
      LIMIT 5
    `).all(store) as any[];

    return res.json({
      success: true,
      data: {
        productCount,
        stockValue,
        salesToday: salesTodayRes.salesCount,
        revenueToday,
        returnsToday,
        loansToday: loansTodayRes.loanVal,
        costOfSalesToday,
        expensesToday,
        profitToday,
        paymentsByMethod,
        recentSales,
        topMoving
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== PRODUCTS APIS ====================

app.get('/api/products', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SessionUser;
  const store = (req.query.store as string) || user.activeStore || 'store1';

  try {
    const products = db.prepare(`
      SELECT
        p.id as _id,
        p.id,
        p.sku,
        p.name,
        p.category,
        p.unit,
        p.cost_price as costPrice,
        p.selling_price as price,
        p.selling_price as sellingPrice,
        p.min_stock as minStock,
        p.pack_units as packUnits,
        p.image_url as imageUrl,
        COALESCE(si.quantity, 0) as quantity,
        COALESCE(si.min_stock_threshold, p.min_stock) as threshold
      FROM products p
      LEFT JOIN store_inventory si ON p.id = si.product_id AND si.store_id = ?
      ORDER BY p.name ASC
    `).all(store) as any[];

    const formatted = products.map(p => ({
      ...p,
      packUnits: typeof p.packUnits === 'string' ? JSON.parse(p.packUnits || '[]') : p.packUnits || []
    }));

    return res.json({ success: true, data: formatted });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/products', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SessionUser;
  const store = req.body.store || user.activeStore || 'store1';
  const { sku, name, category, unit, costPrice, price, sellingPrice, minStock, quantity, packUnits, imageUrl } = req.body;

  if (!name || !category) {
    return res.status(400).json({ success: false, error: 'Product name and category are required' });
  }

  const generatedSku = (sku || 'SKU-' + Math.random().toString(36).substring(2, 8).toUpperCase()).trim();
  const id = 'p_' + Date.now();
  const cost = Number(costPrice) || 0;
  const sell = Number(price || sellingPrice) || 0;
  const min = Number(minStock) || 5;
  const qty = Math.max(0, Number(quantity) || 0);
  const pUnits = JSON.stringify(packUnits || []);

  try {
    db.prepare(`
      INSERT INTO products (id, sku, name, category, unit, cost_price, selling_price, min_stock, pack_units, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, generatedSku, name.trim(), category.trim(), unit || 'pcs', cost, sell, min, pUnits, imageUrl || null);

    // Create inventory record for both stores
    db.prepare(`
      INSERT INTO store_inventory (id, store_id, product_id, quantity, min_stock_threshold)
      VALUES (?, ?, ?, ?, ?)
    `).run(`${id}_store1`, 'store1', id, store === 'store1' ? qty : 0, min);

    db.prepare(`
      INSERT INTO store_inventory (id, store_id, product_id, quantity, min_stock_threshold)
      VALUES (?, ?, ?, ?, ?)
    `).run(`${id}_store2`, 'store2', id, store === 'store2' ? qty : 0, min);

    return res.json({
      success: true,
      data: {
        _id: id,
        id,
        sku: generatedSku,
        name,
        category,
        unit: unit || 'pcs',
        costPrice: cost,
        price: sell,
        sellingPrice: sell,
        minStock: min,
        quantity: qty,
        packUnits: packUnits || []
      }
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/products/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user as SessionUser;
  const store = req.body.store || user.activeStore || 'store1';
  const { name, category, unit, costPrice, price, sellingPrice, minStock, quantity, packUnits } = req.body;

  try {
    const cost = Number(costPrice) || 0;
    const sell = Number(price || sellingPrice) || 0;
    const min = Number(minStock) || 5;
    const pUnits = JSON.stringify(packUnits || []);

    db.prepare(`
      UPDATE products
      SET name = ?, category = ?, unit = ?, cost_price = ?, selling_price = ?, min_stock = ?, pack_units = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(name, category, unit || 'pcs', cost, sell, min, pUnits, id);

    if (quantity !== undefined) {
      const qty = Math.max(0, Number(quantity) || 0);
      db.prepare(`
        INSERT INTO store_inventory (id, store_id, product_id, quantity, min_stock_threshold)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(store_id, product_id) DO UPDATE SET quantity = ?, min_stock_threshold = ?, last_updated = datetime('now')
      `).run(`${id}_${store}`, store, id, qty, min, qty, min);
    }

    return res.json({ success: true, message: 'Product updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/products/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user as SessionUser;
  if (!user.isAdmin) {
    return res.status(403).json({ success: false, error: 'Only administrators can delete products' });
  }

  try {
    db.prepare('DELETE FROM store_inventory WHERE product_id = ?').run(id);
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Product removed from catalogue' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== PRODUCT REQUESTS ====================

app.get('/api/product-requests', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SessionUser;
  const store = (req.query.store as string) || user.activeStore || 'store1';

  try {
    const requests = db.prepare(`
      SELECT id as _id, id, store_id as storeId, product_id as productId, kind, name, category, sku, unit, price, cost_price as costPrice,
             quantity, min_stock as minStock, pack_units as packUnits, requested_by as requestedBy, status, review_note as reviewNote, created_at as createdAt
      FROM product_requests
      WHERE store_id = ?
      ORDER BY created_at DESC
    `).all(store) as any[];

    return res.json({ success: true, data: requests });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/product-requests/notifications', requireAuth, (req: Request, res: Response) => {
  try {
    const pending = db.prepare(`
      SELECT id, name, requested_by as requestedBy, created_at as createdAt
      FROM product_requests
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `).all() as any[];

    return res.json({ success: true, data: pending });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/product-requests', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SessionUser;
  const { storeId, productId, kind, name, category, sku, unit, price, costPrice, quantity, minStock, packUnits } = req.body;

  const id = 'req_' + Date.now();
  try {
    db.prepare(`
      INSERT INTO product_requests (id, store_id, product_id, kind, name, category, sku, unit, price, cost_price, quantity, min_stock, pack_units, requested_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      storeId || user.activeStore || 'store1',
      productId || null,
      kind || 'new',
      name,
      category,
      sku || '',
      unit || 'pcs',
      Number(price) || 0,
      Number(costPrice) || 0,
      Number(quantity) || 0,
      Number(minStock) || 5,
      JSON.stringify(packUnits || []),
      user.name
    );

    return res.json({ success: true, data: { id } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== SALES APIS ====================

app.get('/api/sales', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SessionUser;
  const store = (req.query.store as string) || user.activeStore || 'store1';

  try {
    const sales = db.prepare(`
      SELECT s.id as _id, s.id, s.sale_number as saleNumber, s.store_id as storeId, s.user_name as createdByName,
             s.customer_name as customerName, s.customer_phone as customerPhone, s.subtotal, s.discount, s.total_amount as totalAmount,
             s.payment_status as paymentStatus, s.payment_method as paymentMethod, s.is_deleted as isDeleted, s.created_at as createdAt
      FROM sales s
      WHERE s.store_id = ?
      ORDER BY s.created_at DESC
    `).all(store) as any[];

    // fetch items for each sale
    const getItems = db.prepare(`
      SELECT product_id as productId, product_name as name, product_sku as sku, unit, quantity, selling_price as sellingPrice, buying_price as buyingPrice, total_price as totalPrice
      FROM sale_items
      WHERE sale_id = ?
    `);

    const result = sales.map(s => ({
      ...s,
      items: getItems.all(s.id)
    }));

    const activeSales = result.filter(s => !s.isDeleted);
    const deletedSales = result.filter(s => !!s.isDeleted);

    return res.json({ success: true, data: activeSales, deletedSales });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sales', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SessionUser;
  const store = req.body.store || user.activeStore || 'store1';
  const { customer, items, paymentStatus, paymentMethod, discount = 0, notes } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ success: false, error: 'Sale must have at least one product item.' });
  }

  // Check inventory stock for each item in this store
  const checkStock = db.prepare(`
    SELECT quantity FROM store_inventory WHERE store_id = ? AND product_id = ?
  `);

  for (const item of items) {
    const inv = checkStock.get(store, item.productId) as { quantity: number } | undefined;
    const currentQty = inv?.quantity || 0;
    if (currentQty < item.quantity) {
      return res.status(400).json({
        success: false,
        error: `Insufficient stock for product ${item.name || item.productId}. Available: ${currentQty}, Requested: ${item.quantity}`
      });
    }
  }

  // Calculate totals
  let subtotal = 0;
  for (const item of items) {
    subtotal += (Number(item.quantity) || 0) * (Number(item.sellingPrice) || 0);
  }
  const discountVal = Math.max(0, Number(discount) || 0);
  const totalAmount = Math.max(0, subtotal - discountVal);

  const saleId = 'sale_' + Date.now();
  const saleNumber = 'SAL-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

  const transaction = db.transaction(() => {
    // 1. Insert sale
    db.prepare(`
      INSERT INTO sales (id, sale_number, store_id, user_id, user_name, customer_name, customer_phone, subtotal, discount, total_amount, payment_status, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      saleId,
      saleNumber,
      store,
      user.id,
      user.name,
      customer?.name?.trim() || 'Walk-in Customer',
      customer?.phone?.trim() || null,
      subtotal,
      discountVal,
      totalAmount,
      paymentStatus || 'paid',
      paymentMethod || 'cash',
      notes || null
    );

    // 2. Insert items and deduct stock
    const insertItem = db.prepare(`
      INSERT INTO sale_items (id, sale_id, product_id, product_name, product_sku, unit, quantity, selling_price, buying_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const deductStock = db.prepare(`
      UPDATE store_inventory
      SET quantity = quantity - ?, last_updated = datetime('now')
      WHERE store_id = ? AND product_id = ?
    `);

    for (const item of items) {
      const itemId = 'si_' + Math.random().toString(36).substring(2, 9);
      const itemTotal = (Number(item.quantity) || 0) * (Number(item.sellingPrice) || 0);
      insertItem.run(
        itemId,
        saleId,
        item.productId,
        item.name,
        item.sku || '',
        item.unit || 'pcs',
        item.quantity,
        item.sellingPrice,
        item.buyingPrice || 0,
        itemTotal
      );
      deductStock.run(item.quantity, store, item.productId);
    }

    // 3. Create invoice automatically
    const invNumber = 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    db.prepare(`
      INSERT INTO invoices (id, invoice_number, type, sale_id, store_id, customer_name, customer_phone, status, issue_date, subtotal, discount, total_amount, items_json)
      VALUES (?, ?, 'invoice', ?, ?, ?, ?, ?, date('now'), ?, ?, ?, ?)
    `).run(
      'inv_' + Date.now(),
      invNumber,
      saleId,
      store,
      customer?.name?.trim() || 'Walk-in Customer',
      customer?.phone?.trim() || null,
      paymentStatus || 'paid',
      subtotal,
      discountVal,
      totalAmount,
      JSON.stringify(items)
    );

    // 4. If unpaid / loan, record in loans table
    if (paymentStatus === 'unpaid' || paymentMethod === 'loan') {
      const loanId = 'loan_' + Date.now();
      db.prepare(`
        INSERT INTO loans (id, store_id, customer_name, customer_phone, amount, paid_amount, due_date, status, notes)
        VALUES (?, ?, ?, ?, ?, 0, date('now', '+7 days'), 'pending', ?)
      `).run(
        loanId,
        store,
        customer?.name?.trim() || 'Credit Customer',
        customer?.phone?.trim() || null,
        totalAmount,
        `Credit sale ${saleNumber}`
      );
    }
  });

  try {
    transaction();
    return res.json({
      success: true,
      data: {
        _id: saleId,
        id: saleId,
        saleNumber,
        customerName: customer?.name || 'Walk-in Customer',
        totalAmount,
        paymentStatus,
        paymentMethod
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Soft delete sale
app.delete('/api/sales/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user as SessionUser;

  try {
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(id) as any;
    if (!sale) return res.status(404).json({ success: false, error: 'Sale not found' });

    const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(id) as any[];

    const transaction = db.transaction(() => {
      // 1. Mark as deleted
      db.prepare(`
        UPDATE sales SET is_deleted = 1, deleted_at = datetime('now'), deleted_by = ? WHERE id = ?
      `).run(user.name, id);

      // 2. Return quantities to stock
      const restock = db.prepare(`
        UPDATE store_inventory SET quantity = quantity + ?, last_updated = datetime('now')
        WHERE store_id = ? AND product_id = ?
      `);

      for (const item of items) {
        restock.run(item.quantity, sale.store_id, item.product_id);
      }

      // 3. Remove linked returns or loans
      db.prepare('DELETE FROM returns WHERE sale_id = ?').run(id);
    });

    transaction();
    return res.json({ success: true, message: 'Sale deleted and inventory restored.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Restore sale
app.post('/api/sales/:id/restore', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(id) as any;
    if (!sale) return res.status(404).json({ success: false, error: 'Sale not found' });

    const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(id) as any[];

    // Check stock availability before restoring
    for (const item of items) {
      const inv = db.prepare('SELECT quantity FROM store_inventory WHERE store_id = ? AND product_id = ?').get(sale.store_id, item.product_id) as any;
      if ((inv?.quantity || 0) < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Cannot restore: not enough stock for ${item.product_name}. Available: ${inv?.quantity || 0}, Required: ${item.quantity}`
        });
      }
    }

    const transaction = db.transaction(() => {
      db.prepare('UPDATE sales SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL WHERE id = ?').run(id);
      const deduct = db.prepare(`
        UPDATE store_inventory SET quantity = quantity - ?, last_updated = datetime('now')
        WHERE store_id = ? AND product_id = ?
      `);
      for (const item of items) {
        deduct.run(item.quantity, sale.store_id, item.product_id);
      }
    });

    transaction();
    return res.json({ success: true, message: 'Sale restored and stock deducted.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== INVOICES & PROFORMAS ====================

app.get('/api/invoices', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SessionUser;
  const store = (req.query.store as string) || user.activeStore || 'store1';

  try {
    const invoices = db.prepare(`
      SELECT id as _id, id, invoice_number as invoiceNumber, type, sale_id as saleId, store_id as storeId,
             customer_name as customerName, customer_email as customerEmail, customer_phone as customerPhone,
             status, issue_date as issueDate, due_date as dueDate, subtotal, discount, total_amount as totalAmount,
             items_json as itemsJson, notes, created_at as createdAt
      FROM invoices
      WHERE store_id = ?
      ORDER BY created_at DESC
    `).all(store) as any[];

    const formatted = invoices.map(inv => ({
      ...inv,
      items: typeof inv.itemsJson === 'string' ? JSON.parse(inv.itemsJson || '[]') : inv.itemsJson || []
    }));

    return res.json({ success: true, data: formatted });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/invoices', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SessionUser;
  const { type = 'invoice', customerName, customerEmail, customerPhone, items, subtotal, discount = 0, totalAmount, dueDate, notes, store } = req.body;

  const id = 'inv_' + Date.now();
  const prefix = type === 'dn' ? 'DN-' : type === 'proforma' ? 'PRO-' : 'INV-';
  const invoiceNumber = prefix + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

  try {
    db.prepare(`
      INSERT INTO invoices (id, invoice_number, type, store_id, customer_name, customer_email, customer_phone, status, issue_date, due_date, subtotal, discount, total_amount, items_json, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'issued', date('now'), ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      invoiceNumber,
      type,
      store || user.activeStore || 'store1',
      customerName,
      customerEmail || null,
      customerPhone || null,
      dueDate || null,
      Number(subtotal) || 0,
      Number(discount) || 0,
      Number(totalAmount) || 0,
      JSON.stringify(items || []),
      notes || null
    );

    return res.json({ success: true, data: { id, invoiceNumber } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Proformas
app.get('/api/proformas', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SessionUser;
  const store = (req.query.store as string) || user.activeStore || 'store1';

  try {
    const proformas = db.prepare(`
      SELECT id as _id, id, invoice_number as proformaNumber, customer_name as customerName,
             customer_email as customerEmail, customer_phone as customerPhone, total_amount as totalAmount,
             items_json as itemsJson, created_at as createdAt
      FROM invoices
      WHERE store_id = ? AND type = 'proforma'
      ORDER BY created_at DESC
    `).all(store) as any[];

    return res.json({ success: true, data: proformas });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== CUSTOMERS & SUPPLIERS ====================

app.get('/api/customers-suppliers', requireAuth, (req: Request, res: Response) => {
  try {
    const list = db.prepare(`
      SELECT id as _id, id, type, name, phone, email, address, balance, notes, created_at as createdAt
      FROM customers_suppliers
      ORDER BY name ASC
    `).all() as any[];

    return res.json({ success: true, data: list });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/customers-suppliers', requireAuth, (req: Request, res: Response) => {
  const { type = 'customer', name, phone, email, address, balance = 0, notes } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

  const id = 'cs_' + Date.now();
  try {
    db.prepare(`
      INSERT INTO customers_suppliers (id, type, name, phone, email, address, balance, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, type, name.trim(), phone || null, email || null, address || null, Number(balance) || 0, notes || null);

    return res.json({ success: true, data: { id, name, type, phone, email, address, balance } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== RETURNS APIS ====================

app.get('/api/returns', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SessionUser;
  const store = (req.query.store as string) || user.activeStore || 'store1';

  try {
    const returns = db.prepare(`
      SELECT r.id as _id, r.id, r.return_number as returnNumber, r.sale_id as saleId, r.user_name as createdByName,
             r.customer_name as customerName, r.reason, r.total_amount as totalAmount, r.return_status as returnStatus, r.created_at as createdAt
      FROM returns r
      WHERE r.store_id = ?
      ORDER BY r.created_at DESC
    `).all(store) as any[];

    const getItems = db.prepare(`
      SELECT product_id as productId, product_name as name, unit, quantity, unit_price as unitPrice, total_amount as totalAmount
      FROM return_items WHERE return_id = ?
    `);

    const result = returns.map(r => ({
      ...r,
      items: getItems.all(r.id)
    }));

    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/returns', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SessionUser;
  const store = req.body.store || user.activeStore || 'store1';
  const { saleId, customerName, reason, items } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ success: false, error: 'No items selected for return' });
  }

  const returnId = 'ret_' + Date.now();
  const returnNumber = 'RET-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

  let totalAmount = 0;
  for (const item of items) {
    totalAmount += (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO returns (id, return_number, sale_id, store_id, user_id, user_name, customer_name, reason, total_amount, return_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
    `).run(returnId, returnNumber, saleId || null, store, user.id, user.name, customerName || 'Customer', reason || 'Item return', totalAmount);

    const insertItem = db.prepare(`
      INSERT INTO return_items (id, return_id, product_id, product_name, unit, quantity, unit_price, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const restock = db.prepare(`
      UPDATE store_inventory SET quantity = quantity + ?, last_updated = datetime('now')
      WHERE store_id = ? AND product_id = ?
    `);

    for (const item of items) {
      insertItem.run(
        'ri_' + Math.random().toString(36).substring(2, 9),
        returnId,
        item.productId,
        item.name || item.productName,
        item.unit || 'pcs',
        item.quantity,
        item.unitPrice,
        item.quantity * item.unitPrice
      );
      restock.run(item.quantity, store, item.productId);
    }
  });

  try {
    transaction();
    return res.json({ success: true, data: { id: returnId, returnNumber, totalAmount } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== EXPENSES APIS ====================

app.get('/api/expenses', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SessionUser;
  const store = (req.query.store as string) || user.activeStore || 'store1';

  try {
    const list = db.prepare(`
      SELECT id as _id, id, description, amount, category, payment_method as paymentMethod, date, notes, user_name as recordedBy, created_at as createdAt
      FROM expenses
      WHERE store_id = ?
      ORDER BY date DESC, created_at DESC
    `).all(store) as any[];

    return res.json({ success: true, data: list });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/expenses', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SessionUser;
  const store = req.body.store || user.activeStore || 'store1';
  const { description, amount, category = 'Other', paymentMethod = 'cash', date = new Date().toISOString().split('T')[0], notes } = req.body;

  if (!description || !amount) {
    return res.status(400).json({ success: false, error: 'Description and amount are required' });
  }

  const id = 'exp_' + Date.now();
  try {
    db.prepare(`
      INSERT INTO expenses (id, store_id, user_id, user_name, description, amount, category, payment_method, date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, store, user.id, user.name, description.trim(), Number(amount), category, paymentMethod, date, notes || null);

    return res.json({ success: true, data: { id, description, amount, category, paymentMethod, date } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== LOANS APIS ====================

app.get('/api/loans', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SessionUser;
  const store = (req.query.store as string) || user.activeStore || 'store1';

  try {
    const loans = db.prepare(`
      SELECT id as _id, id, store_id as storeId, customer_name as customerName, customer_phone as customerPhone,
             amount, paid_amount as paidAmount, due_date as dueDate, status, notes, created_at as createdAt
      FROM loans
      WHERE store_id = ?
      ORDER BY due_date ASC
    `).all(store) as any[];

    return res.json({ success: true, data: loans });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/loans/notifications', requireAuth, (req: Request, res: Response) => {
  try {
    const list = db.prepare(`
      SELECT id, customer_name as customerName, customer_phone as customerPhone, amount, due_date as dueDate, status
      FROM loans
      WHERE status != 'paid' AND date(due_date) <= date('now', '+2 days')
      ORDER BY due_date ASC
    `).all() as any[];

    const formatted = list.map(l => ({
      id: l.id,
      customerName: l.customerName,
      customerPhone: l.customerPhone,
      amount: l.amount,
      paymentDateLabel: `Due: ${l.dueDate}`
    }));

    return res.json({ success: true, data: formatted });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/loans/:id/pay', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount } = req.body;
  const payAmount = Number(amount) || 0;

  try {
    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(id) as any;
    if (!loan) return res.status(404).json({ success: false, error: 'Loan record not found' });

    const newPaid = (loan.paid_amount || 0) + payAmount;
    const newStatus = newPaid >= loan.amount ? 'paid' : 'partial';

    db.prepare(`
      UPDATE loans SET paid_amount = ?, status = ? WHERE id = ?
    `).run(newPaid, newStatus, id);

    return res.json({ success: true, message: 'Loan payment recorded' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== STOCK ADJUSTMENTS / TRANSFERS ====================

app.get('/api/stock-adjustments', requireAuth, (req: Request, res: Response) => {
  try {
    const transfers = db.prepare(`
      SELECT id as _id, id, adjustment_number as adjustmentNumber, product_id as productId, product_name as productName,
             from_store as fromStore, to_store as toStore, quantity, unit, reason, created_by as createdBy, created_at as createdAt
      FROM stock_adjustments
      ORDER BY created_at DESC
    `).all() as any[];

    return res.json({ success: true, data: transfers });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/stock-adjustments', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SessionUser;
  const { productId, fromStore, toStore, quantity, unit, reason } = req.body;

  if (!productId || !fromStore || !toStore || !quantity) {
    return res.status(400).json({ success: false, error: 'All transfer parameters are required' });
  }

  if (fromStore === toStore) {
    return res.status(400).json({ success: false, error: 'Source and destination store must be different' });
  }

  const transferQty = Math.max(0, Number(quantity) || 0);

  // Check stock in fromStore
  const fromInv = db.prepare('SELECT quantity FROM store_inventory WHERE store_id = ? AND product_id = ?').get(fromStore, productId) as any;
  if (!fromInv || fromInv.quantity < transferQty) {
    return res.status(400).json({
      success: false,
      error: `Insufficient stock in source branch. Available: ${fromInv?.quantity || 0}, Transfer request: ${transferQty}`
    });
  }

  const product = db.prepare('SELECT name FROM products WHERE id = ?').get(productId) as any;
  const productName = product?.name || 'Product';
  const adjNumber = 'TRF-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  const id = 'adj_' + Date.now();

  const transaction = db.transaction(() => {
    // 1. Deduct from source store
    db.prepare(`
      UPDATE store_inventory SET quantity = quantity - ?, last_updated = datetime('now')
      WHERE store_id = ? AND product_id = ?
    `).run(transferQty, fromStore, productId);

    // 2. Add to destination store
    db.prepare(`
      INSERT INTO store_inventory (id, store_id, product_id, quantity, min_stock_threshold)
      VALUES (?, ?, ?, ?, 5)
      ON CONFLICT(store_id, product_id) DO UPDATE SET quantity = quantity + ?, last_updated = datetime('now')
    `).run(`${productId}_${toStore}`, toStore, productId, transferQty, transferQty);

    // 3. Record transfer log
    db.prepare(`
      INSERT INTO stock_adjustments (id, adjustment_number, product_id, product_name, from_store, to_store, quantity, unit, reason, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, adjNumber, productId, productName, fromStore, toStore, transferQty, unit || 'pcs', reason || 'Store inventory rebalance', user.name);
  });

  try {
    transaction();
    return res.json({ success: true, message: 'Stock transferred successfully', data: { id, adjNumber } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== LOW STOCK ALERTS ====================

app.get('/api/alerts', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SessionUser;
  const store = (req.query.store as string) || user.activeStore || 'store1';

  try {
    const alerts = db.prepare(`
      SELECT p.id as _id, p.id, p.sku, p.name, p.category, p.unit, p.selling_price as price,
             si.quantity, si.min_stock_threshold as threshold
      FROM products p
      JOIN store_inventory si ON p.id = si.product_id
      WHERE si.store_id = ? AND si.quantity <= si.min_stock_threshold
      ORDER BY si.quantity ASC
    `).all(store) as any[];

    return res.json({ success: true, data: alerts });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== USERS & AUDIT LOGS ====================

app.get('/api/users', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SessionUser;
  if (!user.isAdmin) {
    return res.status(403).json({ success: false, error: 'Access restricted to administrators' });
  }

  try {
    const users = db.prepare(`
      SELECT id as _id, id, name, email, username, role, stores, is_admin as isAdmin, is_active as isActive, created_at as createdAt
      FROM users
      ORDER BY created_at DESC
    `).all() as any[];

    const formatted = users.map(u => ({
      ...u,
      stores: typeof u.stores === 'string' ? JSON.parse(u.stores || '["store1"]') : u.stores || ['store1']
    }));

    const loginLogs = db.prepare(`
      SELECT id as _id, id, name, email, role, login_at as loginAt, logout_at as logoutAt
      FROM login_logs
      ORDER BY login_at DESC
      LIMIT 30
    `).all() as any[];

    return res.json({ success: true, data: formatted, loginLogs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/users', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user as SessionUser;
  if (!currentUser.isAdmin) {
    return res.status(403).json({ success: false, error: 'Only administrators can create users' });
  }

  const { name, email, password, role = 'staff', stores = 'store1', isActive = true } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Please provide name, email, and password.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  const id = 'user_' + Date.now();
  const storesArray = Array.isArray(stores) ? stores : [stores];

  try {
    db.prepare(`
      INSERT INTO users (id, name, email, username, password_hash, role, stores, is_admin, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), email.trim(), email.split('@')[0], hash, role, JSON.stringify(storesArray), role === 'admin' ? 1 : 0, isActive ? 1 : 0);

    return res.json({
      success: true,
      data: {
        id,
        _id: id,
        name,
        email,
        role,
        stores: storesArray,
        isActive,
        isAdmin: role === 'admin'
      }
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/users/:id', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user as SessionUser;
  if (!currentUser.isAdmin) {
    return res.status(403).json({ success: false, error: 'Only administrators can delete users' });
  }
  const { id } = req.params;
  if (id === currentUser.id) {
    return res.status(400).json({ success: false, error: 'Cannot delete your own administrator account' });
  }

  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return res.json({ success: true, message: 'User deleted' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== REPORTS & FINANCIAL STATEMENTS ====================

app.get('/api/reports', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SessionUser;
  const store = (req.query.store as string) || user.activeStore || 'store1';

  try {
    // 7 days daily sales
    const dailySales = db.prepare(`
      SELECT date(created_at) as date, COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count
      FROM sales
      WHERE store_id = ? AND is_deleted = 0 AND date(created_at) >= date('now', '-6 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all(store) as any[];

    // Category performance
    const categorySales = db.prepare(`
      SELECT p.category, COALESCE(SUM(si.total_price), 0) as totalSales, SUM(si.quantity) as totalQty
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.store_id = ? AND s.is_deleted = 0
      GROUP BY p.category
      ORDER BY totalSales DESC
    `).all(store) as any[];

    // Store comparison (Store 1 vs Store 2)
    const storeComparison = db.prepare(`
      SELECT s.store_id, st.name as storeName, COALESCE(SUM(s.total_amount), 0) as revenue, COUNT(s.id) as salesCount
      FROM stores st
      LEFT JOIN sales s ON st.id = s.store_id AND s.is_deleted = 0
      GROUP BY st.id
    `).all() as any[];

    return res.json({
      success: true,
      data: {
        dailySales,
        categorySales,
        storeComparison
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/financial-statements', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SessionUser;
  const store = (req.query.store as string) || user.activeStore || 'store1';

  try {
    // P&L
    const salesTotal = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as totalRevenue, COALESCE(SUM(discount), 0) as totalDiscount
      FROM sales WHERE store_id = ? AND is_deleted = 0
    `).get(store) as any;

    const costTotal = db.prepare(`
      SELECT COALESCE(SUM(si.buying_price * si.quantity), 0) as totalCost
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.store_id = ? AND s.is_deleted = 0
    `).get(store) as any;

    const returnTotal = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as totalReturns
      FROM returns WHERE store_id = ?
    `).get(store) as any;

    const expenseList = db.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) as total
      FROM expenses WHERE store_id = ?
      GROUP BY category
    `).all(store) as any[];

    const totalExpenses = expenseList.reduce((acc, curr) => acc + curr.total, 0);

    const grossRevenue = salesTotal.totalRevenue;
    const netRevenue = grossRevenue - returnTotal.totalReturns;
    const costOfGoodsSold = costTotal.totalCost;
    const grossProfit = netRevenue - costOfGoodsSold;
    const netProfit = grossProfit - totalExpenses;

    // Balance sheet components
    const inventoryVal = db.prepare(`
      SELECT COALESCE(SUM(p.cost_price * si.quantity), 0) as totalVal
      FROM products p
      JOIN store_inventory si ON p.id = si.product_id
      WHERE si.store_id = ?
    `).get(store) as any;

    const accountsReceivable = db.prepare(`
      SELECT COALESCE(SUM(amount - paid_amount), 0) as totalOutstanding
      FROM loans WHERE store_id = ? AND status != 'paid'
    `).get(store) as any;

    return res.json({
      success: true,
      data: {
        incomeStatement: {
          grossRevenue,
          returns: returnTotal.totalReturns,
          netRevenue,
          costOfGoodsSold,
          grossProfit,
          expenses: expenseList,
          totalExpenses,
          netProfit
        },
        balanceSheet: {
          currentAssets: {
            cashAndEquivalents: Math.max(0, netProfit + 1500000),
            accountsReceivable: accountsReceivable.totalOutstanding,
            merchandiseInventory: inventoryVal.totalVal
          },
          currentLiabilities: {
            accountsPayable: 350000,
            shortTermDebt: 0
          }
        }
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== VITE MIDDLEWARE (DEV) / STATIC (PROD) ====================

const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

server.on('error', (err: any) => {
  console.error('[Codev] Server listener error:', err.message || err);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Codev] Server running on http://0.0.0.0:${PORT}`);
});
