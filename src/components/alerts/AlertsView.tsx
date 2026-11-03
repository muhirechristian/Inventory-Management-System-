import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, ArrowRight, RefreshCw, PackageSearch } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table.tsx';
import { StoreKey, STORE_LABELS, User, formatCurrency } from '../../types/index.ts';

interface AlertsViewProps {
  store: StoreKey;
  user: User;
  onNavigateTab: (tab: any) => void;
}

export function AlertsView({ store, user, onNavigateTab }: AlertsViewProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/alerts?store=${store}`);
      const data = await res.json();
      if (data.success) {
        setAlerts(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [store]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-border/80 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--brand-navy)]">Low Stock Inventory Alerts</h1>
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
              {alerts.length} Breaches in {STORE_LABELS[store]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Immediate reorder alerts when hardware supplies breach the defined safety threshold.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted cursor-pointer"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      <div className="rounded-2xl border border-border/80 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product / SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Current Stock</TableHead>
              <TableHead className="text-center">Min Safety Threshold</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Deficit / Suggested Reorder</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                  All hardware products in {STORE_LABELS[store]} are well stocked above safety thresholds.
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((item, idx) => {
                const isZero = item.quantity <= 0;
                const deficit = Math.max(0, (item.threshold * 2) - item.quantity);

                return (
                  <TableRow key={item._id || item.id || item.sku || `alert-${idx}`}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-xs text-foreground">{item.name}</p>
                        <p className="text-[11px] font-mono text-muted-foreground">{item.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="rounded bg-muted px-2 py-0.5">{item.category}</span>
                    </TableCell>
                    <TableCell className="text-center font-bold text-sm font-mono text-red-600">
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-center text-xs font-mono text-muted-foreground">
                      {item.threshold} {item.unit}
                    </TableCell>
                    <TableCell>
                      {isZero ? (
                        <Badge variant="destructive">Critical: Out of Stock</Badge>
                      ) : (
                        <Badge variant="warning">Low Stock Warning</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-bold text-xs text-primary font-mono">
                      +{deficit} {item.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNavigateTab('stock-adjustments')}
                        className="text-xs"
                      >
                        Transfer Stock <ArrowRight className="size-3.5 ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
