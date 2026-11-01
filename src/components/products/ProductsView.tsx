import React, { useState, useEffect, useMemo } from 'react';
import {
  PackageSearch,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Printer,
  Edit2,
  Trash2,
  AlertTriangle,
  Layers,
  CheckCircle,
  XCircle,
  ClipboardList,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { Dialog } from '../ui/Dialog.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table.tsx';
import { Product, PackUnit, StoreKey, STORE_LABELS, User, formatCurrency } from '../../types/index.ts';

interface ProductsViewProps {
  store: StoreKey;
  user: User;
}

export function ProductsView({ store, user }: ProductsViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [reviewRequestsOpen, setReviewRequestsOpen] = useState(false);
  const [productRequests, setProductRequests] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Building Materials',
    unit: 'pcs',
    costPrice: '',
    sellingPrice: '',
    minStock: '5',
    quantity: '0',
    packUnits: [] as PackUnit[]
  });

  const [newPack, setNewPack] = useState({ name: '', factor: '', price: '' });

  const categories = [
    'All',
    'Building Materials',
    'Roofing & Metals',
    'Paints & Finishes',
    'Plumbing',
    'Electricals',
    'Fasteners & Hardware',
    'Tools & Equipment'
  ];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?store=${store}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch(`/api/product-requests?store=${store}`);
      const data = await res.json();
      if (data.success) {
        setProductRequests(data.data || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchProducts();
    if (user.isAdmin) fetchRequests();
  }, [store]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      name: '',
      category: 'Building Materials',
      unit: 'pcs',
      costPrice: '',
      sellingPrice: '',
      minStock: '5',
      quantity: '0',
      packUnits: []
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      name: p.name,
      category: p.category,
      unit: p.unit,
      costPrice: String(p.costPrice || ''),
      sellingPrice: String(p.sellingPrice || p.price || ''),
      minStock: String(p.threshold || p.minStock || 5),
      quantity: String(p.quantity || 0),
      packUnits: p.packUnits || []
    });
    setModalOpen(true);
  };

  const handleAddPackUnit = () => {
    if (!newPack.name || !newPack.factor) return;
    setFormData(prev => ({
      ...prev,
      packUnits: [
        ...prev.packUnits,
        {
          name: newPack.name.trim(),
          factor: Number(newPack.factor),
          price: Number(newPack.price) || 0
        }
      ]
    }));
    setNewPack({ name: '', factor: '', price: '' });
  };

  const handleRemovePackUnit = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      packUnits: prev.packUnits.filter((_, i) => i !== idx)
    }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const payload = {
      store,
      sku: formData.sku,
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      costPrice: Number(formData.costPrice) || 0,
      price: Number(formData.sellingPrice) || 0,
      sellingPrice: Number(formData.sellingPrice) || 0,
      minStock: Number(formData.minStock) || 5,
      quantity: Number(formData.quantity) || 0,
      packUnits: formData.packUnits
    };

    try {
      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setModalOpen(false);
          fetchProducts();
        }
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setModalOpen(false);
          fetchProducts();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the catalogue? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchQuery =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;

      let matchStock = true;
      if (stockFilter === 'low') {
        matchStock = p.quantity <= (p.threshold || p.minStock || 5) && p.quantity > 0;
      } else if (stockFilter === 'out') {
        matchStock = p.quantity <= 0;
      }

      return matchQuery && matchCategory && matchStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['SKU', 'Product Name', 'Category', 'Unit', 'Cost Price (Rwf)', 'Selling Price (Rwf)', 'Stock Quantity', 'Min Threshold'];
    const rows = filteredProducts.map(p => [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.unit,
      p.costPrice,
      p.sellingPrice || p.price,
      p.quantity,
      p.threshold || p.minStock
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Codev_Products_${STORE_LABELS[store]}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintCatalog = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#14213D]">Inventory Catalogue</h1>
            <span className="rounded-md bg-[#2563EB]/10 px-2 py-0.5 text-xs font-semibold text-[#2563EB]">
              {STORE_LABELS[store]}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Manage product units, selling prices, minimum stock thresholds and conversion factors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs">
            <FileSpreadsheet className="size-3.5 mr-1 text-[#16A34A]" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrintCatalog} className="text-xs">
            <Printer className="size-3.5 mr-1" />
            Print Catalogue
          </Button>

          {user.isAdmin ? (
            <>
              {productRequests.filter(r => r.status === 'pending').length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewRequestsOpen(true)}
                  className="border-[#2563EB] text-[#2563EB] bg-[#2563EB]/10 text-xs font-bold"
                >
                  <ClipboardList className="size-3.5 mr-1" />
                  Requests ({productRequests.filter(r => r.status === 'pending').length})
                </Button>
              )}
              <Button size="sm" onClick={handleOpenAdd} className="text-xs">
                <Plus className="size-3.5 mr-1" /> Add Product
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => { handleOpenAdd(); setRequestModalOpen(true); }} className="text-xs">
              <Plus className="size-3.5 mr-1" /> Request New Product
            </Button>
          )}
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, category, or SKU..."
              className="w-full rounded-lg border border-[#CBD5E1] bg-transparent pl-9 pr-4 py-2 text-sm outline-none focus-visible:border-[#2563EB] focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            />
          </div>

          {/* Stock status filter buttons */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              onClick={() => setStockFilter('all')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer transition ${stockFilter === 'all' ? 'bg-[#14213D] text-white' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'}`}
            >
              All Items ({products.length})
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer transition ${stockFilter === 'low' ? 'bg-[#F59E0B] text-white font-semibold' : 'bg-amber-50 text-[#F59E0B] hover:bg-amber-100'}`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStockFilter('out')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer transition ${stockFilter === 'out' ? 'bg-[#DC2626] text-white font-semibold' : 'bg-red-50 text-[#DC2626] hover:bg-red-100'}`}
            >
              Out of Stock
            </button>
          </div>
        </div>

        {/* Category horizontal scrolling bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-[#E2E8F0]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#2563EB]/10 text-[#2563EB] font-bold border border-[#2563EB]/30'
                  : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product / SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Base Unit</TableHead>
              {user.isAdmin && <TableHead className="text-right">Cost Price</TableHead>}
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead className="text-center">Stock Level</TableHead>
              <TableHead>Threshold</TableHead>
              <TableHead>Pack Options</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-sm text-[#64748B]">
                  No products found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((p) => {
                const threshold = p.threshold || p.minStock || 5;
                const isOutOfStock = p.quantity <= 0;
                const isLowStock = p.quantity > 0 && p.quantity <= threshold;

                return (
                  <TableRow key={p._id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm text-[#0F172A]">{p.name}</p>
                        <p className="text-[11px] font-mono text-[#64748B]">{p.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="rounded bg-[#F1F5F9] px-2 py-0.5 font-medium text-[#0F172A]">{p.category}</span>
                    </TableCell>
                    <TableCell className="text-xs uppercase font-mono text-[#64748B]">{p.unit}</TableCell>
                    {user.isAdmin && (
                      <TableCell className="text-right text-xs font-mono text-[#64748B]">
                        {formatCurrency(p.costPrice)}
                      </TableCell>
                    )}
                    <TableCell className="text-right text-xs font-bold font-mono text-[#14213D]">
                      {formatCurrency(p.sellingPrice || p.price)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-bold text-sm ${isOutOfStock ? 'text-[#DC2626]' : isLowStock ? 'text-[#F59E0B]' : 'text-[#16A34A]'}`}>
                          {p.quantity} {p.unit}
                        </span>
                        {isOutOfStock ? (
                          <Badge variant="destructive" className="mt-0.5 text-[9px] py-0 px-1">Out of Stock</Badge>
                        ) : isLowStock ? (
                          <Badge variant="warning" className="mt-0.5 text-[9px] py-0 px-1">Low Stock</Badge>
                        ) : (
                          <Badge variant="success" className="mt-0.5 text-[9px] py-0 px-1">In Stock</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-[#64748B]">
                      min {threshold} {p.unit}
                    </TableCell>
                    <TableCell className="text-xs">
                      {p.packUnits && p.packUnits.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.packUnits.map((pack, idx) => (
                            <span key={idx} className="rounded border border-blue-200 bg-blue-50/70 px-1.5 py-0.5 text-[10px] text-blue-900 font-medium">
                              1 {pack.name} = {pack.factor} {p.unit} ({formatCurrency(pack.price)})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#64748B] text-[11px]">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="rounded-md p-1.5 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition cursor-pointer"
                          title="Edit product"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        {user.isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDelete(p._id, p.name)}
                            className="rounded-md p-1.5 text-[#64748B] hover:bg-red-50 hover:text-[#DC2626] transition cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit Product Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingProduct ? 'Edit Product Details' : 'Add New Product'}
        description={`Configure product SKU, prices, stock level, and pack units for ${STORE_LABELS[store]}.`}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
              Product SKU / Code
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full rounded-lg border border-[#CBD5E1] bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              />
            </label>

            <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
              Category
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-[#CBD5E1] bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
            Product Full Name & Specification
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Tororo Cement 32.5R 50kg, Deformed Bar T12 12m"
              className="w-full rounded-lg border border-[#CBD5E1] bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            />
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
              Base Unit
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="pcs, bags, tins"
                className="w-full rounded-lg border border-[#CBD5E1] bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              />
            </label>

            <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
              Cost Price (Rwf)
              <input
                type="number"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="11500"
                className="w-full rounded-lg border border-[#CBD5E1] bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              />
            </label>

            <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
              Selling Price (Rwf)
              <input
                type="number"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                placeholder="13500"
                className="w-full rounded-lg border border-[#CBD5E1] bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              />
            </label>

            <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
              Min Alert Stock
              <input
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                placeholder="5"
                className="w-full rounded-lg border border-[#CBD5E1] bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              />
            </label>
          </div>

          <label className="block space-y-1 text-xs font-semibold text-[#0F172A]">
            Current Quantity in {STORE_LABELS[store]} ({formData.unit || 'units'})
            <input
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full rounded-lg border border-[#CBD5E1] bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            />
          </label>

          {/* Pack Units Builder */}
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#14213D]">Pack & Bundle Units (Optional)</p>
                <p className="text-[11px] text-[#64748B]">Sell in boxes, bundles or pallets with automated multiplier.</p>
              </div>
            </div>

            {formData.packUnits.length > 0 && (
              <div className="space-y-1.5">
                {formData.packUnits.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg bg-white p-2 border border-[#E2E8F0] text-xs">
                    <div>
                      <span className="font-semibold text-[#0F172A]">1 {p.name}</span> = <span className="font-mono text-[#2563EB]">{p.factor} {formData.unit}</span>
                      <span className="ml-3 text-[#64748B] font-mono">Price: {formatCurrency(p.price)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePackUnit(idx)}
                      className="text-[#DC2626] hover:text-red-700 text-xs font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E2E8F0]">
              <input
                type="text"
                placeholder="Pack name (e.g. carton)"
                value={newPack.name}
                onChange={(e) => setNewPack({ ...newPack, name: e.target.value })}
                className="rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-xs outline-none"
              />
              <input
                type="number"
                placeholder="Factor (e.g. 20)"
                value={newPack.factor}
                onChange={(e) => setNewPack({ ...newPack, factor: e.target.value })}
                className="rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-xs outline-none"
              />
              <input
                type="number"
                placeholder="Price (Rwf)"
                value={newPack.price}
                onChange={(e) => setNewPack({ ...newPack, price: e.target.value })}
                className="rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-xs outline-none"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddPackUnit} className="text-xs">
                + Add Pack
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Admin Review Requests Modal */}
      <Dialog
        open={reviewRequestsOpen}
        onOpenChange={setReviewRequestsOpen}
        title="Pending Product Requests from Staff"
        description="Review and approve new products or catalogue modifications suggested by branch employees."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3">
          {productRequests.filter(r => r.status === 'pending').length === 0 ? (
            <p className="py-8 text-center text-xs text-[#64748B]">No pending requests.</p>
          ) : (
            productRequests.filter(r => r.status === 'pending').map((req) => (
              <div key={req._id} className="rounded-xl border border-[#E2E8F0] p-4 bg-[#F8FAFC] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-[#14213D]">{req.name}</span>
                    <span className="ml-2 rounded bg-[#2563EB]/10 px-2 py-0.5 text-[10px] font-bold text-[#2563EB]">{req.category}</span>
                  </div>
                  <span className="text-[11px] text-[#64748B]">Requested by {req.requestedBy}</span>
                </div>
                <div className="text-xs text-[#64748B] grid grid-cols-3 gap-2">
                  <p>Selling Price: <span className="font-bold text-[#0F172A]">{formatCurrency(req.price)}</span></p>
                  <p>Cost Price: <span className="font-bold text-[#0F172A]">{formatCurrency(req.costPrice)}</span></p>
                  <p>Initial Stock: <span className="font-bold text-[#0F172A]">{req.quantity} {req.unit}</span></p>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-[#DC2626] border-red-200 hover:bg-red-50"
                    onClick={() => {
                      alert('Request declined.');
                      setReviewRequestsOpen(false);
                    }}
                  >
                    <XCircle className="size-3.5 mr-1" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs"
                    onClick={async () => {
                      await fetch('/api/products', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          store,
                          name: req.name,
                          category: req.category,
                          unit: req.unit,
                          costPrice: req.costPrice,
                          price: req.price,
                          quantity: req.quantity,
                          minStock: req.minStock
                        })
                      });
                      alert(`Product "${req.name}" approved and added to catalogue.`);
                      setReviewRequestsOpen(false);
                      fetchProducts();
                    }}
                  >
                    <Check className="size-3.5 mr-1" /> Approve & Add
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Dialog>
    </div>
  );
}
