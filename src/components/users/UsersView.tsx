import React, { useState, useEffect } from 'react';
import { Users, Plus, ShieldCheck, UserCheck, Trash2, Key, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { Dialog } from '../ui/Dialog.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table.tsx';
import { User, LoginLog, STORE_LABELS, StoreKey, formatInKigali } from '../../types/index.ts';

export function UsersView({ currentUser }: { currentUser: User }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    store: 'store1',
    isActive: true
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
        setLoginLogs(data.loginLogs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setError(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      store: 'store1',
      isActive: true
    });
    setModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Please provide name and email or username.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
          stores: formData.store === 'both' ? ['store1', 'store2'] : [formData.store],
          isActive: formData.isActive
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to create user');
        return;
      }

      setModalOpen(false);
      fetchUsers();
    } catch {
      setError('Network error. Check connection and try again.');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser.id) {
      alert('Cannot delete your own active administrator account.');
      return;
    }

    if (!confirm(`Are you sure you want to delete user account "${user.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchUsers();
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const roleDisplay: Record<string, string> = {
    admin: 'Super Admin',
    manager: 'Store Manager',
    staff: 'Sales Staff',
    inventory_manager: 'Inventory Manager',
    finance: 'Finance Officer'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#14213D]">Staff & Role-Based Access Control</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Manage authorized employees, assign store branch permissions, and audit recent login activity.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="text-xs font-semibold">
          <Plus className="size-4 mr-1" /> Add User
        </Button>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0]">
          <h3 className="font-bold text-sm text-[#14213D]">Authorized System Accounts</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Full Name</TableHead>
              <TableHead>Email / Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch Access</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u._id}>
                <TableCell>
                  <p className="font-semibold text-xs text-[#0F172A]">{u.name}</p>
                </TableCell>
                <TableCell className="text-xs font-mono text-[#64748B]">{u.email}</TableCell>
                <TableCell className="text-xs">
                  <Badge variant={u.role === 'admin' ? 'purple' : 'info'}>
                    {roleDisplay[u.role] || u.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-[#0F172A]">
                  {(u.stores || []).map((s: string) => STORE_LABELS[s as StoreKey] || s).join(', ') || 'All Stores'}
                </TableCell>
                <TableCell>
                  {u.isActive ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {u.id !== currentUser.id && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u)}
                      className="rounded-md p-1.5 text-[#64748B] hover:bg-red-50 hover:text-[#DC2626] transition cursor-pointer"
                      title="Delete user"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Login Logs Audit Table */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0]">
          <h3 className="font-bold text-sm text-[#14213D] flex items-center gap-2">
            <Clock className="size-4 text-[#2563EB]" /> Session Activity & Audit Logs
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Login Timestamp</TableHead>
              <TableHead>Logout Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loginLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-xs text-[#64748B]">
                  No login history recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              loginLogs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell className="font-semibold text-xs text-[#0F172A]">{log.name}</TableCell>
                  <TableCell className="text-xs text-[#64748B] font-mono">{log.email}</TableCell>
                  <TableCell className="text-xs capitalize">{log.role}</TableCell>
                  <TableCell className="text-xs font-mono">{formatInKigali(log.loginAt)}</TableCell>
                  <TableCell className="text-xs font-mono">
                    {log.logoutAt ? (
                      formatInKigali(log.logoutAt)
                    ) : (
                      <span className="text-[#16A34A] font-semibold">Active Session</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add User Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Add System User"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateUser} className="space-y-3.5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-[#DC2626]">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
            Full Name
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Marie Claire Mukamana"
              className="w-full rounded-lg border border-[#CBD5E1] px-3 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            />
          </label>

          <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
            Email or Username
            <input
              type="text"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="marie@codev.io"
              className="w-full rounded-lg border border-[#CBD5E1] px-3 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            />
          </label>

          <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
            Password (at least 8 characters)
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-lg border border-[#CBD5E1] px-3 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
              Role
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs outline-none"
              >
                <option value="staff">Sales Staff</option>
                <option value="manager">Store Manager</option>
                <option value="inventory_manager">Inventory Manager</option>
                <option value="finance">Finance Staff</option>
                <option value="admin">Super Admin</option>
              </select>
            </label>

            <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
              Assigned Store
              <select
                value={formData.store}
                onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs outline-none"
              >
                <option value="store1">Gisozi (Store 1)</option>
                <option value="store2">Kinyinya (Store 2)</option>
                <option value="both">Both Stores</option>
              </select>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create User</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
