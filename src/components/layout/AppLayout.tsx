import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  PackageSearch,
  ReceiptText,
  RotateCcw,
  FileText,
  Wallet,
  Clock,
  Bell,
  ArrowLeftRight,
  BarChart3,
  Scale,
  LogOut,
  Building2,
  ChevronDown,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  Store
} from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { CodevLogo } from '../common/CodevLogo.tsx';
import { STORE_LABELS, StoreKey, User, formatCurrency } from '../../types/index.ts';

export type ActiveTab =
  | 'dashboard'
  | 'users'
  | 'products'
  | 'sales'
  | 'customers-suppliers'
  | 'returns'
  | 'invoices'
  | 'expenses'
  | 'outstanding'
  | 'alerts'
  | 'stock-adjustments'
  | 'reports'
  | 'financial-statements';

interface AppLayoutProps {
  user: User;
  activeStore: StoreKey;
  onStoreChange: (newStore: StoreKey) => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AppLayout({
  user,
  activeStore,
  onStoreChange,
  activeTab,
  onTabChange,
  onLogout,
  children
}: AppLayoutProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loanNotifs, setLoanNotifs] = useState<any[]>([]);
  const [requestNotifs, setRequestNotifs] = useState<any[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const [loansRes, reqsRes, alertsRes] = await Promise.all([
        fetch('/api/loans/notifications'),
        fetch('/api/product-requests/notifications'),
        fetch(`/api/alerts?store=${activeStore}`)
      ]);

      if (loansRes.ok) {
        const d = await loansRes.json();
        if (d.success) setLoanNotifs(d.data || []);
      }
      if (reqsRes.ok) {
        const d = await reqsRes.json();
        if (d.success) setRequestNotifs(d.data || []);
      }
      if (alertsRes.ok) {
        const d = await alertsRes.json();
        if (d.success) setLowStockCount((d.data || []).length);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [activeStore]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  const totalNotifCount = loanNotifs.length + (user.isAdmin ? requestNotifs.length : 0);

  // Exact 13 items preserved with exact lucide icons
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
    { id: 'users' as ActiveTab, label: 'Users', icon: Users, adminOnly: true },
    { id: 'products' as ActiveTab, label: 'Products', icon: PackageSearch, adminOnly: false },
    { id: 'sales' as ActiveTab, label: 'Sales', icon: ReceiptText, adminOnly: false },
    { id: 'customers-suppliers' as ActiveTab, label: 'Customers/Suppliers', icon: Users, adminOnly: false },
    { id: 'returns' as ActiveTab, label: 'Returns', icon: RotateCcw, adminOnly: false },
    { id: 'invoices' as ActiveTab, label: 'Invoices/DN', icon: FileText, adminOnly: false },
    { id: 'expenses' as ActiveTab, label: 'Expenses', icon: Wallet, adminOnly: false },
    { id: 'outstanding' as ActiveTab, label: 'Loans', icon: Clock, adminOnly: false },
    { id: 'alerts' as ActiveTab, label: 'Low Stock Alerts', icon: Bell, badge: lowStockCount, adminOnly: false },
    { id: 'stock-adjustments' as ActiveTab, label: 'Stock Adjustments', icon: ArrowLeftRight, adminOnly: true },
    { id: 'reports' as ActiveTab, label: 'Visual Reports', icon: BarChart3, adminOnly: true },
    { id: 'financial-statements' as ActiveTab, label: 'Financial Reports', icon: Scale, adminOnly: true }
  ];

  const filteredNavItems = navItems.filter(item => !item.adminOnly || user.isAdmin || user.role === 'manager');

  const roleLabels: Record<string, string> = {
    admin: 'Super Admin',
    manager: 'Manager',
    staff: 'Sales Staff',
    inventory_manager: 'Inventory Manager',
    finance: 'Finance Officer'
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Logo & Brand Title: Codev */}
          <div className="flex items-center gap-3">
            <CodevLogo size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-[#14213D] tracking-tight">Codev</span>
                <span className="hidden sm:inline-flex rounded-md bg-[#2563EB]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#2563EB]">
                  Business Suite
                </span>
              </div>
              <p className="text-xs text-[#64748B] hidden sm:block">Business & inventory management across stores</p>
            </div>
          </div>

          {/* Right Header: Store Switcher, Notifications, User info, Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Store Switcher */}
            <div className="relative">
              <div className="flex items-center gap-2 rounded-xl border border-[#2563EB]/25 bg-[#2563EB]/5 px-3 py-1.5 shadow-xs transition hover:bg-[#2563EB]/10">
                <Store className="size-4 text-[#2563EB]" />
                <span className="text-xs text-[#64748B] hidden md:inline">Branch:</span>
                <select
                  value={activeStore}
                  onChange={(e) => onStoreChange(e.target.value as StoreKey)}
                  className="bg-transparent font-semibold text-sm text-[#14213D] outline-none cursor-pointer pr-1"
                >
                  <option value="store1">Gisozi (Store 1)</option>
                  <option value="store2">Kinyinya (Store 2)</option>
                </select>
              </div>
            </div>

            {/* Notifications Popover */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="size-5" />
                {totalNotifCount > 0 && (
                  <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-[#2563EB] text-[10px] font-bold text-white shadow-xs">
                    {totalNotifCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xl z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                    <h4 className="font-semibold text-sm text-[#0F172A]">Notifications & Alerts</h4>
                    <span className="text-xs text-[#64748B]">{STORE_LABELS[activeStore]}</span>
                  </div>

                  <div className="divide-y divide-[#E2E8F0] max-h-80 overflow-y-auto mt-2">
                    {/* Low stock notice */}
                    {lowStockCount > 0 && (
                      <div
                        onClick={() => {
                          onTabChange('alerts');
                          setNotificationsOpen(false);
                        }}
                        className="py-2.5 flex items-start gap-2.5 hover:bg-[#F1F5F9] p-2 rounded-lg cursor-pointer transition"
                      >
                        <AlertTriangle className="size-4 text-[#F59E0B] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-[#0F172A]">{lowStockCount} Products Low on Stock</p>
                          <p className="text-[11px] text-[#64748B]">Threshold breached at {STORE_LABELS[activeStore]}. Click to view alerts.</p>
                        </div>
                      </div>
                    )}

                    {/* Pending product requests for admin */}
                    {user.isAdmin && requestNotifs.length > 0 && (
                      <div
                        onClick={() => {
                          onTabChange('products');
                          setNotificationsOpen(false);
                        }}
                        className="py-2.5 flex items-start gap-2.5 hover:bg-[#F1F5F9] p-2 rounded-lg cursor-pointer transition"
                      >
                        <ClipboardCheck className="size-4 text-[#2563EB] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-[#0F172A]">{requestNotifs.length} Product Request(s) Awaiting Review</p>
                          <p className="text-[11px] text-[#64748B]">Staff requested new catalogue items or edits.</p>
                        </div>
                      </div>
                    )}

                    {/* Loans due soon */}
                    {loanNotifs.length > 0 && (
                      loanNotifs.map((l) => (
                        <div
                          key={l.id}
                          onClick={() => {
                            onTabChange('outstanding');
                            setNotificationsOpen(false);
                          }}
                          className="py-2.5 flex items-start gap-2.5 hover:bg-[#F1F5F9] p-2 rounded-lg cursor-pointer transition"
                        >
                          <Clock className="size-4 text-[#2563EB] mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-[#0F172A]">{l.customerName}</p>
                            <p className="text-[11px] text-[#64748B]">
                              {l.paymentDateLabel} {l.customerPhone ? `• ${l.customerPhone}` : ''}
                            </p>
                            <p className="text-xs font-bold text-[#14213D] mt-0.5">{formatCurrency(l.amount)}</p>
                          </div>
                        </div>
                      ))
                    )}

                    {lowStockCount === 0 && (!user.isAdmin || requestNotifs.length === 0) && loanNotifs.length === 0 && (
                      <div className="py-6 text-center text-xs text-[#64748B]">
                        No notifications requiring attention.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#E2E8F0]">
              <div className="text-right">
                <p className="text-xs font-semibold text-[#0F172A] leading-tight">{user.name}</p>
                <p className="text-[11px] text-[#64748B]">{roleLabels[user.role] || user.role}</p>
              </div>
            </div>

            {/* Logout button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="text-xs text-[#64748B] hover:text-[#0F172A]"
            >
              <LogOut className="size-3.5 mr-1" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout: Sidebar + Main View */}
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Sidebar */}
          <aside className="w-full shrink-0 rounded-2xl border border-[#E2E8F0] bg-white/95 p-3 backdrop-blur-sm shadow-sm md:sticky md:top-20 md:h-fit md:w-64">
            <div className="mb-3 border-b border-[#E2E8F0] px-2 pb-2.5">
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#64748B]">
                Codev Suite
              </p>
              <h2 className="text-base font-bold text-[#14213D]">Control Center</h2>
            </div>

            <nav className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:flex md:flex-col">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-sm font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-[#14213D] text-white shadow-sm font-semibold'
                        : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`size-4 shrink-0 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                      <span className="text-left">{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                          isActive
                            ? 'bg-[#14B8A6] text-white'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content Viewport */}
          <main className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              {children}
            </div>

            {/* Footer matching requirement: Powered by Codev */}
            <footer className="mt-12 py-4 border-t border-[#E2E8F0] text-center text-xs text-[#64748B] flex items-center justify-between">
              <span>Codev — Business & Inventory Management Platform</span>
              <span className="font-medium text-[#14213D]">Powered by Codev</span>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
