import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'data/hardware.db');
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

export function runDataSeeder() {
  console.log('[Codev Seeder] Inserting rich hardware dataset into database...');

  // 1. PRODUCTS
  const additionalProducts = [
    {
      id: 'p_13',
      sku: 'BAR-DEF-10M',
      name: 'Reinforcement Steel Bar T10 (12m)',
      category: 'Building Materials',
      unit: 'bars',
      cost_price: 9500,
      selling_price: 11800,
      min_stock: 40,
      pack_units: JSON.stringify([{ name: 'bundle', factor: 10, price: 114000 }]),
      store1_qty: 120,
      store2_qty: 70
    },
    {
      id: 'p_14',
      sku: 'PLY-MAR-18',
      name: 'Marine Plywood Sheet 18mm (8x4 ft)',
      category: 'Building Materials',
      unit: 'sheets',
      cost_price: 36000,
      selling_price: 45000,
      min_stock: 15,
      pack_units: JSON.stringify([]),
      store1_qty: 28,
      store2_qty: 14
    },
    {
      id: 'p_15',
      sku: 'SND-RVR-CBM',
      name: 'River Sand Fine Washed (Cubic Metre)',
      category: 'Building Materials',
      unit: 'm³',
      cost_price: 22000,
      selling_price: 28000,
      min_stock: 10,
      pack_units: JSON.stringify([{ name: 'truck', factor: 10, price: 270000 }]),
      store1_qty: 35,
      store2_qty: 20
    },
    {
      id: 'p_16',
      sku: 'IRN-SHT-30B',
      name: 'Iron Sheets Gauge 30 (2.5m Royal Blue)',
      category: 'Roofing & Metals',
      unit: 'pcs',
      cost_price: 11200,
      selling_price: 13500,
      min_stock: 25,
      pack_units: JSON.stringify([{ name: 'bundle', factor: 20, price: 260000 }]),
      store1_qty: 90,
      store2_qty: 45
    },
    {
      id: 'p_17',
      sku: 'VAL-GTR-3M',
      name: 'Valley Gutter Sheet Galvanized 3m',
      category: 'Roofing & Metals',
      unit: 'pcs',
      cost_price: 8500,
      selling_price: 11000,
      min_stock: 15,
      pack_units: JSON.stringify([]),
      store1_qty: 32,
      store2_qty: 18
    },
    {
      id: 'p_18',
      sku: 'PNT-SLK-20L',
      name: 'Silk Emulsion Interior Warm Cream 20L',
      category: 'Paints & Finishes',
      unit: 'buckets',
      cost_price: 62000,
      selling_price: 76000,
      min_stock: 8,
      pack_units: JSON.stringify([]),
      store1_qty: 19,
      store2_qty: 11
    },
    {
      id: 'p_19',
      sku: 'TLS-PNT-ROL9',
      name: 'Professional Paint Roller Set 9-inch with Tray',
      category: 'Paints & Finishes',
      unit: 'sets',
      cost_price: 4500,
      selling_price: 6500,
      min_stock: 12,
      pack_units: JSON.stringify([{ name: 'box', factor: 10, price: 60000 }]),
      store1_qty: 40,
      store2_qty: 22
    },
    {
      id: 'p_20',
      sku: 'TNK-ROT-1000',
      name: 'Roto Cylindrical Water Tank 1000 Litres (Black)',
      category: 'Plumbing',
      unit: 'pcs',
      cost_price: 145000,
      selling_price: 175000,
      min_stock: 4,
      pack_units: JSON.stringify([]),
      store1_qty: 6,
      store2_qty: 3
    },
    {
      id: 'p_21',
      sku: 'VLV-BRS-1IN',
      name: 'Brass Gate Valve 1-inch Heavy Duty',
      category: 'Plumbing',
      unit: 'pcs',
      cost_price: 6500,
      selling_price: 9200,
      min_stock: 15,
      pack_units: JSON.stringify([{ name: 'box', factor: 10, price: 88000 }]),
      store1_qty: 54,
      store2_qty: 28
    },
    {
      id: 'p_22',
      sku: 'ELC-CBL-1.5',
      name: 'Copper Electric Cable 1.5mm² 100m Roll (Red)',
      category: 'Electricals',
      unit: 'rolls',
      cost_price: 32000,
      selling_price: 41000,
      min_stock: 10,
      pack_units: JSON.stringify([]),
      store1_qty: 26,
      store2_qty: 15
    },
    {
      id: 'p_23',
      sku: 'ELC-FLD-100W',
      name: 'LED Outdoor Waterproof Floodlight 100W IP66',
      category: 'Electricals',
      unit: 'pcs',
      cost_price: 24000,
      selling_price: 32500,
      min_stock: 8,
      pack_units: JSON.stringify([{ name: 'carton', factor: 6, price: 185000 }]),
      store1_qty: 22,
      store2_qty: 12
    },
    {
      id: 'p_24',
      sku: 'LCK-MRT-SET',
      name: 'Heavy Duty Mortise Door Lock Set (Brass Handle)',
      category: 'Fasteners & Hardware',
      unit: 'sets',
      cost_price: 18500,
      selling_price: 24500,
      min_stock: 10,
      pack_units: JSON.stringify([{ name: 'box', factor: 12, price: 280000 }]),
      store1_qty: 38,
      store2_qty: 20
    },
    {
      id: 'p_25',
      sku: 'PDL-BRS-60',
      name: 'Tri-Circle Brass Padlock 60mm with 3 Keys',
      category: 'Fasteners & Hardware',
      unit: 'pcs',
      cost_price: 5200,
      selling_price: 7500,
      min_stock: 20,
      pack_units: JSON.stringify([{ name: 'box', factor: 12, price: 84000 }]),
      store1_qty: 75,
      store2_qty: 40
    },
    {
      id: 'p_26',
      sku: 'TLS-BOS-RHM',
      name: 'Bosch Professional Rotary Hammer Drill 800W',
      category: 'Tools & Equipment',
      unit: 'pcs',
      cost_price: 110000,
      selling_price: 138000,
      min_stock: 3,
      pack_units: JSON.stringify([]),
      store1_qty: 5,
      store2_qty: 2
    },
    {
      id: 'p_27',
      sku: 'TLS-TTL-AG',
      name: 'Total Angle Grinder 115mm 750W',
      category: 'Tools & Equipment',
      unit: 'pcs',
      cost_price: 38000,
      selling_price: 49000,
      min_stock: 4,
      pack_units: JSON.stringify([]),
      store1_qty: 7,
      store2_qty: 4
    },
    {
      id: 'p_28',
      sku: 'TLS-STN-TP8',
      name: 'Stanley PowerLock Tape Measure 8m / 26ft',
      category: 'Tools & Equipment',
      unit: 'pcs',
      cost_price: 6500,
      selling_price: 9500,
      min_stock: 15,
      pack_units: JSON.stringify([{ name: 'box', factor: 12, price: 108000 }]),
      store1_qty: 48,
      store2_qty: 25
    }
  ];

  const insertProd = db.prepare(`
    INSERT OR REPLACE INTO products (id, sku, name, category, unit, cost_price, selling_price, min_stock, pack_units, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const insertInv = db.prepare(`
    INSERT OR REPLACE INTO store_inventory (id, store_id, product_id, quantity, min_stock_threshold, last_updated)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);

  for (const p of additionalProducts) {
    insertProd.run(p.id, p.sku, p.name, p.category, p.unit, p.cost_price, p.selling_price, p.min_stock, p.pack_units);
    insertInv.run(`${p.id}_store1`, 'store1', p.id, p.store1_qty, p.min_stock);
    insertInv.run(`${p.id}_store2`, 'store2', p.id, p.store2_qty, p.min_stock);
  }

  // 2. CUSTOMERS & SUPPLIERS
  const additionalCS = [
    {
      id: 'cs_6',
      type: 'customer',
      name: 'Inyange Real Estate Developers',
      phone: '+250 788 777 666',
      email: 'contact@inyangerealestate.rw',
      address: 'Kibagabaga, Gasabo, Kigali',
      balance: 380000,
      notes: 'Monthly billing account for apartment construction.'
    },
    {
      id: 'cs_7',
      type: 'customer',
      name: 'Diane Mukamana',
      phone: '+250 788 443 322',
      email: 'diane.m@gmail.com',
      address: 'Kimironko, Kigali',
      balance: 0,
      notes: 'Residential home finishing project.'
    },
    {
      id: 'cs_8',
      type: 'customer',
      name: 'Cedric Niyonzima',
      phone: '+250 789 123 789',
      email: 'cniyonzima@yahoo.fr',
      address: 'Kinyinya, Gasabo, Kigali',
      balance: 125000,
      notes: 'Credit line approved up to 200,000 RWF.'
    },
    {
      id: 'cs_9',
      type: 'customer',
      name: 'Great Lakes Engineering Co.',
      phone: '+250 788 554 433',
      email: 'office@greatlakeseng.com',
      address: 'Gisozi Commercial District, Kigali',
      balance: 620000,
      notes: 'Corporate client with tax exemption certificate.'
    },
    {
      id: 'cs_10',
      type: 'customer',
      name: 'Ubumwe Hardware Retailers',
      phone: '+250 788 223 344',
      email: 'ubumwe.store@gmail.com',
      address: 'Remera, Kigali',
      balance: 0,
      notes: 'Wholesale client for cement and roofing sheets.'
    },
    {
      id: 'cs_11',
      type: 'supplier',
      name: 'Sadolin Paints Rwanda Ltd',
      phone: '+250 788 665 544',
      email: 'distribution@sadolin.rw',
      address: 'Gikondo Industrial Park, Kigali',
      balance: 0,
      notes: 'Paint manufacturer official supply contract.'
    },
    {
      id: 'cs_12',
      type: 'supplier',
      name: 'Bralirwa Steel & Metal Works',
      phone: '+250 788 889 900',
      email: 'sales@steelrwanda.rw',
      address: 'Masoro Prime SEZ, Kigali',
      balance: 0,
      notes: 'Manufacturer of steel reinforcement bars and iron sheets.'
    }
  ];

  const insertCS = db.prepare(`
    INSERT OR REPLACE INTO customers_suppliers (id, type, name, phone, email, address, balance, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const cs of additionalCS) {
    insertCS.run(cs.id, cs.type, cs.name, cs.phone, cs.email, cs.address, cs.balance, cs.notes);
  }

  // 3. MORE REALISTIC SALES
  const moreSales = [
    {
      id: 'sale_4',
      sale_number: 'SAL-2026-0004',
      store_id: 'store1',
      user_id: 'user_admin_1',
      user_name: 'System Administrator',
      customer_name: 'Inyange Real Estate Developers',
      customer_phone: '+250 788 777 666',
      subtotal: 585000,
      discount: 25000,
      total_amount: 560000,
      payment_status: 'paid',
      payment_method: 'bank_transfer',
      created_at: "datetime('now', '-3 days')",
      items: [
        { product_id: 'p_2', product_name: 'Cimerwa Blue Plus 42.5N 50kg', sku: 'CEM-CIM-50', unit: 'bags', qty: 25, price: 14800, cost: 12500 },
        { product_id: 'p_11', product_name: 'Deformed Reinforcement Bar T12 (12m)', sku: 'BAR-DEF-12M', unit: 'bars', qty: 10, price: 16200, cost: 13500 },
        { product_id: 'p_10', product_name: 'Steel Concrete Nails 4-inch (Box 1kg)', sku: 'NAL-CON-4IN', unit: 'boxes', qty: 15, price: 3800, cost: 2800 }
      ]
    },
    {
      id: 'sale_5',
      sale_number: 'SAL-2026-0005',
      store_id: 'store2',
      user_id: 'user_manager_1',
      user_name: 'Aline Uwase',
      customer_name: 'Cedric Niyonzima',
      customer_phone: '+250 789 123 789',
      subtotal: 175000,
      discount: 5000,
      total_amount: 170000,
      payment_status: 'paid',
      payment_method: 'mobile_money',
      created_at: "datetime('now', '-2 days')",
      items: [
        { product_id: 'p_20', product_name: 'Roto Cylindrical Water Tank 1000 Litres (Black)', sku: 'TNK-ROT-1000', unit: 'pcs', qty: 1, price: 175000, cost: 145000 }
      ]
    },
    {
      id: 'sale_6',
      sale_number: 'SAL-2026-0006',
      store_id: 'store1',
      user_id: 'user_staff_1',
      user_name: 'Eric Mugisha',
      customer_name: 'Diane Mukamana',
      customer_phone: '+250 788 443 322',
      subtotal: 218500,
      discount: 8500,
      total_amount: 210000,
      payment_status: 'paid',
      payment_method: 'mobile_money',
      created_at: "datetime('now', '-1 day')",
      items: [
        { product_id: 'p_4', product_name: 'Sadolin Weatherguard White 20L', sku: 'PNT-SAD-20L', unit: 'buckets', qty: 2, price: 82000, cost: 68000 },
        { product_id: 'p_19', product_name: 'Professional Paint Roller Set 9-inch with Tray', sku: 'TLS-PNT-ROL9', unit: 'sets', qty: 4, price: 6500, cost: 4500 },
        { product_id: 'p_5', product_name: 'Gloss Oil Paint Brilliant White 4L', sku: 'PNT-GLS-4L', unit: 'tins', qty: 1, price: 23500, cost: 18000 },
        { product_id: 'p_28', product_name: 'Stanley PowerLock Tape Measure 8m / 26ft', sku: 'TLS-STN-TP8', unit: 'pcs', qty: 1, price: 9500, cost: 6500 }
      ]
    },
    {
      id: 'sale_7',
      sale_number: 'SAL-2026-0007',
      store_id: 'store2',
      user_id: 'user_manager_1',
      user_name: 'Aline Uwase',
      customer_name: 'Great Lakes Engineering Co.',
      customer_phone: '+250 788 554 433',
      subtotal: 486000,
      discount: 16000,
      total_amount: 470000,
      payment_status: 'paid',
      payment_method: 'bank_transfer',
      created_at: "datetime('now', '-12 hours')",
      items: [
        { product_id: 'p_26', product_name: 'Bosch Professional Rotary Hammer Drill 800W', sku: 'TLS-BOS-RHM', unit: 'pcs', qty: 2, price: 138000, cost: 110000 },
        { product_id: 'p_27', product_name: 'Total Angle Grinder 115mm 750W', sku: 'TLS-TTL-AG', unit: 'pcs', qty: 2, price: 49000, cost: 38000 },
        { product_id: 'p_22', product_name: 'Copper Electric Cable 1.5mm² 100m Roll (Red)', sku: 'ELC-CBL-1.5', unit: 'rolls', qty: 2, price: 41000, cost: 32000 },
        { product_id: 'p_23', product_name: 'LED Outdoor Waterproof Floodlight 100W IP66', sku: 'ELC-FLD-100W', unit: 'pcs', qty: 1, price: 32500, cost: 24000 }
      ]
    },
    {
      id: 'sale_8',
      sale_number: 'SAL-2026-0008',
      store_id: 'store1',
      user_id: 'user_staff_1',
      user_name: 'Eric Mugisha',
      customer_name: 'Jean Paul Habimana',
      customer_phone: '+250 783 222 111',
      subtotal: 104500,
      discount: 4500,
      total_amount: 100000,
      payment_status: 'paid',
      payment_method: 'cash',
      created_at: "datetime('now', '-4 hours')",
      items: [
        { product_id: 'p_24', product_name: 'Heavy Duty Mortise Door Lock Set (Brass Handle)', sku: 'LCK-MRT-SET', unit: 'sets', qty: 3, price: 24500, cost: 18500 },
        { product_id: 'p_25', product_name: 'Tri-Circle Brass Padlock 60mm with 3 Keys', sku: 'PDL-BRS-60', unit: 'pcs', qty: 4, price: 7500, cost: 5200 }
      ]
    },
    {
      id: 'sale_9',
      sale_number: 'SAL-2026-0009',
      store_id: 'store1',
      user_id: 'user_admin_1',
      user_name: 'System Administrator',
      customer_name: 'Kigali Prime Builders Ltd',
      customer_phone: '+250 788 333 444',
      subtotal: 825000,
      discount: 35000,
      total_amount: 790000,
      payment_status: 'paid',
      payment_method: 'bank_transfer',
      created_at: "datetime('now', '-1 hour')",
      items: [
        { product_id: 'p_1', product_name: 'Tororo Cement 32.5R 50kg', sku: 'CEM-TOR-50', unit: 'bags', qty: 40, price: 13500, cost: 11500 },
        { product_id: 'p_3', product_name: 'Iron Sheets Gauge 28 (3m Red)', sku: 'IRN-SHT-28', unit: 'pcs', qty: 15, price: 16500, cost: 14000 },
        { product_id: 'p_21', product_name: 'Brass Gate Valve 1-inch Heavy Duty', sku: 'VLV-BRS-1IN', unit: 'pcs', qty: 4, price: 9200, cost: 6500 }
      ]
    }
  ];

  const insertSale = db.prepare(`
    INSERT OR REPLACE INTO sales (id, sale_number, store_id, user_id, user_name, customer_name, customer_phone, subtotal, discount, total_amount, payment_status, payment_method, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const insertSaleItem = db.prepare(`
    INSERT OR REPLACE INTO sale_items (id, sale_id, product_id, product_name, product_sku, unit, quantity, selling_price, buying_price, total_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of moreSales) {
    insertSale.run(
      s.id,
      s.sale_number,
      s.store_id,
      s.user_id,
      s.user_name,
      s.customer_name,
      s.customer_phone,
      s.subtotal,
      s.discount,
      s.total_amount,
      s.payment_status,
      s.payment_method
    );

    for (let idx = 0; idx < s.items.length; idx++) {
      const it = s.items[idx];
      insertSaleItem.run(
        `${s.id}_item_${idx + 1}`,
        s.id,
        it.product_id,
        it.product_name,
        it.sku,
        it.unit,
        it.qty,
        it.price,
        it.cost,
        it.qty * it.price
      );
    }
  }

  // 4. INVOICES
  const additionalInvoices = [
    {
      id: 'inv_2',
      invoice_number: 'INV-2026-0002',
      type: 'invoice',
      sale_id: 'sale_4',
      store_id: 'store1',
      customer_name: 'Inyange Real Estate Developers',
      customer_email: 'contact@inyangerealestate.rw',
      customer_phone: '+250 788 777 666',
      status: 'paid',
      issue_date: '2026-10-29',
      due_date: '2026-11-12',
      subtotal: 585000,
      discount: 25000,
      total_amount: 560000,
      items_json: JSON.stringify([
        { description: 'Cimerwa Blue Plus 42.5N 50kg', quantity: 25, unit_price: 14800, total: 370000 },
        { description: 'Deformed Reinforcement Bar T12 (12m)', quantity: 10, unit_price: 16200, total: 162000 },
        { description: 'Steel Concrete Nails 4-inch (Box 1kg)', quantity: 15, unit_price: 3800, total: 57000 }
      ]),
      notes: 'Delivered to Inyange Phase 2 Construction Site.'
    },
    {
      id: 'inv_3',
      invoice_number: 'INV-2026-0003',
      type: 'invoice',
      sale_id: 'sale_7',
      store_id: 'store2',
      customer_name: 'Great Lakes Engineering Co.',
      customer_email: 'office@greatlakeseng.com',
      customer_phone: '+250 788 554 433',
      status: 'paid',
      issue_date: '2026-11-01',
      due_date: '2026-11-15',
      subtotal: 486000,
      discount: 16000,
      total_amount: 470000,
      items_json: JSON.stringify([
        { description: 'Bosch Professional Rotary Hammer Drill 800W', quantity: 2, unit_price: 13800, total: 276000 },
        { description: 'Total Angle Grinder 115mm 750W', quantity: 2, unit_price: 49000, total: 98000 },
        { description: 'Copper Electric Cable 1.5mm² 100m Roll (Red)', quantity: 2, unit_price: 41000, total: 82000 },
        { description: 'LED Outdoor Waterproof Floodlight 100W IP66', quantity: 1, unit_price: 32500, total: 32500 }
      ]),
      notes: 'Hardware & electrical equipment order.'
    },
    {
      id: 'inv_4',
      invoice_number: 'INV-2026-0004',
      type: 'invoice',
      sale_id: 'sale_9',
      store_id: 'store1',
      customer_name: 'Kigali Prime Builders Ltd',
      customer_email: 'info@primebuilders.rw',
      customer_phone: '+250 788 333 444',
      status: 'paid',
      issue_date: '2026-11-01',
      due_date: '2026-11-20',
      subtotal: 825000,
      discount: 35000,
      total_amount: 790000,
      items_json: JSON.stringify([
        { description: 'Tororo Cement 32.5R 50kg', quantity: 40, unit_price: 13500, total: 540000 },
        { description: 'Iron Sheets Gauge 28 (3m Red)', quantity: 15, unit_price: 16500, total: 247500 },
        { description: 'Brass Gate Valve 1-inch Heavy Duty', quantity: 4, unit_price: 9200, total: 36800 }
      ]),
      notes: 'Bulk purchase invoice.'
    },
    {
      id: 'inv_5',
      invoice_number: 'INV-2026-0005',
      type: 'proforma',
      sale_id: null,
      store_id: 'store1',
      customer_name: 'Horizon Construction Agency',
      customer_email: 'horizon@rwanda.rw',
      customer_phone: '+250 785 999 888',
      status: 'pending',
      issue_date: '2026-11-01',
      due_date: '2026-11-10',
      subtotal: 1250000,
      discount: 50000,
      total_amount: 1200000,
      items_json: JSON.stringify([
        { description: 'Tororo Cement 32.5R 50kg (Pallet 40 bags)', quantity: 2, unit_price: 530000, total: 1060000 },
        { description: 'Deformed Reinforcement Bar T12 (12m)', quantity: 10, unit_price: 16200, total: 162000 },
        { description: 'Stanley PowerLock Tape Measure 8m', quantity: 3, unit_price: 9500, total: 28500 }
      ]),
      notes: 'Proforma quotation for upcoming commercial warehouse foundations.'
    }
  ];

  const insertInvTable = db.prepare(`
    INSERT OR REPLACE INTO invoices (id, invoice_number, type, sale_id, store_id, customer_name, customer_email, customer_phone, status, issue_date, due_date, subtotal, discount, total_amount, items_json, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const inv of additionalInvoices) {
    insertInvTable.run(
      inv.id,
      inv.invoice_number,
      inv.type,
      inv.sale_id,
      inv.store_id,
      inv.customer_name,
      inv.customer_email,
      inv.customer_phone,
      inv.status,
      inv.issue_date,
      inv.due_date,
      inv.subtotal,
      inv.discount,
      inv.total_amount,
      inv.items_json,
      inv.notes
    );
  }

  // 5. LOANS (CREDIT CUSTOMERS)
  const additionalLoans = [
    {
      id: 'loan_2',
      store_id: 'store1',
      customer_name: 'Inyange Real Estate Developers',
      customer_phone: '+250 788 777 666',
      amount: 600000,
      paid_amount: 220000,
      due_date: '2026-11-25',
      status: 'pending',
      notes: 'Foundation materials credit line. Installment payment scheduled bi-weekly.'
    },
    {
      id: 'loan_3',
      store_id: 'store2',
      customer_name: 'Cedric Niyonzima',
      customer_phone: '+250 789 123 789',
      amount: 175000,
      paid_amount: 50000,
      due_date: '2026-11-15',
      status: 'pending',
      notes: 'Water tank & plumbing fittings credit.'
    },
    {
      id: 'loan_4',
      store_id: 'store1',
      customer_name: 'Horizon Construction Agency',
      customer_phone: '+250 785 999 888',
      amount: 850000,
      paid_amount: 430000,
      due_date: '2026-11-05',
      status: 'pending',
      notes: 'Steel rebar and timber credit line.'
    }
  ];

  const insertLoan = db.prepare(`
    INSERT OR REPLACE INTO loans (id, store_id, customer_name, customer_phone, amount, paid_amount, due_date, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const l of additionalLoans) {
    insertLoan.run(l.id, l.store_id, l.customer_name, l.customer_phone, l.amount, l.paid_amount, l.due_date, l.status, l.notes);
  }

  // 6. EXPENSES
  const additionalExpenses = [
    {
      id: 'exp_3',
      store_id: 'store1',
      user_id: 'user_admin_1',
      user_name: 'System Administrator',
      description: 'Store electricity utility bill (EUCL token)',
      amount: 45000,
      category: 'Utilities',
      payment_method: 'mobile_money',
      date: '2026-10-30',
      notes: 'Gisozi branch monthly prepaid electricity.'
    },
    {
      id: 'exp_4',
      store_id: 'store2',
      user_id: 'user_manager_1',
      user_name: 'Aline Uwase',
      description: 'Kinyinya branch monthly shop rent',
      amount: 250000,
      category: 'Rent',
      payment_method: 'bank_transfer',
      date: '2026-10-31',
      notes: 'Paid to property landlord for November.'
    },
    {
      id: 'exp_5',
      store_id: 'store1',
      user_id: 'user_staff_1',
      user_name: 'Eric Mugisha',
      description: 'Truck fuel for client cement deliveries',
      amount: 35000,
      category: 'Transport & Logistics',
      payment_method: 'cash',
      date: '2026-11-01',
      notes: '25 litres diesel at SP station.'
    },
    {
      id: 'exp_6',
      store_id: 'store1',
      user_id: 'user_admin_1',
      user_name: 'System Administrator',
      description: 'Loading & offloading labor (Cement shipment)',
      amount: 20000,
      category: 'Labor',
      payment_method: 'cash',
      date: '2026-11-01',
      notes: 'Offloaded 200 bags of Tororo cement.'
    },
    {
      id: 'exp_7',
      store_id: 'store2',
      user_id: 'user_manager_1',
      user_name: 'Aline Uwase',
      description: '4G WiFi fiber monthly subscription',
      amount: 28000,
      category: 'Utilities',
      payment_method: 'mobile_money',
      date: '2026-11-01',
      notes: 'CanalBox fiber internet for store POS.'
    }
  ];

  const insertExp = db.prepare(`
    INSERT OR REPLACE INTO expenses (id, store_id, user_id, user_name, description, amount, category, payment_method, date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const ex of additionalExpenses) {
    insertExp.run(ex.id, ex.store_id, ex.user_id, ex.user_name, ex.description, ex.amount, ex.category, ex.payment_method, ex.date, ex.notes);
  }

  // 7. STOCK ADJUSTMENTS / TRANSFERS
  const additionalTransfers = [
    {
      id: 'trans_1',
      adjustment_number: 'TRF-2026-0001',
      product_id: 'p_1',
      product_name: 'Tororo Cement 32.5R 50kg',
      from_store: 'store1',
      to_store: 'store2',
      quantity: 25,
      unit: 'bags',
      reason: 'High customer demand for foundation cement in Kinyinya branch',
      created_by: 'System Administrator'
    },
    {
      id: 'trans_2',
      adjustment_number: 'TRF-2026-0002',
      product_id: 'p_4',
      product_name: 'Sadolin Weatherguard White 20L',
      from_store: 'store1',
      to_store: 'store2',
      quantity: 5,
      unit: 'buckets',
      reason: 'Stock replenishment for residential building painting',
      created_by: 'Aline Uwase'
    },
    {
      id: 'trans_3',
      adjustment_number: 'TRF-2026-0003',
      product_id: 'p_8',
      product_name: 'Copper Electric Cable 2.5mm² 100m Roll',
      from_store: 'store2',
      to_store: 'store1',
      quantity: 4,
      unit: 'rolls',
      reason: 'Urgent contractor order fulfillment at Gisozi',
      created_by: 'Eric Mugisha'
    },
    {
      id: 'trans_4',
      adjustment_number: 'TRF-2026-0004',
      product_id: 'p_6',
      product_name: 'PVC Drainage Pipe 110mm x 6m',
      from_store: 'store1',
      to_store: 'store2',
      quantity: 10,
      unit: 'pcs',
      reason: 'Plumbing contractor site replenishment',
      created_by: 'System Administrator'
    }
  ];

  const insertTrf = db.prepare(`
    INSERT OR REPLACE INTO stock_adjustments (id, adjustment_number, product_id, product_name, from_store, to_store, quantity, unit, reason, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const trf of additionalTransfers) {
    insertTrf.run(trf.id, trf.adjustment_number, trf.product_id, trf.product_name, trf.from_store, trf.to_store, trf.quantity, trf.unit, trf.reason, trf.created_by);
  }

  // 8. PRODUCT REQUESTS
  const additionalRequests = [
    {
      id: 'req_1',
      store_id: 'store1',
      product_id: null,
      kind: 'new',
      name: 'Tile Adhesive Cement 25kg (Bostik Fix)',
      category: 'Building Materials',
      sku: 'ADH-BST-25KG',
      unit: 'bags',
      price: 9500,
      cost_price: 7200,
      quantity: 50,
      min_stock: 15,
      pack_units: '[]',
      requested_by: 'Eric Mugisha',
      status: 'pending',
      review_note: 'Multiple customers requesting Bostik tile glue for bathroom tiling.'
    },
    {
      id: 'req_2',
      store_id: 'store2',
      product_id: null,
      kind: 'new',
      name: 'Heavy Duty Clear Safety Glasses / Goggles',
      category: 'Tools & Equipment',
      sku: 'SFT-GGL-CLR',
      unit: 'pcs',
      price: 3500,
      cost_price: 2200,
      quantity: 30,
      min_stock: 10,
      pack_units: '[]',
      requested_by: 'Aline Uwase',
      status: 'approved',
      review_note: 'Approved for stock purchase.'
    },
    {
      id: 'req_3',
      store_id: 'store1',
      product_id: 'p_11',
      kind: 'edit',
      name: 'Deformed Reinforcement Bar T12 (12m)',
      category: 'Building Materials',
      sku: 'BAR-DEF-12M',
      unit: 'bars',
      price: 16500,
      cost_price: 13500,
      quantity: 30,
      min_stock: 40,
      pack_units: '[]',
      requested_by: 'Eric Mugisha',
      status: 'pending',
      review_note: 'Supplier increased cost by 500 RWF; requesting retail price adjustment.'
    }
  ];

  const insertReq = db.prepare(`
    INSERT OR REPLACE INTO product_requests (id, store_id, product_id, kind, name, category, sku, unit, price, cost_price, quantity, min_stock, pack_units, requested_by, status, review_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const r of additionalRequests) {
    insertReq.run(r.id, r.store_id, r.product_id, r.kind, r.name, r.category, r.sku, r.unit, r.price, r.cost_price, r.quantity, r.min_stock, r.pack_units, r.requested_by, r.status, r.review_note);
  }

  // 9. RETURNS
  const additionalReturns = [
    {
      id: 'ret_1',
      return_number: 'RET-2026-0001',
      sale_id: 'sale_1',
      store_id: 'store1',
      user_id: 'user_staff_1',
      user_name: 'Eric Mugisha',
      customer_name: 'Kigali Prime Builders Ltd',
      reason: 'Surplus boxes of nails not needed after roofing completion',
      total_amount: 11400,
      return_status: 'completed',
      item: {
        product_id: 'p_10',
        product_name: 'Steel Concrete Nails 4-inch (Box 1kg)',
        unit: 'boxes',
        qty: 3,
        unit_price: 3800
      }
    },
    {
      id: 'ret_2',
      return_number: 'RET-2026-0002',
      sale_id: 'sale_6',
      store_id: 'store1',
      user_id: 'user_staff_1',
      user_name: 'Eric Mugisha',
      customer_name: 'Diane Mukamana',
      reason: 'Unopened extra tin of gloss white paint exchanged for credit',
      total_amount: 23500,
      return_status: 'completed',
      item: {
        product_id: 'p_5',
        product_name: 'Gloss Oil Paint Brilliant White 4L',
        unit: 'tins',
        qty: 1,
        unit_price: 23500
      }
    }
  ];

  const insertRet = db.prepare(`
    INSERT OR REPLACE INTO returns (id, return_number, sale_id, store_id, user_id, user_name, customer_name, reason, total_amount, return_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRetItem = db.prepare(`
    INSERT OR REPLACE INTO return_items (id, return_id, product_id, product_name, unit, quantity, unit_price, total_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const ret of additionalReturns) {
    insertRet.run(ret.id, ret.return_number, ret.sale_id, ret.store_id, ret.user_id, ret.user_name, ret.customer_name, ret.reason, ret.total_amount, ret.return_status);
    insertRetItem.run(
      `${ret.id}_item_1`,
      ret.id,
      ret.item.product_id,
      ret.item.product_name,
      ret.item.unit,
      ret.item.qty,
      ret.item.unit_price,
      ret.total_amount
    );
  }

  console.log('[Codev Seeder] Dataset inserted successfully!');
}

runDataSeeder();
