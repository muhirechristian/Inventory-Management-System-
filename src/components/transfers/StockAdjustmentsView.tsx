import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Plus, Search, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { Dialog } from '../ui/Dialog.tsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table.tsx';
import { StockAdjustment, Product, StoreKey, STORE_LABELS, User, formatInKigali } from '../../types/index.ts';

export function StockAdjustmentsView({ store, user }: { store: StoreKey; user: User }) {
  const [transfers, setTransfers] = useState<StockAdjustment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fromStore, setFromStore] = useState<StoreKey>('store1');
  const [toStore, setToStore] = useState<StoreKey>('store2');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [reason, setReason] = useState('Stock balancing between branches');

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const [transRes, prodRes] = await Promise.all([
        fetch('/api/stock-adjustments'),
        fetch(`/api/products?store=${fromStore}`)
      ]);
      if (transRes.ok) {
        const d = await transRes.json();
        if (d.success) setTransfers(d.data || []);
      }
      if (prodRes.ok) {
        const d = await prodRes.json();
        if (d.success) {
          setProducts(d.data || []);
          if (d.data?.length > 0 && !selectedProductId) {
            setSelectedProductId(d.data[0]._id);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [fromStore]);

  const selectedProduct = products.find(p => p._id === selectedProductId) || products[0];

  const handleOpenModal = () => {
    setError(null);
    setFromStore('store1');
    setToStore('store2');
    setQuantity('10');
    setReason('Routine replenishment of stock for high-demand items');
    setModalOpen(true);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (fromStore === toStore) {
      setError('Source and destination stores must be different.');
      return;
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    if (!selectedProduct) {
      setError('Please select a product.');
      return;
    }

    if (qty > selectedProduct.quantity) {
      setError(`Cannot transfer ${qty} ${selectedProduct.unit}. Only ${selectedProduct.quantity} available in ${STORE_LABELS[fromStore]}.`);
      return;
    }

    try {
      const res = await fetch('/api/stock-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct._id,
          fromStore,
          toStore,
          quantity: qty,
          unit: selectedProduct.unit,
          reason
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Transfer failed');
        return;
      }
      setModalOpen(false);
      fetchTransfers();
    } catch {
      setError('Network connection error.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-border/80 bg-white p-5 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--brand-navy)]">Branch Stock Transfers & Adjustments</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Reallocate merchandise between Gisozi and Kinyinya stores with automated balance synchronization.
          </p>
        </div>

        <Button onClick={handleOpenModal} className="text-xs font-semibold">
          <ArrowLeftRight className="size-4 mr-1" /> New Store Transfer
        </Button>
      </div>

      {/* Info card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/80 bg-white p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Store 1 Headquarters</p>
            <h3 className="text-base font-bold text-[var(--brand-navy)]">Gisozi Hardware Market</h3>
            <p className="text-[11px] text-muted-foreground">Primary wholesale depot</p>
          </div>
          <Building2 className="size-8 text-primary/40" />
        </div>

        <div className="rounded-xl border border-border/80 bg-white p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Store 2 Retail Branch</p>
            <h3 className="text-base font-bold text-[var(--brand-navy)]">Kinyinya Main Counter</h3>
            <p className="text-[11px] text-muted-foreground">Retail & customer counter</p>
          </div>
          <Building2 className="size-8 text-[var(--brand-teal)]/40" />
        </div>
      </div>

      {/* Transfers History Table */}
      <div className="rounded-2xl border border-border/80 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border/80">
          <h3 className="font-bold text-sm text-[var(--brand-navy)]">Stock Movement Audit Log</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transfer #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>From Branch</TableHead>
              <TableHead>To Branch</TableHead>
              <TableHead className="text-center">Transferred Quantity</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Authorized By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-xs text-muted-foreground">
                  No inter-store transfers recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              transfers.map((t) => (
                <TableRow key={t._id}>
                  <TableCell className="font-mono font-bold text-xs text-primary">
                    {t.adjustmentNumber}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatInKigali(t.createdAt)}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-foreground">
                    {t.productName}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-amber-800">
                    {STORE_LABELS[t.fromStore as StoreKey] || t.fromStore}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-emerald-800">
                    {STORE_LABELS[t.toStore as StoreKey] || t.toStore}
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold text-xs text-foreground">
                    {t.quantity} {t.unit}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {t.reason || 'Rebalance'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t.createdBy || 'Admin'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Transfer Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Transfer Hardware Stock Between Stores"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleTransfer} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-xs font-semibold">
              Source Store (From)
              <select
                value={fromStore}
                onChange={(e) => {
                  const val = e.target.value as StoreKey;
                  setFromStore(val);
                  if (val === toStore) {
                    setToStore(val === 'store1' ? 'store2' : 'store1');
                  }
                }}
                className="w-full rounded-lg border border-input bg-white px-3 py-1.5 text-xs outline-none"
              >
                <option value="store1">Store 1 (Gisozi)</option>
                <option value="store2">Store 2 (Kinyinya)</option>
              </select>
            </label>

            <label className="block space-y-1 text-xs font-semibold">
              Destination Store (To)
              <select
                value={toStore}
                onChange={(e) => setToStore(e.target.value as StoreKey)}
                className="w-full rounded-lg border border-input bg-white px-3 py-1.5 text-xs outline-none"
              >
                <option value="store1">Store 1 (Gisozi)</option>
                <option value="store2">Store 2 (Kinyinya)</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1 text-xs font-semibold">
            Select Product
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded-lg border border-input bg-white px-3 py-1.5 text-xs outline-none"
            >
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} (Available: {p.quantity} {p.unit})
                </option>
              ))}
            </select>
          </label>

          {selectedProduct && (
            <div className="rounded-lg bg-muted/40 p-3 text-xs flex justify-between items-center">
              <span>Current Stock in {STORE_LABELS[fromStore]}:</span>
              <span className="font-bold font-mono text-primary">{selectedProduct.quantity} {selectedProduct.unit}</span>
            </div>
          )}

          <label className="block space-y-1 text-xs font-semibold">
            Transfer Quantity ({selectedProduct?.unit || 'units'})
            <input
              type="number"
              min="1"
              max={selectedProduct?.quantity || 100}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-input px-3 py-1.5 text-xs outline-none font-mono"
            />
          </label>

          <label className="block space-y-1 text-xs font-semibold">
            Transfer Justification / Reason
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-input px-3 py-1.5 text-xs outline-none"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Execute Transfer</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
