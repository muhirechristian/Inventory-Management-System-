import React, { useState } from 'react';
import { Mail, LockKeyhole, Eye, EyeOff, KeyRound, ArrowRight, PackageCheck, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { CodevLogo } from '../common/CodevLogo.tsx';

interface LoginPageProps {
  onLoginSuccess: (userData: any) => void;
  onNavigateSetup: () => void;
}

export function LoginPage({ onLoginSuccess, onNavigateSetup }: LoginPageProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid credentials');
        setLoading(false);
        return;
      }
      onLoginSuccess(data.data);
    } catch {
      setError('Network connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="brand-auth-surface min-h-screen flex items-center justify-center p-4">
      <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 w-full">
        {/* Left Branding Column */}
        <section className="order-2 space-y-8 lg:order-1">
          <div className="flex items-center gap-4">
            <CodevLogo size="xl" />
            <div>
              <p className="text-sm font-semibold uppercase text-[#2563EB]">
                Welcome to Codev
              </p>
              <h1 className="text-3xl font-semibold text-[#14213D] sm:text-4xl tracking-tight">
                Inventory control for every counter.
              </h1>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[#E2E8F0] bg-white/80 p-4 text-sm font-medium text-[#14213D] shadow-xs backdrop-blur-xs">
              <PackageCheck className="mb-3 size-5 text-[#2563EB]" />
              Track stock across stores
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-white/80 p-4 text-sm font-medium text-[#14213D] shadow-xs backdrop-blur-xs">
              <PackageCheck className="mb-3 size-5 text-[#2563EB]" />
              Manage products and sales
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-white/80 p-4 text-sm font-medium text-[#14213D] shadow-xs backdrop-blur-xs">
              <PackageCheck className="mb-3 size-5 text-[#2563EB]" />
              Review invoices and alerts
            </div>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-white/60 p-3 text-xs text-[#64748B]">
            <span className="font-semibold text-[#0F172A]">Demo Credentials:</span> Admin: <code className="font-mono text-[#0F172A]">admin</code> / <code className="font-mono text-[#0F172A]">admin123</code> | Staff: <code className="font-mono text-[#0F172A]">eric</code> / <code className="font-mono text-[#0F172A]">staff123</code>
          </div>
        </section>

        {/* Right Sign-in Card */}
        <section className="order-1 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xl sm:p-7 lg:order-2">
          <div className="mb-6">
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-[#14213D] text-white shadow-xs">
              <KeyRound className="size-5" />
            </div>
            <h2 className="text-2xl font-semibold text-[#14213D]">Sign in</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Use your staff or admin account to continue to the dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-[#DC2626]">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <label className="block space-y-1.5 text-sm font-medium text-[#0F172A]">
              Email or username
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="text"
                  data-slot="input"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Email or username"
                  className="w-full rounded-lg border border-[#CBD5E1] bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-[#2563EB] focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 h-11 pl-9 text-sm"
                />
              </div>
            </label>

            <label className="block space-y-1.5 text-sm font-medium text-[#0F172A]">
              Password
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  data-slot="input"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-[#CBD5E1] bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-[#2563EB] focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 h-11 pl-9 pr-11 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center text-[#64748B] transition hover:text-[#0F172A] cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-[#14213D] text-white hover:bg-[#14213D]/90 font-medium"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 border-t border-[#E2E8F0] pt-5">
            <p className="text-sm text-[#64748B]">Setting up the system for the first time?</p>
            <button
              type="button"
              onClick={onNavigateSetup}
              className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-[#2563EB] bg-[#2563EB] px-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#2563EB]/90 cursor-pointer"
            >
              Get Started
              <ArrowRight className="size-4" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
