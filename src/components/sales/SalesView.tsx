import React, { useState, useEffect, useMemo } from 'react';
import {
  ReceiptText,
  Plus,
  Search,
  Trash2,
  RotateCcw,
  Printer,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  CreditCard,
  Banknote,
  Smartphone
} from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { Dialog } from '../ui/Dialog.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table.tsx';
import { Sale, Product, StoreKey, STORE_LABELS, User, formatCurrency, formatInKigali } from '../../types/index.ts';

interface SalesViewProps {
  store: StoreKey;
  user: User;
  onNavigateInvoice: (invoiceId?: string) => void;
}

export function SalesView({ store, user, onNavigateInvoice }: SalesViewProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [sales, setSales] = useState<Sale[]>([]);
  const [deletedSales, setDeletedSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Sale Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState({ name: 'Walk-in Customer', phone: '' });
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'partial'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile' | 'bank' | 'loan'>('cash');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [saleError, setSaleError] = useState<string | null>(null);

  // Line items in modal
  const [items, setItems] = useState<Array<{
    productId: string;
    name: string;
    sku: string;
    unit: string;
    quantity: number;
    sellingPrice: number;
    buyingPrice: number;
    maxQuantity: number;
  }>>([]);

  // View Sale Details Modal
  const [viewSale, setViewSale] = useState<Sale | null>(null);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales?store=${store}`);
      const data = await res.json();
      if (data.success) {
        setSales(data.data || []);
        setDeletedSales(data.deletedSales || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsAndCustomers = async () => {
    try {
      const [prodRes, custRes] = await Promise.all([
        fetch(`/api/products?store=${store}`),
        fetch('/api/customers-suppliers')
      ]);
      if (prodRes.ok) {
        const d = await prodRes.json();
        if (d.success) setProducts(d.data || []);
      }
      if (custRes.ok) {
        const d = await custRes.json();
        if (d.success) setCustomers((d.data || []).filter((c: any) => c.type === 'customer'));
      }
    } catch {}
  };

  useEffect(() => {
    fetchSales();
    fetchProductsAndCustomers();
  }, [store]);

  const handleOpenCreate = () => {
    setSaleError(null);
    setSelectedCustomer({ name: 'Walk-in Customer', phone: '' });
    setPaymentStatus('paid');
    setPaymentMethod('cash');
    setDiscount('0');
    setNotes('');

    const available = products.find(p => p.quantity > 0) || products[0];
    if (available) {
      setItems([{
        productId: available._id,
        name: available.name,
        sku: available.sku,
        unit: available.unit,
        quantity: 1,
        sellingPrice: available.sellingPrice || available.price || 0,
        buyingPrice: available.costPrice || 0,
        maxQuantity: available.quantity || 0
      }]);
    } else {
      setItems([]);
    }
    setCreateModalOpen(true);
  };

  const handleAddItemRow = () => {
    const available = products.find(p => p.quantity > 0) || products[0];
    if (!available) return;
    setItems([
      ...items,
      {
        productId: available._id,
        name: available.name,
        sku: available.sku,
        unit: available.unit,
        quantity: 1,
        sellingPrice: available.sellingPrice || available.price || 0,
        buyingPrice: available.costPrice || 0,
        maxQuantity: available.quantity || 0
      }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, productId: string) => {
    const p = products.find(prod => prod._id === productId);
    if (!p) return;
    const newItems = [...items];
    newItems[index] = {
      productId: p._id,
      name: p.name,
      sku: p.sku,
      unit: p.unit,
      quantity: 1,
      sellingPrice: p.sellingPrice || p.price || 0,
      buyingPrice: p.costPrice || 0,
      maxQuantity: p.quantity || 0
    };
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.sellingPrice) || 0), 0);
  }, [items]);

  const discountVal = Number(discount) || 0;
  const totalAmount = Math.max(0, subtotal - discountVal);

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaleError(null);

    if (items.length === 0) {
      setSaleError('Please add at least one product item.');
      return;
    }

    for (const item of items) {
      if (item.quantity > item.maxQuantity) {
        setSaleError(`Cannot sell ${item.quantity} ${item.unit} of "${item.name}". Only ${item.maxQuantity} available in ${STORE_LABELS[store]}.`);
        return;
      }
      if (item.quantity <= 0) {
        setSaleError('Quantities must be greater than zero.');
        return;
      }
    }

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store,
          customer: selectedCustomer,
          items,
          discount: discountVal,
          paymentStatus: paymentMethod === 'loan' ? 'unpaid' : paymentStatus,
          paymentMethod,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSaleError(data.error || 'Failed to record sale');
        return;
      }

      setCreateModalOpen(false);
      fetchSales();
      fetchProductsAndCustomers();
    } catch {
      setSaleError('Network error while processing sale.');
    }
  };

  const handleDeleteSale = async (sale: Sale) => {
    if (!confirm(`Are you sure you want to delete sale ${sale.saleNumber}? Its items will be returned to store inventory.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/sales/${sale._id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSales();
        fetchProductsAndCustomers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRestoreSale = async (sale: Sale) => {
    try {
      const res = await fetch(`/api/sales/${sale._id}/restore`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to restore sale');
        return;
      }
      fetchSales();
      fetchProductsAndCustomers();
    } catch (e) {
      console.error(e);
    }
  };

  const currentList = activeTab === 'active' ? sales : deletedSales;
  const filteredSales = currentList.filter(s =>
    s.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.customerPhone && s.customerPhone.includes(searchQuery))
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#14213D]">Sales & Invoicing Counter</h1>
            <span className="rounded-md bg-[#2563EB]/10 px-2 py-0.5 text-xs font-semibold text-[#2563EB]">
              {STORE_LABELS[store]}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Create sales, record payments (Cash, MoMo, Bank, Loan), and issue delivery receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleOpenCreate} className="text-xs font-semibold">
            <Plus className="size-4 mr-1" /> New Sales Invoice
          </Button>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 border-b sm:border-b-0 pb-2 sm:pb-0">
          <button
            onClick={() => setActiveTab('active')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'active'
                ? 'bg-[#14213D] text-white shadow-xs'
                : 'text-[#64748B] hover:bg-[#F1F5F9]'
            }`}
          >
            Active Sales ({sales.length})
          </button>
          <button
            onClick={() => setActiveTab('deleted')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'deleted'
                ? 'bg-[#DC2626] text-white shadow-xs'
                : 'text-[#64748B] hover:bg-[#F1F5F9]'
            }`}
          >
            Deleted Sales ({deletedSales.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sale # or customer..."
            className="w-full rounded-lg border border-[#CBD5E1] bg-transparent pl-9 pr-3 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          />
        </div>
      </div>

      {activeTab === 'deleted' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-[#F59E0B] flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>
            Deleted sales are retained for compliance records. Restoring re-applies the sale to accounting and deducts its items from inventory.
          </span>
        </div>
      )}

      {/* Sales Table */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sale #</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items Count</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-xs text-[#64748B]">
                  {activeTab === 'active' ? 'No sales recorded yet.' : 'No deleted sales in archive.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((s, idx) => (
                <TableRow key={s._id || s.id || s.saleNumber || `sale-${idx}`}>
                  <TableCell className="font-mono font-bold text-xs text-[#2563EB]">
                    {s.saleNumber}
                  </TableCell>
                  <TableCell className="text-xs text-[#64748B]">
                    {formatInKigali(s.createdAt)}
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-xs text-[#0F172A]">{s.customerName}</p>
                    {s.customerPhone && (
                      <p className="text-[11px] text-[#64748B]">{s.customerPhone}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-[#0F172A]">
                    {(s.items || []).length} item(s)
                  </TableCell>
                  <TableCell className="text-xs capitalize font-medium">
                    {s.paymentMethod}
                  </TableCell>
                  <TableCell>
                    {s.paymentStatus === 'paid' ? (
                      <Badge variant="success">Paid</Badge>
                    ) : s.paymentStatus === 'partial' ? (
                      <Badge variant="warning">Partial</Badge>
                    ) : (
                      <Badge variant="destructive">Unpaid / Loan</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-sm text-[#14213D]">
                    {formatCurrency(s.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewSale(s)}
                        className="rounded-md p-1.5 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition cursor-pointer"
                        title="View details & receipt"
                      >
                        <Eye className="size-4" />
                      </button>

                      {activeTab === 'active' ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteSale(s)}
                          className="rounded-md p-1.5 text-[#64748B] hover:bg-red-50 hover:text-[#DC2626] transition cursor-pointer"
                          title="Delete sale (restores stock)"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRestoreSale(s)}
                          className="rounded-md p-1.5 text-[#64748B] hover:bg-emerald-50 hover:text-[#16A34A] transition cursor-pointer"
                          title="Restore sale"
                        >
                          <RotateCcw className="size-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Sale Modal */}
      <Dialog
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="Record New Sales Invoice"
        description={`Sales transaction at ${STORE_LABELS[store]} counter. Stock is verified and deducted upon confirmation.`}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSaveSale} className="space-y-4">
          {saleError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-[#DC2626]">
              <AlertCircle className="size-4 shrink-0" />
              <span>{saleError}</span>
            </div>
          )}

          {/* Customer Selection */}
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 space-y-3">
            <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider">Customer Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block space-y-1 text-xs font-medium text-[#0F172A]">
                Customer Name / Business
                <input
                  type="text"
                  required
                  value={selectedCustomer.name}
                  onChange={(e) => setSelectedCustomer({ ...selectedCustomer, name: e.target.value })}
                  placeholder="e.g. Kigali Prime Builders Ltd"
                  className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                />
              </label>

              <label className="block space-y-1 text-xs font-medium text-[#0F172A]">
                Customer Phone Number
                <input
                  type="text"
                  value={selectedCustomer.phone}
                  onChange={(e) => setSelectedCustomer({ ...selectedCustomer, phone: e.target.value })}
                  placeholder="+250 78..."
                  className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                />
              </label>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider">Product Items</h4>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
              >
                <Plus className="size-3.5" /> Add Product Row
              </button>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] overflow-x-auto bg-white">
              <table className="w-full min-w-[550px] text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="p-2.5 text-left font-semibold text-[#0F172A]">Product</th>
                    <th className="p-2.5 text-left font-semibold text-[#64748B]">Available</th>
                    <th className="p-2.5 text-left font-semibold w-24 text-[#0F172A]">Qty</th>
                    <th className="p-2.5 text-left font-semibold w-32 text-[#0F172A]">Unit Price (Rwf)</th>
                    <th className="p-2.5 text-right font-semibold text-[#0F172A]">Subtotal</th>
                    <th className="p-2.5 text-right font-semibold w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#F8FAFC]">
                      <td className="p-2.5">
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          className="w-full rounded-md border border-[#CBD5E1] bg-white px-2 py-1 text-xs outline-none"
                        >
                          {products.map(p => (
                            <option key={p._id} value={p._id}>
                              {p.name} ({p.quantity} {p.unit} in stock)
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2.5 text-[#64748B] font-mono">
                        {item.maxQuantity} {item.unit}
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          min="1"
                          max={item.maxQuantity}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, Number(e.target.value) || 1))}
                          className="w-20 rounded-md border border-[#CBD5E1] bg-white px-2 py-1 text-xs outline-none font-mono"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          value={item.sellingPrice}
                          onChange={(e) => handleItemChange(idx, 'sellingPrice', Number(e.target.value) || 0)}
                          className="w-28 rounded-md border border-[#CBD5E1] bg-white px-2 py-1 text-xs outline-none font-mono"
                        />
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-[#14213D]">
                        {formatCurrency(item.quantity * item.sellingPrice)}
                      </td>
                      <td className="p-2.5 text-right">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="text-[#DC2626] hover:text-red-700 p-1 cursor-pointer"
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment & Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
            <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
              Payment Method
              <select
                value={paymentMethod}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setPaymentMethod(val);
                  if (val === 'loan') setPaymentStatus('unpaid');
                }}
                className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs outline-none"
              >
                <option value="cash">Cash Counter</option>
                <option value="mobile">MTN / Airtel Mobile Money</option>
                <option value="bank">Bank Transfer / Card</option>
                <option value="loan">Store Credit / Loan (Unpaid)</option>
              </select>
            </label>

            <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
              Payment Status
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                disabled={paymentMethod === 'loan'}
                className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs outline-none"
              >
                <option value="paid">Fully Paid</option>
                <option value="partial">Partial Payment</option>
                <option value="unpaid">Unpaid (Credit)</option>
              </select>
            </label>

            <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
              Discount Amount (Rwf)
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs outline-none font-mono"
              />
            </label>
          </div>

          {/* Total Summary Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[#E2E8F0] pt-3">
            <div className="text-xs text-[#64748B]">
              Subtotal: <span className="font-mono text-[#0F172A]">{formatCurrency(subtotal)}</span> | Discount: <span className="font-mono text-[#0F172A]">{formatCurrency(discountVal)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[#0F172A]">Grand Total:</span>
              <span className="text-xl font-bold font-mono text-[#14213D]">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Confirm & Issue Invoice
            </Button>
          </div>
        </form>
      </Dialog>

      {/* View Sale Details Modal */}
      {viewSale && (
        <Dialog
          open={!!viewSale}
          onOpenChange={() => setViewSale(null)}
          title={`Sale Receipt: ${viewSale.saleNumber}`}
          description={`Recorded on ${formatInKigali(viewSale.createdAt)}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-[#E2E8F0] p-3 bg-[#F8FAFC] text-xs grid grid-cols-2 gap-2">
              <div>
                <p className="text-[#64748B]">Customer</p>
                <p className="font-bold text-[#0F172A]">{viewSale.customerName}</p>
                {viewSale.customerPhone && <p className="text-[#64748B]">{viewSale.customerPhone}</p>}
              </div>
              <div className="text-right">
                <p className="text-[#64748B]">Branch</p>
                <p className="font-bold text-[#0F172A]">{STORE_LABELS[store]}</p>
                <p className="capitalize text-[#64748B]">{viewSale.paymentMethod} • {viewSale.paymentStatus}</p>
              </div>
            </div>

            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="p-2 text-left text-[#0F172A]">Item</th>
                    <th className="p-2 text-center text-[#0F172A]">Qty</th>
                    <th className="p-2 text-right text-[#0F172A]">Price</th>
                    <th className="p-2 text-right text-[#0F172A]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {(viewSale.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium text-[#0F172A]">{it.name}</td>
                      <td className="p-2 text-center text-[#64748B]">{it.quantity} {it.unit}</td>
                      <td className="p-2 text-right font-mono text-[#64748B]">{formatCurrency(it.sellingPrice)}</td>
                      <td className="p-2 text-right font-bold font-mono text-[#14213D]">{formatCurrency(it.quantity * it.sellingPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center text-xs pt-2 border-t border-[#E2E8F0]">
              <span className="text-[#64748B]">Total Paid:</span>
              <span className="font-bold font-mono text-lg text-[#14213D]">{formatCurrency(viewSale.totalAmount)}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="size-3.5 mr-1" /> Print Receipt
              </Button>
              <Button size="sm" onClick={() => setViewSale(null)}>
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
