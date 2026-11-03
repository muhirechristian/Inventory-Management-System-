import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Download,
  Eye,
  CheckCircle2,
  Building,
  Calendar,
  Send,
  Trash2
} from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { Dialog } from '../ui/Dialog.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table.tsx';
import { CodevLogo } from '../common/CodevLogo.tsx';
import { Invoice, StoreKey, STORE_LABELS, User, formatCurrency, formatInKigali } from '../../types/index.ts';

interface InvoicesViewProps {
  store: StoreKey;
  user: User;
}

export function InvoicesView({ store, user }: InvoicesViewProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'invoice' | 'dn' | 'proforma'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // New Invoice Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newType, setNewType] = useState<'invoice' | 'dn' | 'proforma'>('invoice');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ name: string; quantity: number; unit: string; price: number }>>([
    { name: 'Cimerwa Blue Plus 42.5N 50kg', quantity: 10, unit: 'bags', price: 14800 }
  ]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices?store=${store}`);
      const data = await res.json();
      if (data.success) {
        setInvoices(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [store]);

  const handleAddItem = () => {
    setItems([...items, { name: '', quantity: 1, unit: 'pcs', price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.price) || 0), 0);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) return;

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store,
          type: newType,
          customerName,
          customerEmail,
          customerPhone,
          items,
          subtotal,
          totalAmount: subtotal,
          dueDate,
          notes
        })
      });

      if (res.ok) {
        setCreateModalOpen(false);
        fetchInvoices();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesType = filterType === 'all' || inv.type === filterType;
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#14213D]">Invoices & Delivery Notes</h1>
            <span className="rounded-md bg-[#2563EB]/10 px-2 py-0.5 text-xs font-semibold text-[#2563EB]">
              {STORE_LABELS[store]}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Official commercial invoices, delivery notes (DN), and proforma quotation documents.
          </p>
        </div>

        <Button onClick={() => setCreateModalOpen(true)} className="text-xs font-semibold">
          <Plus className="size-4 mr-1" /> Create Document
        </Button>
      </div>

      {/* Tabs and search */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              filterType === 'all' ? 'bg-[#14213D] text-white' : 'text-[#64748B] hover:bg-[#F1F5F9]'
            }`}
          >
            All Documents ({invoices.length})
          </button>
          <button
            onClick={() => setFilterType('invoice')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              filterType === 'invoice' ? 'bg-[#14213D] text-white' : 'text-[#64748B] hover:bg-[#F1F5F9]'
            }`}
          >
            Commercial Invoices
          </button>
          <button
            onClick={() => setFilterType('dn')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              filterType === 'dn' ? 'bg-[#14213D] text-white' : 'text-[#64748B] hover:bg-[#F1F5F9]'
            }`}
          >
            Delivery Notes (DN)
          </button>
          <button
            onClick={() => setFilterType('proforma')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              filterType === 'proforma' ? 'bg-[#14213D] text-white' : 'text-[#64748B] hover:bg-[#F1F5F9]'
            }`}
          >
            Proformas
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search document # or client..."
            className="w-full rounded-lg border border-[#CBD5E1] bg-transparent pl-9 pr-3 py-1.5 text-xs outline-none"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doc Number</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Customer / Client</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-xs text-[#64748B]">
                  No documents found.
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((inv, idx) => (
                <TableRow key={inv._id || inv.id || inv.invoiceNumber || `inv-${idx}`}>
                  <TableCell className="font-mono font-bold text-xs text-[#2563EB]">
                    {inv.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    {inv.type === 'dn' ? (
                      <Badge variant="teal">Delivery Note</Badge>
                    ) : inv.type === 'proforma' ? (
                      <Badge variant="warning">Proforma</Badge>
                    ) : (
                      <Badge variant="info">Invoice</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-xs text-[#0F172A]">{inv.customerName}</p>
                    {inv.customerPhone && <p className="text-[11px] text-[#64748B]">{inv.customerPhone}</p>}
                  </TableCell>
                  <TableCell className="text-xs text-[#64748B]">
                    {inv.issueDate || formatInKigali(inv.createdAt, { year: 'numeric', month: 'short', day: '2-digit' })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">Completed</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-xs text-[#14213D]">
                    {formatCurrency(inv.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedInvoice(inv)}
                      className="text-xs"
                    >
                      <Eye className="size-3.5 mr-1" /> View & Print
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Printable Invoice Modal */}
      {selectedInvoice && (
        <Dialog
          open={!!selectedInvoice}
          onOpenChange={() => setSelectedInvoice(null)}
          title={`Document Preview: ${selectedInvoice.invoiceNumber}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6 p-2 printable-area">
            {/* Branded Letterhead: Codev */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 border-b-2 border-[#14213D] pb-4">
              <div className="flex items-center gap-3">
                <CodevLogo size="lg" />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#14213D]">CODEV ENTERPRISE SOLUTIONS</h2>
                  <p className="text-xs text-[#64748B]">Business & Inventory Management Platform</p>
                  <p className="text-xs text-[#64748B]">{STORE_LABELS[store]} Branch Operations</p>
                  <p className="text-xs text-[#64748B]">TIN: 104829103 | Tel: +250 788 123 456</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <h3 className="text-base sm:text-lg font-black uppercase text-[#2563EB] tracking-wider">
                  {selectedInvoice.type === 'dn' ? 'DELIVERY NOTE' : selectedInvoice.type === 'proforma' ? 'PROFORMA INVOICE' : 'COMMERCIAL INVOICE'}
                </h3>
                <p className="font-mono text-sm font-bold text-[#14213D] mt-1">{selectedInvoice.invoiceNumber}</p>
                <p className="text-xs text-[#64748B] mt-0.5">Date: {selectedInvoice.issueDate}</p>
              </div>
            </div>

            {/* Bill To Info */}
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
              <div>
                <p className="font-bold text-[#64748B] uppercase text-[10px] tracking-wider mb-1">Customer / Consignee</p>
                <p className="font-bold text-sm sm:text-base text-[#0F172A]">{selectedInvoice.customerName}</p>
                {selectedInvoice.customerPhone && <p className="text-[#64748B]">Tel: {selectedInvoice.customerPhone}</p>}
                {selectedInvoice.customerEmail && <p className="text-[#64748B]">Email: {selectedInvoice.customerEmail}</p>}
              </div>
              <div className="text-left sm:text-right">
                <p className="font-bold text-[#64748B] uppercase text-[10px] tracking-wider mb-1">Issuing Details</p>
                <p className="text-[#0F172A]"><span className="text-[#64748B]">Branch:</span> {STORE_LABELS[store]}</p>
                <p className="text-[#0F172A]"><span className="text-[#64748B]">System:</span> Verified via Codev</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="rounded-xl border border-[#E2E8F0] overflow-x-auto">
              <table className="w-full min-w-[420px] text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="p-3 text-left font-bold text-[#0F172A]">Item Description</th>
                    <th className="p-3 text-center font-bold text-[#0F172A]">Quantity</th>
                    <th className="p-3 text-right font-bold text-[#0F172A]">Unit Price</th>
                    <th className="p-3 text-right font-bold text-[#0F172A]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {(selectedInvoice.items || []).map((it: any, idx: number) => {
                    const price = it.sellingPrice || it.price || 0;
                    const total = it.total || (it.quantity * price);
                    return (
                      <tr key={idx}>
                        <td className="p-3 font-medium text-[#0F172A]">{it.name}</td>
                        <td className="p-3 text-center font-mono text-[#64748B]">{it.quantity} {it.unit || 'pcs'}</td>
                        <td className="p-3 text-right font-mono text-[#64748B]">{formatCurrency(price)}</td>
                        <td className="p-3 text-right font-mono font-bold text-[#14213D]">{formatCurrency(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Block */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-[#64748B]">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-[#E2E8F0] pt-2 text-sm font-bold text-[#14213D]">
                  <span>Total Payable:</span>
                  <span className="font-mono text-base">{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Signature row */}
            <div className="pt-8 border-t border-dashed border-[#E2E8F0] grid grid-cols-2 gap-8 text-xs text-[#64748B]">
              <div>
                <div className="border-b border-[#E2E8F0] pb-10">Authorized Signature & Stamp:</div>
                <p className="mt-1 font-semibold text-[#0F172A]">Codev Management</p>
              </div>
              <div className="text-right">
                <div className="border-b border-[#E2E8F0] pb-10">Client Receipt & Confirmation:</div>
                <p className="mt-1 font-semibold text-[#0F172A]">Goods Received in Good Order</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 no-print">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="size-3.5 mr-1" /> Print Document / Save PDF
              </Button>
              <Button size="sm" onClick={() => setSelectedInvoice(null)}>
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Create New Document Modal */}
      <Dialog
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="Generate New Invoice / Delivery Note"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
              Document Type
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs outline-none"
              >
                <option value="invoice">Commercial Tax Invoice</option>
                <option value="dn">Delivery Note (DN)</option>
                <option value="proforma">Proforma Quotation</option>
              </select>
            </label>

            <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
              Due / Delivery Date
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
              Customer / Company Name
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Kigali Construction Consortium"
                className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs outline-none"
              />
            </label>

            <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
              Customer Phone
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+250 78..."
                className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs outline-none"
              />
            </label>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-[#14213D]">Items</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    required
                    placeholder="Description"
                    value={it.name}
                    onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                    className="col-span-6 rounded-md border border-[#CBD5E1] px-2 py-1 text-xs outline-none"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={it.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value) || 1)}
                    className="col-span-2 rounded-md border border-[#CBD5E1] px-2 py-1 text-xs outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={it.price}
                    onChange={(e) => handleItemChange(idx, 'price', Number(e.target.value) || 0)}
                    className="col-span-3 rounded-md border border-[#CBD5E1] px-2 py-1 text-xs outline-none"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="col-span-1 text-[#DC2626] hover:text-red-700 text-sm font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-[#E2E8F0]">
            <span className="text-xs font-semibold text-[#0F172A]">Total: <span className="font-mono text-[#2563EB] font-bold">{formatCurrency(subtotal)}</span></span>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button type="submit">Issue Document</Button>
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
