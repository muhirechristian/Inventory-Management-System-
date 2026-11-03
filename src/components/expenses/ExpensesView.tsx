import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Search, Calendar, Tag, DollarSign } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { Dialog } from '../ui/Dialog.tsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table.tsx';
import { Expense, StoreKey, STORE_LABELS, User, formatCurrency, formatInKigali } from '../../types/index.ts';

export function ExpensesView({ store, user }: { store: StoreKey; user: User }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Transport',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const categories = [
    'All',
    'Transport',
    'Salaries & Labor',
    'Rent & Storage',
    'Utilities (Electricity/Water)',
    'Packaging & Receipt Rolls',
    'Maintenance & Repairs',
    'Other'
  ];

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/expenses?store=${store}`);
      const data = await res.json();
      if (data.success) {
        setExpenses(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [store]);

  const handleOpenAdd = () => {
    setFormData({
      description: '',
      amount: '',
      category: 'Transport',
      paymentMethod: 'cash',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store,
          ...formData,
          amount: Number(formData.amount)
        })
      });
      if (res.ok) {
        setModalOpen(false);
        fetchExpenses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalExpense = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const filteredExpenses = expenses.filter(exp => {
    const matchCat = selectedCategory === 'All' || exp.category === selectedCategory;
    const matchSearch =
      exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-border/80 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--brand-navy)]">Operating Expenses</h1>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
              {STORE_LABELS[store]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Track daily branch operations costs, logistics transport, utilities and maintenance disbursements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-right">
            <p className="text-[10px] uppercase font-bold tracking-wider text-rose-800">Total Expenses</p>
            <p className="text-lg font-bold font-mono text-rose-950">{formatCurrency(totalExpense)}</p>
          </div>
          <Button onClick={handleOpenAdd} className="text-xs font-semibold">
            <Plus className="size-4 mr-1" /> Record Expense
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses by description..."
              className="w-full rounded-lg border border-input bg-transparent pl-9 pr-3 py-1.5 text-xs outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-border/60 pt-2 pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-rose-100 text-rose-900 font-bold border border-rose-200'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-2xl border border-border/80 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Expense Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Recorded By</TableHead>
              <TableHead className="text-right">Amount (Rwf)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                  No expenses recorded in this category.
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((exp, idx) => (
                <TableRow key={exp._id || exp.id || `exp-${idx}`}>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {exp.date}
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-xs text-foreground">{exp.description}</p>
                    {exp.notes && <p className="text-[11px] text-muted-foreground">{exp.notes}</p>}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="rounded bg-muted px-2 py-0.5 font-medium">{exp.category}</span>
                  </TableCell>
                  <TableCell className="text-xs capitalize font-medium">
                    {exp.paymentMethod}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {exp.recordedBy || 'Staff'}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-xs text-rose-700">
                    -{formatCurrency(exp.amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Record Expense Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Record Operating Expense"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveExpense} className="space-y-3.5">
          <label className="block space-y-1 text-xs font-semibold">
            Expense Description
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Fuel for cement transport truck, Receipt printer rolls"
              className="w-full rounded-lg border border-input px-3 py-1.5 text-xs outline-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-xs font-semibold">
              Category
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-input bg-white px-3 py-1.5 text-xs outline-none"
              >
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-1 text-xs font-semibold">
              Payment Method
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full rounded-lg border border-input bg-white px-3 py-1.5 text-xs outline-none"
              >
                <option value="cash">Cash Register</option>
                <option value="mobile">MTN / Airtel Mobile Money</option>
                <option value="bank">Bank Account</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-xs font-semibold">
              Amount (Rwf)
              <input
                type="number"
                min="1"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full rounded-lg border border-input px-3 py-1.5 text-xs outline-none font-mono"
              />
            </label>

            <label className="block space-y-1 text-xs font-semibold">
              Date
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-lg border border-input bg-white px-3 py-1.5 text-xs outline-none"
              />
            </label>
          </div>

          <label className="block space-y-1 text-xs font-semibold">
            Internal Notes (Optional)
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-input px-3 py-1.5 text-xs outline-none"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Expense</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
