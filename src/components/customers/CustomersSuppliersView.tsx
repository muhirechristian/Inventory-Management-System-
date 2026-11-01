import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Phone, Mail, MapPin, Building, ArrowDownUp } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { Dialog } from '../ui/Dialog.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table.tsx';
import { CustomerSupplier, User, formatCurrency, formatInKigali } from '../../types/index.ts';

export function CustomersSuppliersView({ user }: { user: User }) {
  const [list, setList] = useState<CustomerSupplier[]>([]);
  const [activeTab, setActiveTab] = useState<'customer' | 'supplier'>('customer');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    balance: '0',
    notes: ''
  });

  const fetchDirectory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers-suppliers');
      const data = await res.json();
      if (data.success) {
        setList(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      balance: '0',
      notes: ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      const res = await fetch('/api/customers-suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          ...formData,
          balance: Number(formData.balance) || 0
        })
      });
      if (res.ok) {
        setModalOpen(false);
        fetchDirectory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = list.filter(item => {
    const matchType = item.type === activeTab;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.phone && item.phone.includes(searchQuery)) ||
      (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#14213D]">Customers & Suppliers Directory</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Maintain verified contractor clients, individual buyers, and wholesale distributors.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="text-xs font-semibold">
          <Plus className="size-4 mr-1" /> Add {activeTab === 'customer' ? 'Customer' : 'Supplier'}
        </Button>
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('customer')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'customer' ? 'bg-[#14213D] text-white shadow-xs' : 'text-[#64748B] hover:bg-[#F1F5F9]'
            }`}
          >
            Customers ({list.filter(i => i.type === 'customer').length})
          </button>
          <button
            onClick={() => setActiveTab('supplier')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'supplier' ? 'bg-[#14213D] text-white shadow-xs' : 'text-[#64748B] hover:bg-[#F1F5F9]'
            }`}
          >
            Suppliers & Vendors ({list.filter(i => i.type === 'supplier').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab === 'customer' ? 'customers' : 'suppliers'}...`}
            className="w-full rounded-lg border border-[#CBD5E1] bg-transparent pl-9 pr-3 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name / Organization</TableHead>
              <TableHead>Contact Phone</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Location / Address</TableHead>
              <TableHead className="text-right">Outstanding Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-xs text-[#64748B]">
                  No {activeTab}s found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <p className="font-semibold text-xs text-[#0F172A]">{item.name}</p>
                    {item.notes && <p className="text-[11px] text-[#64748B]">{item.notes}</p>}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-[#64748B]">{item.phone || '-'}</TableCell>
                  <TableCell className="text-xs text-[#64748B]">{item.email || '-'}</TableCell>
                  <TableCell className="text-xs text-[#64748B]">{item.address || '-'}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-xs text-[#14213D]">
                    {formatCurrency(item.balance || 0)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={`Add New ${activeTab === 'customer' ? 'Customer' : 'Supplier'}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-3.5">
          <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
            {activeTab === 'customer' ? 'Customer Name / Entity' : 'Supplier Company Name'}
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-[#CBD5E1] px-3 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            />
          </label>

          <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
            Phone Number
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+250 78..."
              className="w-full rounded-lg border border-[#CBD5E1] px-3 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            />
          </label>

          <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
            Email Address
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border border-[#CBD5E1] px-3 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            />
          </label>

          <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
            Address / City Sector
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Gisozi, Nyarugenge"
              className="w-full rounded-lg border border-[#CBD5E1] px-3 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            />
          </label>

          <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
            Initial Balance / Credit (Rwf)
            <input
              type="number"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              className="w-full rounded-lg border border-[#CBD5E1] px-3 py-1.5 text-xs outline-none font-mono focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Record</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
