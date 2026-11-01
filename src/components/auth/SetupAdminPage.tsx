import React, { useState } from 'react';
import { UserPlus, Mail, LockKeyhole, Eye, EyeOff, ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { CodevLogo } from '../common/CodevLogo.tsx';

interface SetupAdminPageProps {
  onSetupSuccess: (userData: any) => void;
  onNavigateLogin: () => void;
}

export function SetupAdminPage({ onSetupSuccess, onNavigateLogin }: SetupAdminPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Admin setup passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Setup failed');
        setLoading(false);
        return;
      }
      onSetupSuccess(data.data);
    } catch {
      // Secondary fallback to guarantee offline & Vercel standalone operation
      try {
        const { handleClientApiRequest } = await import('../../api/clientInterceptor.ts');
        const fallbackRes = await handleClientApiRequest('/api/auth/setup', {
          method: 'POST',
          body: JSON.stringify({ name, email, password })
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success) {
          onSetupSuccess(fallbackData.data);
          return;
        }
        setError(fallbackData.error || 'Setup failed');
      } catch {
        setError('Unable to complete setup. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="brand-auth-surface min-h-screen flex items-center justify-center p-4">
      <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-10 w-full">
        {/* Left Form Card */}
        <section className="space-y-4 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xl sm:p-7">
          <div className="mb-4">
            <button
              type="button"
              onClick={onNavigateLogin}
              className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0F172A] mb-3 transition cursor-pointer"
            >
              <ArrowLeft className="size-3.5" /> Back to sign in
            </button>
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-[#14213D] text-white shadow-xs">
              <UserPlus className="size-5" />
            </div>
            <h2 className="text-2xl font-semibold text-[#14213D]">Create admin account</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              This creates the first administrator and signs you in when setup is complete.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-[#DC2626]">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <label className="block space-y-1.5 text-sm font-medium text-[#0F172A]">
              Administrator full name
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alexis Habimana"
                className="w-full rounded-lg border border-[#CBD5E1] bg-transparent px-3 py-2 text-sm transition outline-none focus-visible:border-[#2563EB] focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 h-10"
              />
            </label>

            <label className="block space-y-1.5 text-sm font-medium text-[#0F172A]">
              Work email address
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@codev.io"
                  className="w-full rounded-lg border border-[#CBD5E1] bg-transparent px-3 py-2 text-sm transition outline-none focus-visible:border-[#2563EB] focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 h-10 pl-9"
                />
              </div>
            </label>

            <label className="block space-y-1.5 text-sm font-medium text-[#0F172A]">
              Master password
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-lg border border-[#CBD5E1] bg-transparent px-3 py-2 text-sm transition outline-none focus-visible:border-[#2563EB] focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 h-10 pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center text-[#64748B] transition hover:text-[#0F172A] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>

            <label className="block space-y-1.5 text-sm font-medium text-[#0F172A]">
              Confirm password
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat master password"
                  className="w-full rounded-lg border border-[#CBD5E1] bg-transparent px-3 py-2 text-sm transition outline-none focus-visible:border-[#2563EB] focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 h-10 pl-9"
                />
              </div>
            </label>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full bg-[#14213D] text-white hover:bg-[#14213D]/90 font-medium"
            >
              {loading ? 'Creating admin...' : 'Create admin'}
            </Button>
          </form>
        </section>

        {/* Right Info Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <CodevLogo size="xl" />
            <div>
              <p className="text-sm font-semibold uppercase text-[#2563EB]">
                Set up your Codev workspace
              </p>
              <h2 className="text-3xl font-semibold text-[#14213D] sm:text-4xl tracking-tight">
                One admin opens the whole workspace.
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            {[
              'Secure access for Codev daily operations.',
              'Store teams start from one trusted admin account.',
              'Inventory, sales, invoices, and alerts stay connected.'
            ].map((text) => (
              <div
                key={text}
                className="flex items-start gap-3 rounded-lg border border-[#E2E8F0] bg-white/80 p-4 text-sm text-[#64748B] shadow-xs backdrop-blur-xs"
              >
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#14B8A6]" />
                <span className="text-[#0F172A] font-medium">{text}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
