import React, { useState, useEffect } from 'react';
import { Scale, Printer, Download, TrendingUp, DollarSign, Building } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { StoreKey, STORE_LABELS, User, formatCurrency } from '../../types/index.ts';

export function FinancialStatementsView({ store, user }: { store: StoreKey; user: User }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/financial-statements?store=${store}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, [store]);

  const inc = data?.incomeStatement || {
    grossRevenue: 0,
    returns: 0,
    netRevenue: 0,
    costOfGoodsSold: 0,
    grossProfit: 0,
    expenses: [],
    totalExpenses: 0,
    netProfit: 0
  };

  const bs = data?.balanceSheet || {
    currentAssets: { cashAndEquivalents: 0, accountsReceivable: 0, merchandiseInventory: 0 },
    currentLiabilities: { accountsPayable: 0, shortTermDebt: 0 }
  };

  const totalAssets = (bs.currentAssets.cashAndEquivalents || 0) +
    (bs.currentAssets.accountsReceivable || 0) +
    (bs.currentAssets.merchandiseInventory || 0);

  const totalLiabilities = (bs.currentLiabilities.accountsPayable || 0);
  const totalEquity = totalAssets - totalLiabilities;

  const grossMargin = inc.netRevenue > 0 ? Math.round((inc.grossProfit / inc.netRevenue) * 100) : 0;
  const netMargin = inc.netRevenue > 0 ? Math.round((inc.netProfit / inc.netRevenue) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-border/80 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--brand-navy)]">Financial Statements & Accounting</h1>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
              {STORE_LABELS[store]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Official Profit & Loss Statement (P&L) and Classified Balance Sheet for auditing.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs">
          <Printer className="size-3.5 mr-1" /> Print Statements
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Statement (P&L) */}
        <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-border pb-3">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Operating Performance</p>
            <h2 className="text-lg font-bold text-[var(--brand-navy)]">Statement of Comprehensive Income (P&L)</h2>
            <p className="text-xs text-muted-foreground">Currency: Rwandan Franc (Rwf)</p>
          </div>

          <div className="space-y-2 text-xs divide-y divide-border/60">
            {/* Revenue */}
            <div className="pt-2">
              <div className="flex justify-between font-semibold py-1">
                <span>Gross Hardware Sales Revenue</span>
                <span className="font-mono">{formatCurrency(inc.grossRevenue)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground py-0.5">
                <span>Less: Sales Returns & Allowances</span>
                <span className="font-mono text-red-600">({formatCurrency(inc.returns)})</span>
              </div>
              <div className="flex justify-between font-bold text-[var(--brand-navy)] py-1 border-t border-border/50">
                <span>Net Sales Revenue</span>
                <span className="font-mono text-sm">{formatCurrency(inc.netRevenue)}</span>
              </div>
            </div>

            {/* COGS */}
            <div className="pt-2">
              <div className="flex justify-between py-1 text-muted-foreground">
                <span>Cost of Goods Sold (Wholesale Inventory Cost)</span>
                <span className="font-mono text-red-600">({formatCurrency(inc.costOfGoodsSold)})</span>
              </div>
              <div className="flex justify-between font-bold text-foreground py-1 border-t border-border/50">
                <span>Gross Profit (Margin: {grossMargin}%)</span>
                <span className="font-mono text-sm text-emerald-700">{formatCurrency(inc.grossProfit)}</span>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="pt-2">
              <p className="font-bold text-foreground py-1">Operating Expenses (OPEX):</p>
              {(inc.expenses || []).map((exp: any) => (
                <div key={exp.category} className="flex justify-between py-0.5 text-muted-foreground">
                  <span className="pl-3">{exp.category}</span>
                  <span className="font-mono">{formatCurrency(exp.total)}</span>
                </div>
              ))}
              <div className="flex justify-between text-muted-foreground font-semibold py-1 border-t border-border/50">
                <span>Total Operating Expenses</span>
                <span className="font-mono text-red-600">({formatCurrency(inc.totalExpenses)})</span>
              </div>
            </div>

            {/* Net Income */}
            <div className="pt-3 border-t-2 border-[var(--brand-navy)]">
              <div className="flex justify-between font-extrabold text-sm text-[var(--brand-navy)] py-1">
                <span>NET OPERATING PROFIT (Net Margin: {netMargin}%)</span>
                <span className={`font-mono text-base ${inc.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {formatCurrency(inc.netProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Classified Balance Sheet */}
        <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-border pb-3">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Financial Position</p>
            <h2 className="text-lg font-bold text-[var(--brand-navy)]">Classified Balance Sheet</h2>
            <p className="text-xs text-muted-foreground">As of current accounting close</p>
          </div>

          <div className="space-y-3 text-xs divide-y divide-border/60">
            {/* Current Assets */}
            <div className="space-y-1.5 pt-1">
              <p className="font-bold text-foreground">Current Assets:</p>
              <div className="flex justify-between text-muted-foreground pl-3">
                <span>Cash on Hand & Bank Balances</span>
                <span className="font-mono">{formatCurrency(bs.currentAssets.cashAndEquivalents)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground pl-3">
                <span>Accounts Receivable (Customer Loans)</span>
                <span className="font-mono">{formatCurrency(bs.currentAssets.accountsReceivable)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground pl-3">
                <span>Merchandise Inventory Valuation (At Cost)</span>
                <span className="font-mono">{formatCurrency(bs.currentAssets.merchandiseInventory)}</span>
              </div>
              <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border/50">
                <span>Total Current Assets</span>
                <span className="font-mono text-sm text-primary">{formatCurrency(totalAssets)}</span>
              </div>
            </div>

            {/* Liabilities */}
            <div className="space-y-1.5 pt-2">
              <p className="font-bold text-foreground">Current Liabilities:</p>
              <div className="flex justify-between text-muted-foreground pl-3">
                <span>Accounts Payable (Suppliers)</span>
                <span className="font-mono">{formatCurrency(totalLiabilities)}</span>
              </div>
              <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border/50">
                <span>Total Liabilities</span>
                <span className="font-mono text-sm">{formatCurrency(totalLiabilities)}</span>
              </div>
            </div>

            {/* Equity */}
            <div className="space-y-1.5 pt-2">
              <p className="font-bold text-foreground">Owner's Equity:</p>
              <div className="flex justify-between text-muted-foreground pl-3">
                <span>Business Capital & Retained Earnings</span>
                <span className="font-mono">{formatCurrency(totalEquity)}</span>
              </div>
              <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border/50">
                <span>Total Equity</span>
                <span className="font-mono text-sm text-primary">{formatCurrency(totalEquity)}</span>
              </div>
            </div>

            {/* Total Liabilities + Equity */}
            <div className="pt-3 border-t-2 border-[var(--brand-navy)]">
              <div className="flex justify-between font-extrabold text-sm text-[var(--brand-navy)] py-1">
                <span>TOTAL LIABILITIES & EQUITY</span>
                <span className="font-mono text-base text-[var(--brand-navy)]">{formatCurrency(totalLiabilities + totalEquity)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
