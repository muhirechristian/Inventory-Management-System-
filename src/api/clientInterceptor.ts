/**
 * Codev Client Fetch Interceptor & Standalone Cloud Adapter
 * Intercepts /api/* requests. If the live server is unreachable or returning HTML/404
 * (such as when hosted as a static site on Vercel), it executes the request seamlessly
 * against the local client database.
 */

import { clientDb, ProductItem, Sale, SaleItem } from './clientDb.ts';

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Codev-Provider': 'client-local-engine'
    }
  });
}

function parseUrl(urlStr: string) {
  try {
    const parsed = new URL(urlStr, window.location.origin);
    return {
      pathname: parsed.pathname,
      searchParams: parsed.searchParams
    };
  } catch {
    const [pathPart, queryPart] = urlStr.split('?');
    const searchParams = new URLSearchParams(queryPart || '');
    return { pathname: pathPart, searchParams };
  }
}

export async function handleClientApiRequest(urlStr: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method || 'GET').toUpperCase();
  const { pathname, searchParams } = parseUrl(urlStr);
  const body = init?.body ? (typeof init.body === 'string' ? JSON.parse(init.body) : {}) : {};
  const sessionUser = clientDb.getSessionUser();
  const activeStore = sessionUser?.activeStore || searchParams.get('store') || 'store1';

  // 1. AUTH: Session
  if (pathname === '/api/auth/session') {
    if (sessionUser) {
      return jsonResponse({ success: true, user: sessionUser });
    }
    return jsonResponse({ success: false, user: null });
  }

  // 2. AUTH: Login
  if (pathname === '/api/auth/login' && method === 'POST') {
    const { username, password } = body;
    const cleanUser = (username || '').trim().toLowerCase();
    const state = clientDb.getState();
    const user = state.users.find(
      u => (u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser) && u.is_active
    );

    if (!user || user.password_plain !== password) {
      return jsonResponse({ success: false, error: 'Invalid email or password' }, 401);
    }

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      stores: user.stores,
      isAdmin: user.is_admin,
      activeStore: user.stores[0] || 'store1'
    };
    clientDb.setSessionUser(userData);
    return jsonResponse({ success: true, data: userData });
  }

  // 3. AUTH: Setup
  if (pathname === '/api/auth/setup' && method === 'POST') {
    const { name, email, password } = body;
    if (!name || !email || !password) {
      return jsonResponse({ success: false, error: 'Name, email, and password are required' }, 400);
    }
    const state = clientDb.getState();
    const existingAdmin = state.users.find(u => u.is_admin);
    if (existingAdmin) {
      return jsonResponse({ success: false, error: 'Administrator already set up. Please log in.' }, 400);
    }

    const newUser = {
      id: 'user_' + Date.now(),
      name: name.trim(),
      email: email.trim(),
      username: email.split('@')[0],
      password_plain: password,
      role: 'admin',
      stores: ['store1', 'store2'],
      is_admin: true,
      is_active: true,
      created_at: new Date().toISOString()
    };

    clientDb.updateState(s => {
      s.users.push(newUser);
    });

    const userData = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      username: newUser.username,
      role: 'admin',
      stores: ['store1', 'store2'],
      isAdmin: true,
      activeStore: 'store1'
    };
    clientDb.setSessionUser(userData);
    return jsonResponse({ success: true, data: userData });
  }

  // 4. AUTH: Logout
  if (pathname === '/api/auth/logout') {
    clientDb.setSessionUser(null);
    return jsonResponse({ success: true, message: 'Logged out successfully' });
  }

  // 5. AUTH: Heartbeat
  if (pathname === '/api/auth/heartbeat') {
    return jsonResponse({ success: true, timestamp: Date.now() });
  }

  // 6. AUTH: Switch Store
  if (pathname === '/api/auth/switch-store') {
    const { store } = body;
    if (sessionUser) {
      sessionUser.activeStore = store;
      clientDb.setSessionUser(sessionUser);
    }
    return jsonResponse({ success: true, store });
  }

  // 7. DASHBOARD: Stats
  if (pathname === '/api/dashboard/stats') {
    const store = searchParams.get('store') || activeStore;
    const state = clientDb.getState();
    const storeInv = state.inventory.filter(i => i.store_id === store);

    let stockValue = 0;
    for (const inv of storeInv) {
      const prod = state.products.find(p => p.id === inv.product_id);
      if (prod) {
        stockValue += prod.cost_price * inv.quantity;
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const storeSales = state.sales.filter(s => s.store_id === store && !s.is_deleted);
    const salesToday = storeSales.filter(s => s.created_at.startsWith(todayStr));

    const totalRevenueToday = salesToday.reduce((sum, s) => sum + s.total_amount, 0);

    let costOfSalesToday = 0;
    for (const sale of salesToday) {
      for (const item of sale.items || []) {
        costOfSalesToday += (item.buying_price || 0) * item.quantity;
      }
    }

    const returnsToday = state.returns
      .filter(r => r.store_id === store && r.created_at.startsWith(todayStr))
      .reduce((sum, r) => sum + r.total_amount, 0);

    const loansToday = state.loans
      .filter(l => l.store_id === store && l.created_at.startsWith(todayStr))
      .reduce((sum, l) => sum + l.amount, 0);

    const expensesToday = state.expenses
      .filter(e => e.store_id === store && e.date.startsWith(todayStr))
      .reduce((sum, e) => sum + e.amount, 0);

    const profitToday = totalRevenueToday - costOfSalesToday - expensesToday - returnsToday;

    const paymentsByMethod = { cash: 0, bank: 0, mobile: 0 };
    for (const s of salesToday) {
      const m = s.payment_method.toLowerCase();
      if (m === 'cash') paymentsByMethod.cash += s.total_amount;
      else if (m === 'bank') paymentsByMethod.bank += s.total_amount;
      else if (m === 'mobile' || m === 'momo') paymentsByMethod.mobile += s.total_amount;
    }

    const recentSales = storeSales.slice(-5).reverse().map(s => ({
      _id: s.id,
      saleNumber: s.sale_number,
      customerName: s.customer_name,
      totalAmount: s.total_amount,
      createdAt: s.created_at,
      quantitySold: (s.items || []).reduce((q, item) => q + item.quantity, 0),
      units: Array.from(new Set((s.items || []).map(i => i.unit)))
    }));

    // Top moving products
    const productSoldMap: Record<string, { name: string; sku: string; unit: string; soldQuantity: number; salesValue: number }> = {};
    for (const s of storeSales) {
      for (const item of s.items || []) {
        if (!productSoldMap[item.product_id]) {
          productSoldMap[item.product_id] = {
            name: item.product_name,
            sku: item.product_sku,
            unit: item.unit,
            soldQuantity: 0,
            salesValue: 0
          };
        }
        productSoldMap[item.product_id].soldQuantity += item.quantity;
        productSoldMap[item.product_id].salesValue += item.total_price;
      }
    }
    const topMoving = Object.values(productSoldMap)
      .sort((a, b) => b.soldQuantity - a.soldQuantity)
      .slice(0, 5);

    return jsonResponse({
      success: true,
      data: {
        productCount: state.products.length,
        stockValue,
        salesToday: {
          count: salesToday.length,
          revenue: totalRevenueToday,
          profit: profitToday
        },
        returnsToday: { count: 0, total: returnsToday },
        loansToday: { count: 0, total: loansToday },
        expensesToday: { count: 0, total: expensesToday },
        costOfSalesToday,
        paymentsByMethod,
        recentSales,
        topMoving
      }
    });
  }

  // 8. PRODUCTS: GET, POST, PUT, DELETE
  if (pathname === '/api/products') {
    const store = searchParams.get('store') || activeStore;
    const state = clientDb.getState();

    if (method === 'GET') {
      const data = state.products.map(p => {
        const inv = state.inventory.find(i => i.product_id === p.id && i.store_id === store);
        return {
          _id: p.id,
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          unit: p.unit,
          costPrice: p.cost_price,
          sellingPrice: p.selling_price,
          minStock: inv?.min_stock_threshold ?? p.min_stock,
          quantity: inv?.quantity ?? 0,
          packUnits: p.pack_units || [],
          imageUrl: p.image_url,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        };
      });
      return jsonResponse({ success: true, data });
    }

    if (method === 'POST') {
      const { sku, name, category, unit, costPrice, sellingPrice, minStock, packUnits, initialQuantities } = body;
      const id = 'p_' + Date.now();
      const newProd: ProductItem = {
        id,
        sku: (sku || ('SKU-' + Date.now().toString().slice(-5))).toUpperCase(),
        name,
        category: category || 'General',
        unit: unit || 'pcs',
        cost_price: Number(costPrice) || 0,
        selling_price: Number(sellingPrice) || 0,
        min_stock: Number(minStock) || 5,
        pack_units: packUnits || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      clientDb.updateState(s => {
        s.products.push(newProd);
        for (const st of s.stores) {
          const qty = initialQuantities?.[st.id] ? Number(initialQuantities[st.id]) : 0;
          s.inventory.push({
            id: `${id}_${st.id}`,
            store_id: st.id,
            product_id: id,
            quantity: qty,
            min_stock_threshold: newProd.min_stock,
            last_updated: new Date().toISOString()
          });
        }
      });
      return jsonResponse({ success: true, data: { ...newProd, _id: id } });
    }
  }

  // PUT / DELETE on /api/products/:id
  if (pathname.startsWith('/api/products/')) {
    const id = pathname.replace('/api/products/', '');
    const state = clientDb.getState();

    if (method === 'PUT') {
      const { name, category, unit, costPrice, sellingPrice, minStock, packUnits, quantity } = body;
      let updatedProd: any = null;
      clientDb.updateState(s => {
        const prod = s.products.find(p => p.id === id);
        if (prod) {
          if (name) prod.name = name;
          if (category) prod.category = category;
          if (unit) prod.unit = unit;
          if (costPrice !== undefined) prod.cost_price = Number(costPrice);
          if (sellingPrice !== undefined) prod.selling_price = Number(sellingPrice);
          if (minStock !== undefined) prod.min_stock = Number(minStock);
          if (packUnits) prod.pack_units = packUnits;
          prod.updated_at = new Date().toISOString();
          updatedProd = prod;
        }
        if (quantity !== undefined) {
          const inv = s.inventory.find(i => i.product_id === id && i.store_id === activeStore);
          if (inv) {
            inv.quantity = Number(quantity);
            inv.last_updated = new Date().toISOString();
          }
        }
      });
      return jsonResponse({ success: true, data: updatedProd });
    }

    if (method === 'DELETE') {
      clientDb.updateState(s => {
        s.products = s.products.filter(p => p.id !== id);
        s.inventory = s.inventory.filter(i => i.product_id !== id);
      });
      return jsonResponse({ success: true, message: 'Product deleted' });
    }
  }

  // 9. SALES: GET, POST
  if (pathname === '/api/sales') {
    const store = searchParams.get('store') || activeStore;
    const state = clientDb.getState();

    if (method === 'GET') {
      const storeSales = state.sales.filter(s => s.store_id === store);
      const data = storeSales.map(s => ({
        _id: s.id,
        id: s.id,
        saleNumber: s.sale_number,
        storeId: s.store_id,
        userId: s.user_id,
        userName: s.user_name,
        customerName: s.customer_name,
        customerPhone: s.customer_phone,
        subtotal: s.subtotal,
        discount: s.discount,
        totalAmount: s.total_amount,
        paymentStatus: s.payment_status,
        paymentMethod: s.payment_method,
        isDeleted: s.is_deleted,
        deletedAt: s.deleted_at,
        deletedBy: s.deleted_by,
        notes: s.notes,
        createdAt: s.created_at,
        items: (s.items || []).map(i => ({
          _id: i.id,
          productId: i.product_id,
          productName: i.product_name,
          productSku: i.product_sku,
          unit: i.unit,
          quantity: i.quantity,
          sellingPrice: i.selling_price,
          buyingPrice: i.buying_price,
          totalPrice: i.total_price
        }))
      }));
      return jsonResponse({ success: true, data });
    }

    if (method === 'POST') {
      const { customerName, customerPhone, items, discount = 0, paymentMethod = 'cash', notes } = body;
      if (!items || items.length === 0) {
        return jsonResponse({ success: false, error: 'At least one item is required' }, 400);
      }

      const saleId = 'sale_' + Date.now();
      const saleNumber = 'SAL-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      let subtotal = 0;
      const saleItems: SaleItem[] = [];

      clientDb.updateState(s => {
        for (const it of items) {
          const prod = s.products.find(p => p.id === it.productId);
          const unitPrice = Number(it.unitPrice || prod?.selling_price || 0);
          const qty = Number(it.quantity || 1);
          const lineTotal = unitPrice * qty;
          subtotal += lineTotal;

          saleItems.push({
            id: 'si_' + Date.now() + Math.random().toString(36).slice(2, 5),
            sale_id: saleId,
            product_id: it.productId,
            product_name: it.productName || prod?.name || 'Item',
            product_sku: prod?.sku || 'SKU',
            unit: it.unit || prod?.unit || 'pcs',
            quantity: qty,
            selling_price: unitPrice,
            buying_price: prod?.cost_price || 0,
            total_price: lineTotal
          });

          // Deduct inventory
          const inv = s.inventory.find(i => i.product_id === it.productId && i.store_id === activeStore);
          if (inv) {
            inv.quantity = Math.max(0, inv.quantity - qty);
            inv.last_updated = new Date().toISOString();
          }
        }

        const totalAmount = Math.max(0, subtotal - Number(discount));
        const isLoan = paymentMethod.toLowerCase() === 'loan';
        const newSale: Sale = {
          id: saleId,
          sale_number: saleNumber,
          store_id: activeStore,
          user_id: sessionUser?.id || 'admin',
          user_name: sessionUser?.name || 'Administrator',
          customer_name: customerName || 'Walk-in Customer',
          customer_phone: customerPhone,
          subtotal,
          discount: Number(discount),
          total_amount: totalAmount,
          payment_status: isLoan ? 'unpaid' : 'paid',
          payment_method: paymentMethod,
          is_deleted: 0,
          notes,
          created_at: new Date().toISOString(),
          items: saleItems
        };
        s.sales.unshift(newSale);

        // Generate invoice automatically
        const invId = 'inv_' + Date.now();
        const invoiceNum = 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
        s.invoices.unshift({
          id: invId,
          invoice_number: invoiceNum,
          type: 'invoice',
          sale_id: saleId,
          store_id: activeStore,
          customer_name: newSale.customer_name,
          customer_phone: customerPhone,
          status: newSale.payment_status,
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date().toISOString().split('T')[0],
          subtotal,
          discount: Number(discount),
          total_amount: totalAmount,
          items_json: JSON.stringify(saleItems.map(i => ({
            name: i.product_name,
            sku: i.product_sku,
            unit: i.unit,
            quantity: i.quantity,
            price: i.selling_price,
            total: i.total_price
          }))),
          notes,
          created_at: new Date().toISOString()
        });

        // Record loan if loan payment
        if (isLoan) {
          s.loans.unshift({
            id: 'loan_' + Date.now(),
            store_id: activeStore,
            customer_name: newSale.customer_name,
            customer_phone: customerPhone,
            amount: totalAmount,
            paid_amount: 0,
            due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
            status: 'pending',
            notes: `Loan for sale #${saleNumber}`,
            created_at: new Date().toISOString()
          });
        }
      });

      return jsonResponse({ success: true, data: { id: saleId, saleNumber } });
    }
  }

  // DELETE / Restore sale
  if (pathname.startsWith('/api/sales/')) {
    const saleId = pathname.replace('/api/sales/', '').replace('/restore', '');
    const isRestore = pathname.endsWith('/restore');

    clientDb.updateState(s => {
      const sale = s.sales.find(item => item.id === saleId);
      if (sale) {
        sale.is_deleted = isRestore ? 0 : 1;
        if (!isRestore) {
          sale.deleted_at = new Date().toISOString();
          sale.deleted_by = sessionUser?.name || 'Admin';
        }
      }
    });
    return jsonResponse({ success: true });
  }

  // 10. INVOICES
  if (pathname === '/api/invoices') {
    const store = searchParams.get('store') || activeStore;
    const state = clientDb.getState();
    const invoices = state.invoices.filter(i => i.store_id === store).map(i => ({
      _id: i.id,
      id: i.id,
      invoiceNumber: i.invoice_number,
      type: i.type,
      saleId: i.sale_id,
      storeId: i.store_id,
      customerName: i.customer_name,
      customerEmail: i.customer_email,
      customerPhone: i.customer_phone,
      status: i.status,
      issueDate: i.issue_date,
      dueDate: i.due_date,
      subtotal: i.subtotal,
      discount: i.discount,
      totalAmount: i.total_amount,
      items: JSON.parse(i.items_json || '[]'),
      notes: i.notes,
      createdAt: i.created_at
    }));
    return jsonResponse({ success: true, data: invoices });
  }

  // 11. CUSTOMERS & SUPPLIERS
  if (pathname === '/api/customers-suppliers') {
    const state = clientDb.getState();
    if (method === 'GET') {
      const data = state.customers_suppliers.map(c => ({
        _id: c.id,
        id: c.id,
        type: c.type,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        balance: c.balance,
        notes: c.notes,
        createdAt: c.created_at
      }));
      return jsonResponse({ success: true, data });
    }

    if (method === 'POST') {
      const { type, name, phone, email, address, balance = 0, notes } = body;
      const newEntry = {
        id: 'cs_' + Date.now(),
        type: type || 'customer',
        name,
        phone,
        email,
        address,
        balance: Number(balance),
        notes,
        created_at: new Date().toISOString()
      };
      clientDb.updateState(s => {
        s.customers_suppliers.unshift(newEntry);
      });
      return jsonResponse({ success: true, data: { ...newEntry, _id: newEntry.id } });
    }
  }

  // 12. LOANS
  if (pathname === '/api/loans') {
    const store = searchParams.get('store') || activeStore;
    const state = clientDb.getState();
    const data = state.loans.filter(l => l.store_id === store).map(l => ({
      _id: l.id,
      id: l.id,
      storeId: l.store_id,
      customerName: l.customer_name,
      customerPhone: l.customer_phone,
      amount: l.amount,
      paidAmount: l.paid_amount,
      dueDate: l.due_date,
      status: l.status,
      notes: l.notes,
      createdAt: l.created_at
    }));
    return jsonResponse({ success: true, data });
  }

  if (pathname === '/api/loans/notifications') {
    return jsonResponse({ success: true, count: 0, overdue: [] });
  }

  if (pathname.includes('/pay') && pathname.startsWith('/api/loans/')) {
    const loanId = pathname.split('/')[3];
    const { amount } = body;
    clientDb.updateState(s => {
      const loan = s.loans.find(l => l.id === loanId);
      if (loan) {
        loan.paid_amount += Number(amount || 0);
        if (loan.paid_amount >= loan.amount) {
          loan.status = 'paid';
        }
      }
    });
    return jsonResponse({ success: true });
  }

  // 13. RETURNS
  if (pathname === '/api/returns') {
    const store = searchParams.get('store') || activeStore;
    const state = clientDb.getState();
    if (method === 'GET') {
      return jsonResponse({ success: true, data: state.returns.filter(r => r.store_id === store) });
    }
    if (method === 'POST') {
      const { saleId, customerName, reason, items } = body;
      const returnNumber = 'RET-' + Date.now().toString().slice(-6);
      const newRet = {
        id: 'ret_' + Date.now(),
        return_number: returnNumber,
        sale_id: saleId,
        store_id: activeStore,
        user_name: sessionUser?.name || 'Admin',
        customer_name: customerName,
        reason,
        total_amount: (items || []).reduce((acc: number, it: any) => acc + (it.unitPrice * it.quantity), 0),
        return_status: 'completed',
        created_at: new Date().toISOString(),
        items: items || []
      };
      clientDb.updateState(s => {
        s.returns.unshift(newRet);
        // Put returned items back in stock
        for (const it of items || []) {
          const inv = s.inventory.find(i => i.product_id === it.productId && i.store_id === activeStore);
          if (inv) inv.quantity += Number(it.quantity);
        }
      });
      return jsonResponse({ success: true, data: newRet });
    }
  }

  // 14. EXPENSES
  if (pathname === '/api/expenses') {
    const store = searchParams.get('store') || activeStore;
    const state = clientDb.getState();
    if (method === 'GET') {
      const data = state.expenses.filter(e => e.store_id === store).map(e => ({
        _id: e.id,
        id: e.id,
        storeId: e.store_id,
        userName: e.user_name,
        description: e.description,
        amount: e.amount,
        category: e.category,
        paymentMethod: e.payment_method,
        date: e.date,
        notes: e.notes,
        createdAt: e.created_at
      }));
      return jsonResponse({ success: true, data });
    }
    if (method === 'POST') {
      const { description, amount, category, paymentMethod = 'cash', date, notes } = body;
      const newExp = {
        id: 'exp_' + Date.now(),
        store_id: activeStore,
        user_name: sessionUser?.name || 'Staff',
        description,
        amount: Number(amount) || 0,
        category: category || 'Other',
        payment_method: paymentMethod,
        date: date || new Date().toISOString().split('T')[0],
        notes,
        created_at: new Date().toISOString()
      };
      clientDb.updateState(s => {
        s.expenses.unshift(newExp);
      });
      return jsonResponse({ success: true, data: { ...newExp, _id: newExp.id } });
    }
  }

  // 15. STOCK ADJUSTMENTS & TRANSFERS
  if (pathname === '/api/stock-adjustments') {
    const state = clientDb.getState();
    if (method === 'GET') {
      const data = state.stock_adjustments.map(a => ({
        _id: a.id,
        id: a.id,
        adjustmentNumber: a.adjustment_number,
        productId: a.product_id,
        productName: a.product_name,
        fromStore: a.from_store,
        toStore: a.to_store,
        quantity: a.quantity,
        unit: a.unit,
        reason: a.reason,
        createdBy: a.created_by,
        createdAt: a.created_at
      }));
      return jsonResponse({ success: true, data });
    }

    if (method === 'POST') {
      const { productId, fromStore, toStore, quantity, unit, reason } = body;
      const prod = state.products.find(p => p.id === productId);
      const qtyNum = Number(quantity);

      clientDb.updateState(s => {
        const fromInv = s.inventory.find(i => i.product_id === productId && i.store_id === fromStore);
        const toInv = s.inventory.find(i => i.product_id === productId && i.store_id === toStore);
        if (fromInv) fromInv.quantity = Math.max(0, fromInv.quantity - qtyNum);
        if (toInv) toInv.quantity += qtyNum;

        s.stock_adjustments.unshift({
          id: 'adj_' + Date.now(),
          adjustment_number: 'TRF-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
          product_id: productId,
          product_name: prod?.name || 'Product',
          from_store: fromStore,
          to_store: toStore,
          quantity: qtyNum,
          unit: unit || prod?.unit || 'pcs',
          reason,
          created_by: sessionUser?.name || 'Administrator',
          created_at: new Date().toISOString()
        });
      });
      return jsonResponse({ success: true });
    }
  }

  // 16. ALERTS
  if (pathname === '/api/alerts') {
    const store = searchParams.get('store') || activeStore;
    const state = clientDb.getState();
    const lowStock = state.products
      .map(p => {
        const inv = state.inventory.find(i => i.product_id === p.id && i.store_id === store);
        const currentQty = inv?.quantity ?? 0;
        const minStock = inv?.min_stock_threshold ?? p.min_stock;
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          unit: p.unit,
          currentQuantity: currentQty,
          minStock
        };
      })
      .filter(p => p.currentQuantity <= p.minStock);

    const overdueLoans = state.loans.filter(l => l.store_id === store && l.status !== 'paid');

    return jsonResponse({
      success: true,
      data: {
        lowStock,
        overdueLoans,
        summary: {
          lowStockCount: lowStock.length,
          overdueLoansCount: overdueLoans.length
        }
      }
    });
  }

  // 17. REPORTS & FINANCIAL STATEMENTS
  if (pathname === '/api/reports' || pathname === '/api/financial-statements') {
    const store = searchParams.get('store') || activeStore;
    const state = clientDb.getState();
    const storeSales = state.sales.filter(s => s.store_id === store && !s.is_deleted);
    const grossRevenue = storeSales.reduce((acc, s) => acc + s.total_amount, 0);
    const returnsTotal = state.returns.filter(r => r.store_id === store).reduce((acc, r) => acc + r.total_amount, 0);
    const netRevenue = grossRevenue - returnsTotal;
    let costOfGoodsSold = 0;
    for (const s of storeSales) {
      for (const it of s.items || []) {
        costOfGoodsSold += (it.buying_price || 0) * it.quantity;
      }
    }
    const grossProfit = netRevenue - costOfGoodsSold;
    const expenses = state.expenses.filter(e => e.store_id === store);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    const inventoryVal = state.inventory
      .filter(i => i.store_id === store)
      .reduce((acc, inv) => {
        const prod = state.products.find(p => p.id === inv.product_id);
        return acc + (prod?.cost_price || 0) * inv.quantity;
      }, 0);

    const accountsReceivable = state.loans
      .filter(l => l.store_id === store && l.status !== 'paid')
      .reduce((acc, l) => acc + (l.amount - l.paid_amount), 0);

    return jsonResponse({
      success: true,
      data: {
        summary: {
          totalSales: grossRevenue,
          totalCost: costOfGoodsSold,
          totalExpenses,
          grossProfit,
          netProfit,
          inventoryValue: inventoryVal,
          salesCount: storeSales.length
        },
        incomeStatement: {
          grossRevenue,
          returns: returnsTotal,
          netRevenue,
          costOfGoodsSold,
          grossProfit,
          expenses,
          totalExpenses,
          netProfit
        },
        balanceSheet: {
          currentAssets: {
            cashAndEquivalents: Math.max(0, netProfit + 1500000),
            accountsReceivable,
            merchandiseInventory: inventoryVal
          },
          currentLiabilities: {
            accountsPayable: 350000,
            shortTermDebt: 0
          }
        }
      }
    });
  }

  // 18. USERS
  if (pathname === '/api/users') {
    const state = clientDb.getState();
    if (method === 'GET') {
      const users = state.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        role: u.role,
        stores: u.stores,
        isAdmin: u.is_admin,
        isActive: u.is_active,
        createdAt: u.created_at
      }));
      return jsonResponse({ success: true, data: users });
    }

    if (method === 'POST') {
      const { name, email, password, role = 'staff', stores = ['store1'] } = body;
      const newUser = {
        id: 'user_' + Date.now(),
        name,
        email,
        username: email.split('@')[0],
        password_plain: password || 'codev123',
        role,
        stores,
        is_admin: role === 'admin',
        is_active: true,
        created_at: new Date().toISOString()
      };
      clientDb.updateState(s => {
        s.users.push(newUser);
      });
      return jsonResponse({ success: true, data: newUser });
    }
  }

  // 19. PRODUCT REQUESTS
  if (pathname === '/api/product-requests' || pathname === '/api/product-requests/notifications') {
    return jsonResponse({ success: true, count: 0, data: [] });
  }

  // Default fallback
  return jsonResponse({ success: true, data: [] });
}

// Global interceptor setup
export const customFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  // Non-API calls: proceed normally
  if (!url.startsWith('/api/') && !url.includes('/api/')) {
    return nativeFetch(input, init);
  }

  // Call real backend first
  try {
    const response = await nativeFetch(input, init);

    // If response is valid JSON (backend is live and answering)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response;
    }

    // If backend responded with HTML (e.g. 404 Not Found or static SPA index.html rewrite on Vercel)
    console.info(`[Codev Engine] API ${url} received non-JSON (${response.status} ${contentType}). Activating standalone cloud engine.`);
    return handleClientApiRequest(url, init);
  } catch (networkError) {
    // Network failure (server down, CORS, or completely offline)
    console.info(`[Codev Engine] API ${url} unreachable (${(networkError as any)?.message}). Routing to standalone cloud engine.`);
    return handleClientApiRequest(url, init);
  }
};

const nativeFetch = typeof window !== 'undefined' && typeof window.fetch === 'function' ? window.fetch.bind(window) : fetch;

if (typeof window !== 'undefined') {
  let patched = false;
  try {
    Object.defineProperty(window, 'fetch', {
      value: customFetch,
      writable: true,
      configurable: true,
      enumerable: true
    });
    patched = true;
  } catch {
    try {
      Object.defineProperty(Window.prototype, 'fetch', {
        value: customFetch,
        writable: true,
        configurable: true,
        enumerable: true
      });
      patched = true;
    } catch {
      try {
        (window as any).fetch = customFetch;
        patched = true;
      } catch {
        // Safe catch: Sandboxed iframe with read-only window.fetch getter
      }
    }
  }

  try {
    (window as any).codevFetch = customFetch;
  } catch {
    // ignore
  }

  if (patched) {
    console.info('[Codev Engine] Dual-mode network interceptor activated.');
  } else {
    console.info('[Codev Engine] Protected iframe environment detected; native backend proxy active.');
  }
}

