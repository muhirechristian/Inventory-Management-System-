import React, { useState, useEffect } from 'react';
import {
  Package,
  Layers,
  ReceiptText,
  TrendingUp,
  RotateCcw,
  Clock,
  ShoppingCart,
  Wallet,
  DollarSign,
  Banknote,
  Building,
  Smartphone,
  PackageSearch,
  ArrowUpRight,
  Store,
  RefreshCw
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table.tsx';
import { StoreKey, STORE_LABELS, User, formatCurrency, formatInKigali } from '../../types/index.ts';

interface DashboardViewProps {
  store: StoreKey;
  user: User;
  onNavigateTab: (tab: any) => void;
}

export function DashboardView({ store, user, onNavigateTab }: DashboardViewProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/stats?store=${store}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (e) {
      console.error('Failed to load stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [store]);

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-[#E2E8F0] bg-white/60 p-4" />
          ))}
        </div>
      </div>
    );
  }

  const f = stats || {
    productCount: 0,
    stockValue: 0,
    salesToday: 0,
    revenueToday: 0,
    returnsToday: 0,
    loansToday: 0,
    costOfSalesToday: 0,
    expensesToday: 0,
    profitToday: 0,
    paymentsByMethod: { cash: 0, bank: 0, mobile: 0 },
    recentSales: [],
    topMoving: []
  };

  const profit = f.profitToday ?? 0;

  const statCards = [
    {
      label: 'Products',
      value: f.productCount ?? 0,
      icon: Package,
      className: 'border-[#E2E8F0] bg-white text-[#0F172A]',
      iconClassName: 'text-[#2563EB]',
      adminOnly: true
    },
    {
      label: 'Total Stock Value',
      value: formatCurrency(f.stockValue ?? 0),
      icon: Layers,
      className: 'border-blue-200 bg-blue-50/60 text-[#14213D]',
      iconClassName: 'text-[#2563EB]',
      adminOnly: true
    },
    {
      label: 'Sales Today',
      value: f.salesToday ?? 0,
      icon: ReceiptText,
      className: 'border-[#E2E8F0] bg-white text-[#0F172A]',
      iconClassName: 'text-[#14213D]',
      adminOnly: false
    },
    {
      label: 'Revenue Today',
      value: formatCurrency(f.revenueToday ?? 0),
      icon: TrendingUp,
      className: 'border-emerald-200 bg-emerald-50/70 text-emerald-950',
      iconClassName: 'text-[#16A34A]',
      adminOnly: false
    },
    {
      label: "Today's Returns",
      value: `-${formatCurrency(f.returnsToday ?? 0)}`,
      icon: RotateCcw,
      className: 'border-red-200 bg-red-50/70 text-red-950',
      iconClassName: 'text-[#DC2626]',
      adminOnly: false
    },
    {
      label: "Today's Loans",
      value: formatCurrency(f.loansToday ?? 0),
      icon: Clock,
      className: 'border-amber-200 bg-amber-50/70 text-amber-950',
      iconClassName: 'text-[#F59E0B]',
      adminOnly: false
    },
    {
      label: 'Cost of Sales',
      value: formatCurrency(f.costOfSalesToday ?? 0),
      icon: ShoppingCart,
      className: 'border-slate-200 bg-slate-50/80 text-[#0F172A]',
      iconClassName: 'text-[#64748B]',
      adminOnly: true
    },
    {
      label: 'Expenses Today',
      value: formatCurrency(f.expensesToday ?? 0),
      icon: Wallet,
      className: 'border-rose-200 bg-rose-50/70 text-rose-950',
      iconClassName: 'text-rose-600',
      adminOnly: false
    },
    {
      label: 'Profit Today',
      value: formatCurrency(profit),
      icon: DollarSign,
      className: profit >= 0 ? 'border-teal-200 bg-teal-50/80 text-teal-950' : 'border-amber-200 bg-amber-50/80 text-amber-950',
      iconClassName: profit >= 0 ? 'text-[#14B8A6]' : 'text-[#F59E0B]',
      adminOnly: true
    },
    {
      label: 'Cash Payments',
      value: formatCurrency(f.paymentsByMethod?.cash ?? 0),
      icon: Banknote,
      className: 'border-[#E2E8F0] bg-white text-[#0F172A]',
      iconClassName: 'text-[#16A34A]',
      adminOnly: false
    },
    {
      label: 'Bank Payments',
      value: formatCurrency(f.paymentsByMethod?.bank ?? 0),
      icon: Building,
      className: 'border-[#E2E8F0] bg-white text-[#0F172A]',
      iconClassName: 'text-[#2563EB]',
      adminOnly: false
    },
    {
      label: 'Mobile Payments',
      value: formatCurrency(f.paymentsByMethod?.mobile ?? 0),
      icon: Smartphone,
      className: 'border-teal-200 bg-teal-50/60 text-teal-950',
      iconClassName: 'text-[#14B8A6]',
      adminOnly: false
    }
  ];

  const visibleCards = user.isAdmin || user.role === 'manager'
    ? statCards
    : statCards.filter(c => !c.adminOnly);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#14213D]">Branch Overview: {STORE_LABELS[store]}</h1>
            <span className="rounded-md bg-[#2563EB]/10 px-2 py-0.5 text-xs font-semibold text-[#2563EB]">
              Active Counter
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time business inventory, transactions, revenue and performance metrics.
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9] transition cursor-pointer"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* 12 Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visibleCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-2xl border p-4 shadow-xs transition hover:shadow-sm ${card.className}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium opacity-80">{card.label}</span>
                <Icon className={`size-4 ${card.iconClassName}`} />
              </div>
              <p className="mt-2 text-xl font-bold tracking-tight">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Two side-by-side tables matching reference */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sales Table */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#64748B]">
                Sales Activity
              </p>
              <h3 className="text-lg font-bold text-[#14213D]">Recent Sales</h3>
            </div>
            <button
              onClick={() => onNavigateTab('sales')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              View all <ArrowUpRight className="size-3.5" />
            </button>
          </div>

          <div className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Quantity Sold</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!f.recentSales || f.recentSales.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-xs text-[#64748B]">
                      No sales recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  f.recentSales.map((s: any, idx: number) => (
                    <TableRow key={s._id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : ''}>
                      <TableCell className="font-medium text-xs">
                        {formatInKigali(s.createdAt, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        <span className="block text-[11px] text-[#64748B]">{s.customerName}</span>
                      </TableCell>
                      <TableCell className="text-xs text-[#0F172A]">
                        {s.quantitySold} {(s.units || []).join('/')}
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-[#14213D]">
                        {formatCurrency(s.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Top Moving Products Table */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#64748B]">
                Product Performance
              </p>
              <h3 className="text-lg font-bold text-[#14213D]">Top Moving Products</h3>
            </div>
            <button
              onClick={() => onNavigateTab('products')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              Inventory <ArrowUpRight className="size-3.5" />
            </button>
          </div>

          <div className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Sold</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!f.topMoving || f.topMoving.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-xs text-[#64748B]">
                      No movement data yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  f.topMoving.map((p: any, idx: number) => (
                    <TableRow key={p.sku || p.name} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : ''}>
                      <TableCell>
                        <p className="font-semibold text-xs text-[#0F172A]">{p.name}</p>
                        <p className="text-[10px] font-mono text-[#64748B]">{p.sku}</p>
                      </TableCell>
                      <TableCell className="text-xs text-[#0F172A]">
                        <span className="font-medium">{p.soldQuantity}</span> {p.unit}
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-[#14213D]">
                        {formatCurrency(p.salesValue)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
