'use client';
import { useEffect, useState, useRef } from 'react';
import { productsApi } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';
import type { Product } from '@/types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProducts = () =>
    productsApi.getAll({ pageSize: 500 })
      .then(r => setProducts(r.products))
      .finally(() => setLoading(false));

  useEffect(() => { fetchProducts(); }, []);

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const token = getAdminToken() ?? '';
    try {
      if (editing.dbId > 0) {
        await productsApi.update(editing.dbId, {
          ...editing, stock: editing.stock, sku: editing.sku,
        }, token);
      }
      await fetchProducts();
      setEditing(null);
    } catch (e) {
      alert((e as Error).message);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    await productsApi.delete(id, getAdminToken() ?? '').catch(e => alert(e.message));
    await fetchProducts();
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const arr = Array.isArray(data) ? data : data.products ?? [];
        await productsApi.bulkSave(arr, getAdminToken() ?? '');
        await fetchProducts();
        alert(`Imported ${arr.length} products!`);
      } catch (e) {
        alert('Import failed: ' + (e as Error).message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleJsonImport} />
          <button onClick={() => fileRef.current?.click()}
            className="btn-secondary text-sm py-1.5">Import JSON</button>
          <button
            onClick={() => setEditing({
              dbId: 0, name: '', category: '', subcategory: '', price: 0,
              stock: 'In Stock', newest: 1, bestSeller: false, image: '',
            } as Product)}
            className="btn-primary text-sm py-1.5">+ Add Product</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-52" />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <span className="text-sm text-gray-500 self-center">{filtered.length} products</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {loading ? [...Array(10)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl aspect-square animate-pulse" />
        )) : filtered.map(p => (
          <div key={p.dbId} className="card group relative">
            <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
              {p.image
                ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                : <span className="text-4xl">👗</span>}
            </div>
            <div className="p-2">
              <p className="text-xs font-medium truncate">{p.name}</p>
              <p className="text-xs text-gray-400">{p.category}</p>
              <p className="text-xs font-bold text-[#8B1A1A]">₹{(p.discountPrice ?? p.price).toLocaleString('en-IN')}</p>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
              <button onClick={() => setEditing(p)}
                className="bg-white rounded-lg p-1 shadow text-xs">✏️</button>
              <button onClick={() => handleDelete(p.dbId)}
                className="bg-white rounded-lg p-1 shadow text-xs">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-4">
            <h3 className="font-bold mb-4">{editing.dbId > 0 ? 'Edit' : 'Add'} Product</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {([
                ['name', 'Name *'],
                ['sku', 'SKU'],
                ['category', 'Category *'],
                ['subcategory', 'Subcategory'],
                ['price', 'Price *'],
                ['discountPrice', 'Discount Price'],
                ['stock', 'Stock Status'],
                ['newest', 'Newest (sort)'],
                ['image', 'Image URL'],
              ] as [keyof Product, string][]).map(([field, label]) => (
                <div key={field} className={field === 'image' ? 'sm:col-span-2' : ''}>
                  <label className="text-xs text-gray-500 block mb-1">{label}</label>
                  <input
                    value={String(editing[field] ?? '')}
                    onChange={e => setEditing(ed => ed ? { ...ed, [field]: e.target.value } : ed)}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
              ))}
              <div className="flex items-center gap-2 sm:col-span-2">
                <input type="checkbox" id="bs" checked={editing.bestSeller}
                  onChange={e => setEditing(ed => ed ? { ...ed, bestSeller: e.target.checked } : ed)} />
                <label htmlFor="bs" className="text-sm">Best Seller</label>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editing.description ?? ''}
                  onChange={e => setEditing(ed => ed ? { ...ed, description: e.target.value } : ed)}
                  className="w-full border rounded-lg px-3 py-1.5 text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEditing(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm">
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
