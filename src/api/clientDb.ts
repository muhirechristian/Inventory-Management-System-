/**
 * Codev Client-Side Autonomous Database Engine
 * Provides full offline, standalone, and Vercel cloud hosting persistence.
 * Allows the application to work 100% seamlessly without requiring a separate active backend server.
 */

const STORAGE_KEY = 'codev_hardware_db_v3';
const SESSION_KEY = 'codev_hardware_session_v3';

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  min_stock: number;
  pack_units: { name: string; factor: number; price: number }[];
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  store_id: string;
  product_id: string;
  quantity: number;
  min_stock_threshold: number;
  last_updated: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  unit: string;
  quantity: number;
  selling_price: number;
  buying_price: number;
  total_price: number;
}

export interface Sale {
  id: string;
  sale_number: string;
  store_id: string;
  user_id: string;
  user_name: string;
  customer_name: string;
  customer_phone?: string;
  subtotal: number;
  discount: number;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  is_deleted: number;
  deleted_at?: string;
  deleted_by?: string;
  notes?: string;
  created_at: string;
  items: SaleItem[];
}

export interface Invoice {
  id: string;
  invoice_number: string;
  type: string;
  sale_id?: string;
  store_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  status: string;
  issue_date: string;
  due_date?: string;
  subtotal: number;
  discount: number;
  total_amount: number;
  items_json: string;
  notes?: string;
  created_at: string;
}

export interface CustomerSupplier {
  id: string;
  type: 'customer' | 'supplier';
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
  notes?: string;
  created_at: string;
}

export interface Loan {
  id: string;
  store_id: string;
  customer_name: string;
  customer_phone?: string;
  amount: number;
  paid_amount: number;
  due_date: string;
  status: 'pending' | 'overdue' | 'paid';
  notes?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  store_id: string;
  user_id?: string;
  user_name?: string;
  description: string;
  amount: number;
  category: string;
  payment_method: string;
  date: string;
  notes?: string;
  created_at: string;
}

export interface StockAdjustment {
  id: string;
  adjustment_number: string;
  product_id: string;
  product_name: string;
  from_store: string;
  to_store: string;
  quantity: number;
  unit: string;
  reason?: string;
  created_by?: string;
  created_at: string;
}

export interface ProductRequest {
  id: string;
  store_id: string;
  product_id?: string;
  kind: 'new' | 'edit';
  name: string;
  category: string;
  sku?: string;
  unit: string;
  price: number;
  cost_price?: number;
  quantity?: number;
  min_stock?: number;
  pack_units: string;
  requested_by: string;
  status: 'pending' | 'approved' | 'rejected';
  review_note?: string;
  created_at: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  username: string;
  password_plain: string; // Used for client-side local verification
  role: string;
  stores: string[];
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Store {
  id: string;
  name: string;
  code: string;
  location: string;
  phone: string;
  is_active: boolean;
}

export interface ReturnRecord {
  id: string;
  return_number: string;
  sale_id?: string;
  store_id: string;
  user_id?: string;
  user_name?: string;
  customer_name: string;
  reason?: string;
  total_amount: number;
  return_status: string;
  created_at: string;
  items: {
    id: string;
    product_id: string;
    product_name: string;
    unit: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
  }[];
}

interface DatabaseState {
  users: UserAccount[];
  stores: Store[];
  products: ProductItem[];
  inventory: InventoryItem[];
  sales: Sale[];
  invoices: Invoice[];
  customers_suppliers: CustomerSupplier[];
  loans: Loan[];
  expenses: Expense[];
  stock_adjustments: StockAdjustment[];
  product_requests: ProductRequest[];
  returns: ReturnRecord[];
}

function getInitialData(): DatabaseState {
  const products: ProductItem[] = [
    {
      id: 'p_1',
      sku: 'CEM-TOR-50',
      name: 'Tororo Cement 32.5R 50kg',
      category: 'Building Materials',
      unit: 'bags',
      cost_price: 11500,
      selling_price: 13500,
      min_stock: 50,
      pack_units: [{ name: 'pallet', factor: 40, price: 530000 }],
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [{ name: 'pallet', factor: 40, price: 580000 }],
      created_at: new Date(Date.now() - 86400000 * 28).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [{ name: 'bundle', factor: 20, price: 320000 }],
      created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [],
      created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [{ name: 'carton', factor: 4, price: 90000 }],
      created_at: new Date(Date.now() - 86400000 * 18).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [],
      created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [{ name: 'bundle', factor: 10, price: 56000 }],
      created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [],
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [{ name: 'box', factor: 12, price: 78000 }],
      created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [{ name: 'carton', factor: 20, price: 72000 }],
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [],
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [],
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'p_13',
      sku: 'BAR-DEF-10M',
      name: 'Reinforcement Steel Bar T10 (12m)',
      category: 'Building Materials',
      unit: 'bars',
      cost_price: 9500,
      selling_price: 11800,
      min_stock: 40,
      pack_units: [{ name: 'bundle', factor: 10, price: 114000 }],
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [],
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [{ name: 'truck', factor: 10, price: 270000 }],
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [{ name: 'bundle', factor: 20, price: 260000 }],
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [],
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [],
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [{ name: 'box', factor: 10, price: 60000 }],
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [],
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [{ name: 'box', factor: 10, price: 88000 }],
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [],
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [{ name: 'carton', factor: 6, price: 185000 }],
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [{ name: 'box', factor: 12, price: 280000 }],
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [{ name: 'box', factor: 12, price: 84000 }],
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [],
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [],
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: new Date().toISOString()
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
      pack_units: [{ name: 'box', factor: 12, price: 108000 }],
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const initialQty: Record<string, { store1: number; store2: number }> = {
    p_1: { store1: 180, store2: 95 },
    p_2: { store1: 140, store2: 60 },
    p_3: { store1: 85, store2: 40 },
    p_4: { store1: 24, store2: 12 },
    p_5: { store1: 36, store2: 18 },
    p_6: { store1: 42, store2: 25 },
    p_7: { store1: 110, store2: 55 },
    p_8: { store1: 18, store2: 9 },
    p_9: { store1: 65, store2: 30 },
    p_10: { store1: 88, store2: 45 },
    p_11: { store1: 15, store2: 60 }, // Low stock in store 1
    p_12: { store1: 4, store2: 8 },    // Low stock in store 1
    p_13: { store1: 120, store2: 70 },
    p_14: { store1: 28, store2: 14 },
    p_15: { store1: 35, store2: 20 },
    p_16: { store1: 90, store2: 45 },
    p_17: { store1: 32, store2: 18 },
    p_18: { store1: 19, store2: 11 },
    p_19: { store1: 40, store2: 22 },
    p_20: { store1: 6, store2: 3 },
    p_21: { store1: 54, store2: 28 },
    p_22: { store1: 26, store2: 15 },
    p_23: { store1: 22, store2: 12 },
    p_24: { store1: 38, store2: 20 },
    p_25: { store1: 75, store2: 40 },
    p_26: { store1: 5, store2: 2 },
    p_27: { store1: 7, store2: 4 },
    p_28: { store1: 48, store2: 25 }
  };

  const inventory: InventoryItem[] = [];
  for (const p of products) {
    const q = initialQty[p.id] || { store1: 20, store2: 10 };
    inventory.push({
      id: `${p.id}_store1`,
      store_id: 'store1',
      product_id: p.id,
      quantity: q.store1,
      min_stock_threshold: p.min_stock,
      last_updated: new Date().toISOString()
    });
    inventory.push({
      id: `${p.id}_store2`,
      store_id: 'store2',
      product_id: p.id,
      quantity: q.store2,
      min_stock_threshold: p.min_stock,
      last_updated: new Date().toISOString()
    });
  }

  const users: UserAccount[] = [
    {
      id: 'user_admin_1',
      name: 'System Administrator',
      email: 'admin@codev.io',
      username: 'admin',
      password_plain: 'admin123',
      role: 'admin',
      stores: ['store1', 'store2'],
      is_admin: true,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'user_staff_1',
      name: 'Eric Mugisha',
      email: 'eric@codev.io',
      username: 'eric',
      password_plain: 'staff123',
      role: 'staff',
      stores: ['store1'],
      is_admin: false,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'user_manager_1',
      name: 'Aline Uwase',
      email: 'aline@codev.io',
      username: 'aline',
      password_plain: 'manager123',
      role: 'manager',
      stores: ['store1', 'store2'],
      is_admin: false,
      is_active: true,
      created_at: new Date().toISOString()
    }
  ];

  const stores: Store[] = [
    {
      id: 'store1',
      name: 'Gisozi',
      code: 'store1',
      location: 'Gisozi Hardware Market, Kigali',
      phone: '+250 788 123 456',
      is_active: true
    },
    {
      id: 'store2',
      name: 'Kinyinya',
      code: 'store2',
      location: 'Kinyinya Main Road, Kigali',
      phone: '+250 788 654 321',
      is_active: true
    }
  ];

  const customers_suppliers: CustomerSupplier[] = [
    {
      id: 'cs_1',
      type: 'customer',
      name: 'Kigali Prime Builders Ltd',
      phone: '+250 788 333 444',
      email: 'info@primebuilders.rw',
      address: 'Kacyiru, Kigali',
      balance: 150000,
      notes: 'General contractor',
      created_at: new Date(Date.now() - 86400000 * 20).toISOString()
    },
    {
      id: 'cs_2',
      type: 'customer',
      name: 'Jean Paul Habimana',
      phone: '+250 783 222 111',
      email: 'jp.habimana@gmail.com',
      address: 'Gisozi Sector',
      balance: 0,
      notes: 'Private home builder',
      created_at: new Date(Date.now() - 86400000 * 15).toISOString()
    },
    {
      id: 'cs_3',
      type: 'customer',
      name: 'Horizon Construction Agency',
      phone: '+250 785 999 888',
      email: 'horizon@rwanda.rw',
      address: 'Nyarugenge, Kigali',
      balance: 420000,
      notes: 'Credit account authorized',
      created_at: new Date(Date.now() - 86400000 * 10).toISOString()
    },
    {
      id: 'cs_4',
      type: 'supplier',
      name: 'Cimerwa Cement Distributors',
      phone: '+250 788 111 222',
      email: 'sales@cimerwa.rw',
      address: 'Bugarama / Kigali Depot',
      balance: 0,
      notes: 'Primary cement supplier',
      created_at: new Date(Date.now() - 86400000 * 40).toISOString()
    },
    {
      id: 'cs_5',
      type: 'supplier',
      name: 'Roto Tanks & Pipes Rwanda',
      phone: '+250 788 444 555',
      email: 'orders@rototanks.rw',
      address: 'Special Economic Zone, Masoro',
      balance: 0,
      notes: 'Water tanks and plumbing supplies',
      created_at: new Date(Date.now() - 86400000 * 35).toISOString()
    },
    {
      id: 'cs_6',
      type: 'customer',
      name: 'Inyange Real Estate Developers',
      phone: '+250 788 777 666',
      email: 'contact@inyangerealestate.rw',
      address: 'Kibagabaga, Gasabo, Kigali',
      balance: 380000,
      notes: 'Monthly billing account for apartment construction.',
      created_at: new Date(Date.now() - 86400000 * 30).toISOString()
    },
    {
      id: 'cs_7',
      type: 'customer',
      name: 'Diane Mukamana',
      phone: '+250 788 443 322',
      email: 'diane.m@gmail.com',
      address: 'Kimironko, Kigali',
      balance: 0,
      notes: 'Residential home finishing project.',
      created_at: new Date(Date.now() - 86400000 * 15).toISOString()
    },
    {
      id: 'cs_8',
      type: 'customer',
      name: 'Cedric Niyonzima',
      phone: '+250 789 123 789',
      email: 'cniyonzima@yahoo.fr',
      address: 'Kinyinya, Gasabo, Kigali',
      balance: 125000,
      notes: 'Credit line approved up to 200,000 RWF.',
      created_at: new Date(Date.now() - 86400000 * 12).toISOString()
    },
    {
      id: 'cs_9',
      type: 'customer',
      name: 'Great Lakes Engineering Co.',
      phone: '+250 788 554 433',
      email: 'office@greatlakeseng.com',
      address: 'Gisozi Commercial District, Kigali',
      balance: 620000,
      notes: 'Corporate client with tax exemption certificate.',
      created_at: new Date(Date.now() - 86400000 * 25).toISOString()
    },
    {
      id: 'cs_10',
      type: 'customer',
      name: 'Ubumwe Hardware Retailers',
      phone: '+250 788 223 344',
      email: 'ubumwe.store@gmail.com',
      address: 'Remera, Kigali',
      balance: 0,
      notes: 'Wholesale client for cement and roofing sheets.',
      created_at: new Date(Date.now() - 86400000 * 18).toISOString()
    },
    {
      id: 'cs_11',
      type: 'supplier',
      name: 'Sadolin Paints Rwanda Ltd',
      phone: '+250 788 665 544',
      email: 'distribution@sadolin.rw',
      address: 'Gikondo Industrial Park, Kigali',
      balance: 0,
      notes: 'Paint manufacturer official supply contract.',
      created_at: new Date(Date.now() - 86400000 * 50).toISOString()
    },
    {
      id: 'cs_12',
      type: 'supplier',
      name: 'Bralirwa Steel & Metal Works',
      phone: '+250 788 889 900',
      email: 'sales@steelrwanda.rw',
      address: 'Masoro Prime SEZ, Kigali',
      balance: 0,
      notes: 'Manufacturer of steel reinforcement bars and iron sheets.',
      created_at: new Date(Date.now() - 86400000 * 60).toISOString()
    }
  ];

  const now = new Date();
  const sales: Sale[] = [
    {
      id: 'sale_1',
      sale_number: 'SAL-2026-0001',
      store_id: 'store1',
      user_id: 'user_admin_1',
      user_name: 'System Administrator',
      customer_name: 'Kigali Prime Builders Ltd',
      customer_phone: '+250 788 333 444',
      subtotal: 270000,
      discount: 0,
      total_amount: 270000,
      payment_status: 'paid',
      payment_method: 'bank',
      is_deleted: 0,
      created_at: new Date(now.getTime() - 5 * 86400000).toISOString(),
      items: [
        {
          id: 'si_1',
          sale_id: 'sale_1',
          product_id: 'p_1',
          product_name: 'Tororo Cement 32.5R 50kg',
          product_sku: 'CEM-TOR-50',
          unit: 'bags',
          quantity: 20,
          selling_price: 13500,
          buying_price: 11500,
          total_price: 270000
        }
      ]
    },
    {
      id: 'sale_2',
      sale_number: 'SAL-2026-0002',
      store_id: 'store1',
      user_id: 'user_staff_1',
      user_name: 'Eric Mugisha',
      customer_name: 'Jean Paul Habimana',
      customer_phone: '+250 783 222 111',
      subtotal: 105500,
      discount: 5500,
      total_amount: 100000,
      payment_status: 'paid',
      payment_method: 'cash',
      is_deleted: 0,
      created_at: new Date(now.getTime() - 4 * 86400000).toISOString(),
      items: [
        {
          id: 'si_2',
          sale_id: 'sale_2',
          product_id: 'p_4',
          product_name: 'Sadolin Weatherguard White 20L',
          product_sku: 'PNT-SAD-20L',
          unit: 'buckets',
          quantity: 1,
          selling_price: 82000,
          buying_price: 68000,
          total_price: 82000
        },
        {
          id: 'si_3',
          sale_id: 'sale_2',
          product_id: 'p_5',
          product_name: 'Gloss Oil Paint Brilliant White 4L',
          product_sku: 'PNT-GLS-4L',
          unit: 'tins',
          quantity: 1,
          selling_price: 23500,
          buying_price: 18000,
          total_price: 23500
        }
      ]
    },
    {
      id: 'sale_3',
      sale_number: 'SAL-2026-0003',
      store_id: 'store1',
      user_id: 'user_admin_1',
      user_name: 'System Administrator',
      customer_name: 'Horizon Construction Agency',
      customer_phone: '+250 785 999 888',
      subtotal: 420000,
      discount: 0,
      total_amount: 420000,
      payment_status: 'unpaid',
      payment_method: 'loan',
      is_deleted: 0,
      created_at: new Date(now.getTime() - 3 * 86400000).toISOString(),
      items: [
        {
          id: 'si_4',
          sale_id: 'sale_3',
          product_id: 'p_3',
          product_name: 'Iron Sheets Gauge 28 (3m Red)',
          product_sku: 'IRN-SHT-28',
          unit: 'pcs',
          quantity: 20,
          selling_price: 16500,
          buying_price: 14000,
          total_price: 330000
        },
        {
          id: 'si_5',
          sale_id: 'sale_3',
          product_id: 'p_10',
          product_name: 'Steel Concrete Nails 4-inch (Box 1kg)',
          product_sku: 'NAL-CON-4IN',
          unit: 'boxes',
          quantity: 10,
          selling_price: 3800,
          buying_price: 2800,
          total_price: 38000
        },
        {
          id: 'si_6',
          sale_id: 'sale_3',
          product_id: 'p_12',
          product_name: 'Heavy Duty Construction Wheelbarrow',
          product_sku: 'TLS-WHL-BRW',
          unit: 'pcs',
          quantity: 1,
          selling_price: 54000,
          buying_price: 42000,
          total_price: 54000
        }
      ]
    },
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
      payment_method: 'bank',
      is_deleted: 0,
      created_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
      items: [
        {
          id: 'si_7',
          sale_id: 'sale_4',
          product_id: 'p_2',
          product_name: 'Cimerwa Blue Plus 42.5N 50kg',
          product_sku: 'CEM-CIM-50',
          unit: 'bags',
          quantity: 25,
          selling_price: 14800,
          buying_price: 12500,
          total_price: 370000
        },
        {
          id: 'si_8',
          sale_id: 'sale_4',
          product_id: 'p_11',
          product_name: 'Deformed Reinforcement Bar T12 (12m)',
          product_sku: 'BAR-DEF-12M',
          unit: 'bars',
          quantity: 10,
          selling_price: 16200,
          buying_price: 13500,
          total_price: 162000
        },
        {
          id: 'si_9',
          sale_id: 'sale_4',
          product_id: 'p_10',
          product_name: 'Steel Concrete Nails 4-inch (Box 1kg)',
          product_sku: 'NAL-CON-4IN',
          unit: 'boxes',
          quantity: 15,
          selling_price: 3800,
          buying_price: 2800,
          total_price: 57000
        }
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
      payment_method: 'mobile',
      is_deleted: 0,
      created_at: new Date(now.getTime() - 86400000).toISOString(),
      items: [
        {
          id: 'si_10',
          sale_id: 'sale_5',
          product_id: 'p_20',
          product_name: 'Roto Cylindrical Water Tank 1000 Litres (Black)',
          product_sku: 'TNK-ROT-1000',
          unit: 'pcs',
          quantity: 1,
          selling_price: 175000,
          buying_price: 145000,
          total_price: 175000
        }
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
      payment_method: 'mobile',
      is_deleted: 0,
      created_at: new Date(now.getTime() - 16 * 3600000).toISOString(),
      items: [
        {
          id: 'si_11',
          sale_id: 'sale_6',
          product_id: 'p_4',
          product_name: 'Sadolin Weatherguard White 20L',
          product_sku: 'PNT-SAD-20L',
          unit: 'buckets',
          quantity: 2,
          selling_price: 82000,
          buying_price: 68000,
          total_price: 164000
        },
        {
          id: 'si_12',
          sale_id: 'sale_6',
          product_id: 'p_19',
          product_name: 'Professional Paint Roller Set 9-inch with Tray',
          product_sku: 'TLS-PNT-ROL9',
          unit: 'sets',
          quantity: 4,
          selling_price: 6500,
          buying_price: 4500,
          total_price: 26000
        },
        {
          id: 'si_13',
          sale_id: 'sale_6',
          product_id: 'p_5',
          product_name: 'Gloss Oil Paint Brilliant White 4L',
          product_sku: 'PNT-GLS-4L',
          unit: 'tins',
          quantity: 1,
          selling_price: 23500,
          buying_price: 18000,
          total_price: 23500
        }
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
      payment_method: 'bank',
      is_deleted: 0,
      created_at: new Date(now.getTime() - 8 * 3600000).toISOString(),
      items: [
        {
          id: 'si_14',
          sale_id: 'sale_7',
          product_id: 'p_26',
          product_name: 'Bosch Professional Rotary Hammer Drill 800W',
          product_sku: 'TLS-BOS-RHM',
          unit: 'pcs',
          quantity: 2,
          selling_price: 138000,
          buying_price: 110000,
          total_price: 276000
        },
        {
          id: 'si_15',
          sale_id: 'sale_7',
          product_id: 'p_27',
          product_name: 'Total Angle Grinder 115mm 750W',
          product_sku: 'TLS-TTL-AG',
          unit: 'pcs',
          quantity: 2,
          selling_price: 49000,
          buying_price: 38000,
          total_price: 98000
        },
        {
          id: 'si_16',
          sale_id: 'sale_7',
          product_id: 'p_22',
          product_name: 'Copper Electric Cable 1.5mm² 100m Roll (Red)',
          product_sku: 'ELC-CBL-1.5',
          unit: 'rolls',
          quantity: 2,
          selling_price: 41000,
          buying_price: 32000,
          total_price: 82000
        }
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
      is_deleted: 0,
      created_at: new Date(now.getTime() - 3 * 3600000).toISOString(),
      items: [
        {
          id: 'si_17',
          sale_id: 'sale_8',
          product_id: 'p_24',
          product_name: 'Heavy Duty Mortise Door Lock Set (Brass Handle)',
          product_sku: 'LCK-MRT-SET',
          unit: 'sets',
          quantity: 3,
          selling_price: 24500,
          buying_price: 18500,
          total_price: 73500
        },
        {
          id: 'si_18',
          sale_id: 'sale_8',
          product_id: 'p_25',
          product_name: 'Tri-Circle Brass Padlock 60mm with 3 Keys',
          product_sku: 'PDL-BRS-60',
          unit: 'pcs',
          quantity: 4,
          selling_price: 7500,
          buying_price: 5200,
          total_price: 30000
        }
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
      payment_method: 'bank',
      is_deleted: 0,
      created_at: new Date(now.getTime() - 3600000).toISOString(),
      items: [
        {
          id: 'si_19',
          sale_id: 'sale_9',
          product_id: 'p_1',
          product_name: 'Tororo Cement 32.5R 50kg',
          product_sku: 'CEM-TOR-50',
          unit: 'bags',
          quantity: 40,
          selling_price: 13500,
          buying_price: 11500,
          total_price: 540000
        },
        {
          id: 'si_20',
          sale_id: 'sale_9',
          product_id: 'p_3',
          product_name: 'Iron Sheets Gauge 28 (3m Red)',
          product_sku: 'IRN-SHT-28',
          unit: 'pcs',
          quantity: 15,
          selling_price: 16500,
          buying_price: 14000,
          total_price: 247500
        },
        {
          id: 'si_21',
          sale_id: 'sale_9',
          product_id: 'p_21',
          product_name: 'Brass Gate Valve 1-inch Heavy Duty',
          product_sku: 'VLV-BRS-1IN',
          unit: 'pcs',
          quantity: 4,
          selling_price: 9200,
          buying_price: 6500,
          total_price: 36800
        }
      ]
    }
  ];

  const loans: Loan[] = [
    {
      id: 'loan_1',
      store_id: 'store1',
      customer_name: 'Horizon Construction Agency',
      customer_phone: '+250 785 999 888',
      amount: 420000,
      paid_amount: 0,
      due_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      status: 'pending',
      notes: 'Project in Kagugu, payment expected this week',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: 'loan_2',
      store_id: 'store1',
      customer_name: 'Inyange Real Estate Developers',
      customer_phone: '+250 788 777 666',
      amount: 600000,
      paid_amount: 220000,
      due_date: new Date(Date.now() + 86400000 * 20).toISOString().split('T')[0],
      status: 'pending',
      notes: 'Foundation materials credit line. Installment payment scheduled bi-weekly.',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'loan_3',
      store_id: 'store2',
      customer_name: 'Cedric Niyonzima',
      customer_phone: '+250 789 123 789',
      amount: 175000,
      paid_amount: 50000,
      due_date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
      status: 'pending',
      notes: 'Water tank & plumbing fittings credit.',
      created_at: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      id: 'loan_4',
      store_id: 'store1',
      customer_name: 'Horizon Construction Agency',
      customer_phone: '+250 785 999 888',
      amount: 850000,
      paid_amount: 430000,
      due_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      status: 'pending',
      notes: 'Steel rebar and timber credit line.',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString()
    }
  ];

  const invoices: Invoice[] = [
    {
      id: 'inv_1',
      invoice_number: 'INV-2026-0001',
      type: 'invoice',
      sale_id: 'sale_1',
      store_id: 'store1',
      customer_name: 'Kigali Prime Builders Ltd',
      customer_email: 'info@primebuilders.rw',
      customer_phone: '+250 788 333 444',
      status: 'paid',
      issue_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
      due_date: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
      subtotal: 270000,
      discount: 0,
      total_amount: 270000,
      items_json: JSON.stringify([{ name: 'Tororo Cement 32.5R 50kg', sku: 'CEM-TOR-50', unit: 'bags', quantity: 20, price: 13500, total: 270000 }]),
      created_at: new Date(Date.now() - 86400000 * 5).toISOString()
    },
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
      issue_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      due_date: new Date(Date.now() + 86400000 * 12).toISOString().split('T')[0],
      subtotal: 585000,
      discount: 25000,
      total_amount: 560000,
      items_json: JSON.stringify([
        { description: 'Cimerwa Blue Plus 42.5N 50kg', quantity: 25, unit_price: 14800, total: 370000 },
        { description: 'Deformed Reinforcement Bar T12 (12m)', quantity: 10, unit_price: 16200, total: 162000 },
        { description: 'Steel Concrete Nails 4-inch (Box 1kg)', quantity: 15, unit_price: 3800, total: 57000 }
      ]),
      notes: 'Delivered to Inyange Phase 2 Construction Site.',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
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
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
      subtotal: 486000,
      discount: 16000,
      total_amount: 470000,
      items_json: JSON.stringify([
        { description: 'Bosch Professional Rotary Hammer Drill 800W', quantity: 2, unit_price: 138000, total: 276000 },
        { description: 'Total Angle Grinder 115mm 750W', quantity: 2, unit_price: 49000, total: 98000 },
        { description: 'Copper Electric Cable 1.5mm² 100m Roll (Red)', quantity: 2, unit_price: 41000, total: 82000 }
      ]),
      notes: 'Hardware & electrical equipment order.',
      created_at: new Date().toISOString()
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
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 86400000 * 20).toISOString().split('T')[0],
      subtotal: 825000,
      discount: 35000,
      total_amount: 790000,
      items_json: JSON.stringify([
        { description: 'Tororo Cement 32.5R 50kg', quantity: 40, unit_price: 13500, total: 540000 },
        { description: 'Iron Sheets Gauge 28 (3m Red)', quantity: 15, unit_price: 16500, total: 247500 },
        { description: 'Brass Gate Valve 1-inch Heavy Duty', quantity: 4, unit_price: 9200, total: 36800 }
      ]),
      notes: 'Bulk purchase invoice.',
      created_at: new Date().toISOString()
    },
    {
      id: 'inv_5',
      invoice_number: 'INV-2026-0005',
      type: 'proforma',
      sale_id: undefined,
      store_id: 'store1',
      customer_name: 'Horizon Construction Agency',
      customer_email: 'horizon@rwanda.rw',
      customer_phone: '+250 785 999 888',
      status: 'pending',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
      subtotal: 1250000,
      discount: 50000,
      total_amount: 1200000,
      items_json: JSON.stringify([
        { description: 'Tororo Cement 32.5R 50kg (Pallet 40 bags)', quantity: 2, unit_price: 530000, total: 1060000 },
        { description: 'Deformed Reinforcement Bar T12 (12m)', quantity: 10, unit_price: 16200, total: 162000 },
        { description: 'Stanley PowerLock Tape Measure 8m', quantity: 3, unit_price: 9500, total: 28500 }
      ]),
      notes: 'Proforma quotation for upcoming commercial warehouse foundations.',
      created_at: new Date().toISOString()
    }
  ];

  const expenses: Expense[] = [
    {
      id: 'exp_1',
      store_id: 'store1',
      user_id: 'user_admin_1',
      user_name: 'System Administrator',
      description: 'Truck Transport for Cement delivery from Nyabugogo',
      amount: 45000,
      category: 'Transport',
      payment_method: 'cash',
      date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      notes: 'Offloaded 200 bags',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: 'exp_2',
      store_id: 'store1',
      user_id: 'user_staff_1',
      user_name: 'Eric Mugisha',
      description: 'Store consumables, cleaning supplies, and receipts paper',
      amount: 12500,
      category: 'Maintenance',
      payment_method: 'mobile',
      date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      notes: 'MoMo payment to supplier',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'exp_3',
      store_id: 'store1',
      user_id: 'user_admin_1',
      user_name: 'System Administrator',
      description: 'Store electricity utility bill (EUCL token)',
      amount: 45000,
      category: 'Utilities',
      payment_method: 'mobile',
      date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      notes: 'Gisozi branch monthly prepaid electricity.',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'exp_4',
      store_id: 'store2',
      user_id: 'user_manager_1',
      user_name: 'Aline Uwase',
      description: 'Kinyinya branch monthly shop rent',
      amount: 250000,
      category: 'Rent',
      payment_method: 'bank',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      notes: 'Paid to property landlord for November.',
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'exp_5',
      store_id: 'store1',
      user_id: 'user_staff_1',
      user_name: 'Eric Mugisha',
      description: 'Truck fuel for client cement deliveries',
      amount: 35000,
      category: 'Transport',
      payment_method: 'cash',
      date: new Date().toISOString().split('T')[0],
      notes: '25 litres diesel at SP station.',
      created_at: new Date().toISOString()
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
      date: new Date().toISOString().split('T')[0],
      notes: 'Offloaded 200 bags of Tororo cement.',
      created_at: new Date().toISOString()
    },
    {
      id: 'exp_7',
      store_id: 'store2',
      user_id: 'user_manager_1',
      user_name: 'Aline Uwase',
      description: '4G WiFi fiber monthly subscription',
      amount: 28000,
      category: 'Utilities',
      payment_method: 'mobile',
      date: new Date().toISOString().split('T')[0],
      notes: 'CanalBox fiber internet for store POS.',
      created_at: new Date().toISOString()
    }
  ];

  const stock_adjustments: StockAdjustment[] = [
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
      created_by: 'System Administrator',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString()
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
      created_by: 'Aline Uwase',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
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
      created_by: 'Eric Mugisha',
      created_at: new Date(Date.now() - 86400000).toISOString()
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
      created_by: 'System Administrator',
      created_at: new Date().toISOString()
    }
  ];

  const product_requests: ProductRequest[] = [
    {
      id: 'req_1',
      store_id: 'store1',
      product_id: undefined,
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
      review_note: 'Multiple customers requesting Bostik tile glue for bathroom tiling.',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'req_2',
      store_id: 'store2',
      product_id: undefined,
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
      review_note: 'Approved for stock purchase.',
      created_at: new Date(Date.now() - 86400000).toISOString()
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
      review_note: 'Supplier increased cost by 500 RWF; requesting retail price adjustment.',
      created_at: new Date().toISOString()
    }
  ];

  const returns: ReturnRecord[] = [
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
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      items: [
        {
          id: 'ret_1_item_1',
          product_id: 'p_10',
          product_name: 'Steel Concrete Nails 4-inch (Box 1kg)',
          unit: 'boxes',
          quantity: 3,
          unit_price: 3800,
          total_amount: 11400
        }
      ]
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
      created_at: new Date().toISOString(),
      items: [
        {
          id: 'ret_2_item_1',
          product_id: 'p_5',
          product_name: 'Gloss Oil Paint Brilliant White 4L',
          unit: 'tins',
          quantity: 1,
          unit_price: 23500,
          total_amount: 23500
        }
      ]
    }
  ];

  return {
    users,
    stores,
    products,
    inventory,
    sales,
    invoices,
    customers_suppliers,
    loans,
    expenses,
    stock_adjustments,
    product_requests,
    returns
  };
}


class ClientDatabase {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    if (typeof window === 'undefined') return getInitialData();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load stored Codev DB', e);
    }
    const init = getInitialData();
    this.saveState(init);
    return init;
  }

  private saveState(state: DatabaseState) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save Codev DB to localStorage', e);
    }
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public updateState(updater: (state: DatabaseState) => void) {
    updater(this.state);
    this.saveState(this.state);
  }

  // Session handling
  public getSessionUser() {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  public setSessionUser(user: any) {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }
}

export const clientDb = new ClientDatabase();
