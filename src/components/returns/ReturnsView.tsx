import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, Search, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { Dialog } from '../ui/Dialog.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table.tsx';
import { ReturnRecord, Product, StoreKey, STORE_LABELS, User, formatCurrency, formatInKigali } from '../../types/index.ts';

export function ReturnsView({ store, user }: { store: StoreKey; user: User }) {
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRecord | null>(null);

  // Return form
  const [customerName, setCustomerName] = useState('');
  const [saleNumber, setSaleNumber] = useState('');
  const [reason, setReason] = useState('Damaged packaging / customer order modification');
  const [items, setItems] = useState<Array<{ productId: string; quantity: number; unitPrice: number }>>([]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const [retRes, prodRes] = await Promise.all([
        fetch(`/api/returns?store=${store}`),
        fetch(`/api/products?store=${store}`)
      ]);
      if (retRes.ok) {
        const d = await retRes.json();
        if (d.success) setReturns(d.data || []);
      }
      if (prodRes.ok) {
        const d = await prodRes.json();
        if (d.success) setProducts(d.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [store]);

  const handleOpenModal = () => {
    setCustomerName('');
    setSaleNumber('');
    setReason('Surplus items returned after construction');
    const firstProd = products[0];
    if (firstProd) {
      setItems([{ productId: firstProd._id, quantity: 1, unitPrice: firstProd.sellingPrice || firstProd.price || 0 }]);
    } else {
      setItems([]);
    }
    setModalOpen(true);
  };

  const handleAddItem = () => {
    const firstProd = products[0];
    if (!firstProd) return;
    setItems([...items, { productId: firstProd._id, quantity: 1, unitPrice: firstProd.sellingPrice || firstProd.price || 0 }]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleProductChange = (idx: number, pId: string) => {
    const p = products.find(prod => prod._id === pId);
    if (!p) return;
    const updated = [...items];
    updated[idx] = { productId: p._id, quantity: 1, unitPrice: p.sellingPrice || p.price || 0 };
    setItems(updated);
  };

  const handleItemChange = (idx: number, field: string, val: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: val };
    setItems(updated);
  };

  const totalRefund = items.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const payloadItems = items.map(it => {
      const p = products.find(prod => prod._id === it.productId);
      return {
        productId: it.productId,
        name: p?.name || 'Product',
        unit: p?.unit || 'pcs',
        quantity: it.quantity,
        unitPrice: it.unitPrice
      };
    });

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store,
          customerName: customerName || 'Walk-in Customer',
          reason,
          items: payloadItems
        })
      });

      if (res.ok) {
        setModalOpen(false);
        fetchReturns();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-border/80 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--brand-navy)]">Returns & Restocking</h1>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
              {STORE_LABELS[store]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Accept product returns, refund customers, and automatically return items to physical store stock.
          </p>
        </div>

        <Button onClick={handleOpenModal} className="text-xs font-semibold">
          <Plus className="size-4 mr-1" /> Process New Return
        </Button>
      </div>

      <div className="rounded-2xl border border-border/80 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Return #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Processed By</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Refund Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-xs text-muted-foreground">
                  No returns recorded yet in this branch.
                </TableCell>
              </TableRow>
            ) : (
              returns.map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="font-mono font-bold text-xs text-primary">
                    {r.returnNumber}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatInKigali(r.createdAt, { year: 'numeric', month: 'short', day: '2-digit' })}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-foreground">
                    {r.customerName}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {r.reason}
                  </TableCell>
                  <TableCell className="text-xs">{r.createdByName || 'Staff'}</TableCell>
                  <TableCell className="text-xs">{(r.items || []).length} item(s)</TableCell>
                  <TableCell className="text-right font-mono font-bold text-xs text-red-600">
                    -{formatCurrency(r.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReturn(r)}
                      className="text-xs"
                    >
                      <Eye className="size-3.5 mr-1" /> View Items
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Return Details Modal */}
      {selectedReturn && (
        <Dialog
          open={!!selectedReturn}
          onOpenChange={() => setSelectedReturn(null)}
          title={`Return Document: ${selectedReturn.returnNumber}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
              <p><span className="text-muted-foreground">Customer:</span> <span className="font-semibold">{selectedReturn.customerName}</span></p>
              <p><span className="text-muted-foreground">Reason:</span> {selectedReturn.reason}</p>
              <p><span className="text-muted-foreground">Branch:</span> {STORE_LABELS[store]}</p>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-center">Returned Qty</th>
                    <th className="p-2 text-right">Refund Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(selectedReturn.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium">{it.name}</td>
                      <td className="p-2 text-center font-mono">{it.quantity} {it.unit}</td>
                      <td className="p-2 text-right font-mono font-bold text-red-700">{formatCurrency(it.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border font-bold">
              <span>Total Refund Disbursed:</span>
              <span className="font-mono text-base text-red-700">{formatCurrency(selectedReturn.totalAmount)}</span>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setSelectedReturn(null)}>Close</Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Process Return Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Process Return & Restock Inventory"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmitReturn} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-xs font-semibold">
              Customer Name
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
                className="w-full rounded-lg border border-input px-3 py-1.5 text-xs outline-none"
              />
            </label>

            <label className="block space-y-1 text-xs font-semibold">
              Original Sale / Invoice # (Optional)
              <input
                type="text"
                value={saleNumber}
                onChange={(e) => setSaleNumber(e.target.value)}
                placeholder="SAL-2026-..."
                className="w-full rounded-lg border border-input px-3 py-1.5 text-xs outline-none"
              />
            </label>
          </div>

          <label className="block space-y-1 text-xs font-semibold">
            Reason for Return
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-input px-3 py-1.5 text-xs outline-none"
            />
          </label>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-[var(--brand-navy)]">Items to Restock</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    value={it.productId}
                    onChange={(e) => handleProductChange(idx, e.target.value)}
                    className="col-span-6 rounded-md border border-input px-2 py-1 text-xs outline-none"
                  >
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={it.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value) || 1)}
                    placeholder="Qty"
                    className="col-span-2 rounded-md border border-input px-2 py-1 text-xs outline-none"
                  />
                  <input
                    type="number"
                    value={it.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value) || 0)}
                    placeholder="Price"
                    className="col-span-3 rounded-md border border-input px-2 py-1 text-xs outline-none"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="col-span-1 text-red-500 font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-xs font-semibold">Total Refund: <span className="font-mono text-red-700 font-bold">{formatCurrency(totalRefund)}</span></span>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit">Complete Restock & Refund</Button>
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
