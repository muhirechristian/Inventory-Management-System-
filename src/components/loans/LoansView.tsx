import React, { useState, useEffect } from 'react';
import { Clock, Plus, Search, CheckCircle2, AlertTriangle, DollarSign, Calendar } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { Dialog } from '../ui/Dialog.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table.tsx';
import { Loan, StoreKey, STORE_LABELS, User, formatCurrency, formatInKigali } from '../../types/index.ts';

export function LoansView({ store, user }: { store: StoreKey; user: User }) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [payModalLoan, setPayModalLoan] = useState<Loan | null>(null);
  const [payAmount, setPayAmount] = useState('');

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/loans?store=${store}`);
      const data = await res.json();
      if (data.success) {
        setLoans(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [store]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalLoan || !payAmount) return;

    try {
      const res = await fetch(`/api/loans/${payModalLoan._id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(payAmount) })
      });
      if (res.ok) {
        setPayModalLoan(null);
        setPayAmount('');
        fetchLoans();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalOutstanding = loans
    .filter(l => l.status !== 'paid')
    .reduce((acc, l) => acc + (l.amount - (l.paidAmount || 0)), 0);

  const filteredLoans = loans.filter(l =>
    l.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.customerPhone && l.customerPhone.includes(searchQuery))
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-border/80 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--brand-navy)]">Customer Loans & Credit</h1>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
              {STORE_LABELS[store]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Track customer debts, payment due dates, and record cash/MoMo loan settlements.
          </p>
        </div>

        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-right">
          <p className="text-[10px] uppercase font-bold tracking-wider text-orange-800">Total Unpaid Balance</p>
          <p className="text-lg font-bold font-mono text-orange-950">{formatCurrency(totalOutstanding)}</p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search loans by customer name or phone..."
            className="w-full rounded-lg border border-input bg-transparent pl-9 pr-3 py-1.5 text-xs outline-none"
          />
        </div>
      </div>

      {/* Loans Table */}
      <div className="rounded-2xl border border-border/80 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Loan</TableHead>
              <TableHead className="text-right">Amount Paid</TableHead>
              <TableHead className="text-right">Remaining Due</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLoans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-xs text-muted-foreground">
                  No loans recorded for this store branch.
                </TableCell>
              </TableRow>
            ) : (
              filteredLoans.map((l) => {
                const remaining = Math.max(0, l.amount - (l.paidAmount || 0));
                const isOverdue = l.status !== 'paid' && new Date(l.dueDate) < new Date();

                return (
                  <TableRow key={l._id}>
                    <TableCell>
                      <p className="font-semibold text-xs text-foreground">{l.customerName}</p>
                      {l.customerPhone && <p className="text-[11px] text-muted-foreground">{l.customerPhone}</p>}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className={`font-medium ${isOverdue ? 'text-red-600 font-bold' : 'text-muted-foreground'}`}>
                        {l.dueDate}
                      </span>
                    </TableCell>
                    <TableCell>
                      {l.status === 'paid' ? (
                        <Badge variant="success">Fully Settled</Badge>
                      ) : isOverdue ? (
                        <Badge variant="destructive">Overdue</Badge>
                      ) : l.paidAmount > 0 ? (
                        <Badge variant="warning">Partial</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {formatCurrency(l.amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-emerald-700">
                      {formatCurrency(l.paidAmount || 0)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs text-[var(--brand-navy)]">
                      {formatCurrency(remaining)}
                    </TableCell>
                    <TableCell className="text-right">
                      {remaining > 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPayModalLoan(l);
                            setPayAmount(String(remaining));
                          }}
                          className="text-xs"
                        >
                          <DollarSign className="size-3.5 mr-1" /> Pay Loan
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="size-3.5" /> Cleared
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Record Payment Modal */}
      {payModalLoan && (
        <Dialog
          open={!!payModalLoan}
          onOpenChange={() => setPayModalLoan(null)}
          title={`Record Loan Payment for ${payModalLoan.customerName}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="rounded-xl border border-border p-3 bg-muted/20 text-xs space-y-1">
              <p>Total Loan: <span className="font-bold">{formatCurrency(payModalLoan.amount)}</span></p>
              <p>Previously Paid: <span className="font-bold text-emerald-700">{formatCurrency(payModalLoan.paidAmount || 0)}</span></p>
              <p>Remaining: <span className="font-bold text-red-700">{formatCurrency(payModalLoan.amount - (payModalLoan.paidAmount || 0))}</span></p>
            </div>

            <label className="block space-y-1 text-xs font-semibold">
              Payment Amount Received (Rwf)
              <input
                type="number"
                min="1"
                max={payModalLoan.amount - (payModalLoan.paidAmount || 0)}
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none font-mono"
              />
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setPayModalLoan(null)}>
                Cancel
              </Button>
              <Button type="submit">
                Confirm Payment
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
