import React, { useState, useEffect } from 'react';
import { User, StoreKey, StoreKey as TStoreKey } from './types/index.ts';
import { CodevLogo } from './components/common/CodevLogo.tsx';
import { LoginPage } from './components/auth/LoginPage.tsx';
import { SetupAdminPage } from './components/auth/SetupAdminPage.tsx';
import { AppLayout, ActiveTab } from './components/layout/AppLayout.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { ProductsView } from './components/products/ProductsView.tsx';
import { SalesView } from './components/sales/SalesView.tsx';
import { InvoicesView } from './components/invoices/InvoicesView.tsx';
import { CustomersSuppliersView } from './components/customers/CustomersSuppliersView.tsx';
import { LoansView } from './components/loans/LoansView.tsx';
import { ReturnsView } from './components/returns/ReturnsView.tsx';
import { ExpensesView } from './components/expenses/ExpensesView.tsx';
import { StockAdjustmentsView } from './components/transfers/StockAdjustmentsView.tsx';
import { AlertsView } from './components/alerts/AlertsView.tsx';
import { ReportsView } from './components/reports/ReportsView.tsx';
import { FinancialStatementsView } from './components/reports/FinancialStatementsView.tsx';
import { UsersView } from './components/users/UsersView.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'setup'>('login');
  const [activeStore, setActiveStore] = useState<StoreKey>('store1');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          if (data.user.activeStore) {
            setActiveStore(data.user.activeStore as StoreKey);
          }
          setAuthChecked(true);
          return;
        }
      }
    } catch (e) {
      console.warn('Primary session check failed, evaluating local state', e);
    }

    // Fallback: Check local storage session user (for standalone & Vercel hosting)
    try {
      const { clientDb } = await import('./api/clientDb.ts');
      const localUser = clientDb.getSessionUser();
      if (localUser) {
        setCurrentUser(localUser);
        if (localUser.activeStore) {
          setActiveStore(localUser.activeStore as StoreKey);
        }
        setAuthChecked(true);
        return;
      }
    } catch {}

    setCurrentUser(null);
    setAuthChecked(true);
  };

  useEffect(() => {
    checkSession();
  }, []);

  // Heartbeat to keep session alive while user is interacting
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      fetch('/api/auth/heartbeat', { method: 'POST' }).catch(() => {});
    }, 120000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleStoreChange = async (newStore: StoreKey) => {
    setActiveStore(newStore);
    try {
      await fetch('/api/auth/switch-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store: newStore })
      });
    } catch (e) {
      console.error('Failed to update active store', e);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setCurrentUser(null);
    setAuthView('login');
    setActiveTab('dashboard');
  };

  const handleLoginSuccess = (userData: User) => {
    setCurrentUser(userData);
    if (userData.activeStore) {
      setActiveStore(userData.activeStore as StoreKey);
    }
  };

  if (!authChecked) {
    return (
      <div className="brand-auth-surface min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <CodevLogo size="lg" />
          <p className="text-sm font-semibold text-[#14213D] animate-pulse">Initializing Codev Business Suite...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated views
  if (!currentUser) {
    if (authView === 'setup') {
      return (
        <SetupAdminPage
          onSetupSuccess={handleLoginSuccess}
          onNavigateLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateSetup={() => setAuthView('setup')}
      />
    );
  }

  // Authenticated Dashboard Layout & Tab Routing
  return (
    <AppLayout
      user={currentUser}
      activeStore={activeStore}
      onStoreChange={handleStoreChange}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
      {activeTab === 'dashboard' && (
        <DashboardView
          store={activeStore}
          user={currentUser}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'users' && (
        <UsersView currentUser={currentUser} />
      )}

      {activeTab === 'products' && (
        <ProductsView
          store={activeStore}
          user={currentUser}
        />
      )}

      {activeTab === 'sales' && (
        <SalesView
          store={activeStore}
          user={currentUser}
          onNavigateInvoice={() => setActiveTab('invoices')}
        />
      )}

      {activeTab === 'customers-suppliers' && (
        <CustomersSuppliersView user={currentUser} />
      )}

      {activeTab === 'returns' && (
        <ReturnsView
          store={activeStore}
          user={currentUser}
        />
      )}

      {activeTab === 'invoices' && (
        <InvoicesView
          store={activeStore}
          user={currentUser}
        />
      )}

      {activeTab === 'expenses' && (
        <ExpensesView
          store={activeStore}
          user={currentUser}
        />
      )}

      {activeTab === 'outstanding' && (
        <LoansView
          store={activeStore}
          user={currentUser}
        />
      )}

      {activeTab === 'alerts' && (
        <AlertsView
          store={activeStore}
          user={currentUser}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'stock-adjustments' && (
        <StockAdjustmentsView
          store={activeStore}
          user={currentUser}
        />
      )}

      {activeTab === 'reports' && (
        <ReportsView
          store={activeStore}
          user={currentUser}
        />
      )}

      {activeTab === 'financial-statements' && (
        <FinancialStatementsView
          store={activeStore}
          user={currentUser}
        />
      )}
    </AppLayout>
  );
}
