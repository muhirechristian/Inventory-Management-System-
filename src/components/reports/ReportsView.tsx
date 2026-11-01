import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Layers, Building2, Download } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { StoreKey, STORE_LABELS, User, formatCurrency } from '../../types/index.ts';

export function ReportsView({ store, user }: { store: StoreKey; user: User }) {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?store=${store}`);
      const data = await res.json();
      if (data.success) {
        setReportData(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [store]);

  const dailySales = reportData?.dailySales || [];
  const categorySales = reportData?.categorySales || [];
  const storeComparison = reportData?.storeComparison || [];

  const maxDaily = Math.max(...dailySales.map((d: any) => d.total), 100000);
  const maxCat = Math.max(...categorySales.map((c: any) => c.totalSales), 100000);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#14213D]">Visual Analytics & Performance</h1>
            <span className="rounded-md bg-[#2563EB]/10 px-2 py-0.5 text-xs font-semibold text-[#2563EB]">
              {STORE_LABELS[store]}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Visual metrics, multi-store revenue comparison, and inventory movement distribution.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs">
          <Download className="size-3.5 mr-1" /> Export Report
        </Button>
      </div>

      {/* Store Comparison Grid */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <h3 className="font-bold text-sm text-[#14213D] mb-4 flex items-center gap-2">
          <Building2 className="size-4 text-[#2563EB]" /> Branch Performance Comparison (Year to Date)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {storeComparison.map((st: any) => (
            <div key={st.store_id} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-[#0F172A]">{st.storeName} Branch</span>
                <span className="rounded bg-[#2563EB]/10 px-2 py-0.5 text-xs font-bold text-[#2563EB]">
                  {st.salesCount || 0} Transactions
                </span>
              </div>
              <p className="text-2xl font-bold font-mono text-[#14213D]">{formatCurrency(st.revenue || 0)}</p>
              <div className="mt-3 w-full bg-[#E2E8F0] rounded-full h-2">
                <div
                  className="bg-[#14213D] h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(15, (st.revenue / (Math.max(storeComparison[0]?.revenue || 1, storeComparison[1]?.revenue || 1))) * 100))}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Chart 1: Daily Sales Trend */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">Daily Trajectory</p>
            <h3 className="text-base font-bold text-[#14213D]">Daily Sales Trend (Last 7 Days)</h3>
          </div>
          <span className="text-xs text-[#64748B]">Branch: {STORE_LABELS[store]}</span>
        </div>

        <div className="h-64 flex items-end gap-3 pt-6 pb-2 border-b border-[#E2E8F0]">
          {dailySales.length === 0 ? (
            <div className="w-full text-center py-12 text-xs text-[#64748B]">No recent daily sales data.</div>
          ) : (
            dailySales.map((d: any, idx: number) => {
              const heightPercent = Math.max(12, Math.round((d.total / maxDaily) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-mono font-bold text-[#14213D] opacity-0 group-hover:opacity-100 transition">
                    {formatCurrency(d.total)}
                  </span>
                  <div className="w-full max-w-[48px] bg-[#2563EB]/10 hover:bg-[#2563EB] rounded-t-lg transition-all relative flex flex-col justify-end" style={{ height: `${heightPercent}%` }}>
                    <div className="w-full bg-[#2563EB] rounded-t-lg" style={{ height: `${heightPercent}%` }} />
                  </div>
                  <span className="text-[11px] font-medium text-[#64748B]">{d.date.slice(5)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Visual Chart 2: Category Revenue Breakdown */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div className="mb-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">Category Distribution</p>
          <h3 className="text-base font-bold text-[#14213D]">Sales Performance by Product Category</h3>
        </div>

        <div className="space-y-3">
          {categorySales.length === 0 ? (
            <p className="text-xs text-[#64748B] py-6 text-center">No category sales recorded yet.</p>
          ) : (
            categorySales.map((cat: any) => {
              const pct = Math.round((cat.totalSales / maxCat) * 100);
              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#0F172A]">{cat.category} ({cat.totalQty || 0} units)</span>
                    <span className="font-mono font-bold text-[#14213D]">{formatCurrency(cat.totalSales)}</span>
                  </div>
                  <div className="h-2.5 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#14213D] via-[#2563EB] to-[#14B8A6] rounded-full transition-all"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
