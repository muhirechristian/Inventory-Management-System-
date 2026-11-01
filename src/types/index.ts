export const STORE_KEYS = ['store1', 'store2'] as const;
export type StoreKey = typeof STORE_KEYS[number];

export const STORE_LABELS: Record<StoreKey, string> = {
  store1: 'Gisozi',
  store2: 'Kinyinya'
};

export type UserRole = 'admin' | 'manager' | 'staff' | 'inventory_manager' | 'finance';

export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  stores: string[];
  isAdmin: boolean;
  isActive: boolean;
  activeStore?: string;
  createdAt?: string;
}

export interface PackUnit {
  name: string;
  factor: number;
  price: number;
}

export interface Product {
  _id: string;
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  price: number;
  sellingPrice: number;
  minStock: number;
  quantity: number;
  threshold: number;
  packUnits: PackUnit[];
  imageUrl?: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  sku?: string;
  unit: string;
  quantity: number;
  sellingPrice: number;
  buyingPrice?: number;
  totalPrice?: number;
}

export interface Sale {
  _id: string;
  id: string;
  saleNumber: string;
  storeId: string;
  createdByName?: string;
  customerName: string;
  customerPhone?: string;
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  paymentMethod: 'cash' | 'bank' | 'mobile' | 'loan';
  isDeleted: boolean;
  createdAt: string;
  items: SaleItem[];
}

export interface Invoice {
  _id: string;
  id: string;
  invoiceNumber: string;
  type: 'invoice' | 'dn' | 'proforma';
  saleId?: string;
  storeId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  status: string;
  issueDate: string;
  dueDate?: string;
  subtotal: number;
  discount: number;
  totalAmount: number;
  items: SaleItem[];
  notes?: string;
  createdAt: string;
}

export interface CustomerSupplier {
  _id: string;
  id: string;
  type: 'customer' | 'supplier';
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
  notes?: string;
  createdAt?: string;
}

export interface Loan {
  _id: string;
  id: string;
  storeId: string;
  customerName: string;
  customerPhone?: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: 'pending' | 'overdue' | 'paid' | 'partial';
  notes?: string;
  createdAt: string;
}

export interface ReturnRecord {
  _id: string;
  id: string;
  returnNumber: string;
  saleId?: string;
  createdByName?: string;
  customerName: string;
  reason?: string;
  totalAmount: number;
  returnStatus: string;
  createdAt: string;
  items: Array<{
    productId: string;
    name: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
  }>;
}

export interface Expense {
  _id: string;
  id: string;
  description: string;
  amount: number;
  category: string;
  paymentMethod: string;
  date: string;
  notes?: string;
  recordedBy?: string;
}

export interface StockAdjustment {
  _id: string;
  id: string;
  adjustmentNumber: string;
  productId: string;
  productName: string;
  fromStore: string;
  toStore: string;
  quantity: number;
  unit: string;
  reason?: string;
  createdBy?: string;
  createdAt: string;
}

export interface LoginLog {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: string;
  loginAt: string;
  logoutAt?: string;
}

export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('en-RW', {
    maximumFractionDigits: 0
  }).format(amount || 0);
  return `${formatted} Rwf`;
}

export function formatInKigali(dateString?: string | Date, options?: Intl.DateTimeFormatOptions): string {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Kigali',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }).format(date);
  } catch {
    return String(dateString);
  }
}
