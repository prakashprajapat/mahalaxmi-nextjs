'use client';
import { useEffect, useState, useRef } from 'react';
import { productsApi } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';
import type { Product } from '@/types';

function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let cur = ''; let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (inQuote && line[i + 1] === '"') { cur += '"'; i++; } else inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { result.push(cur); cur = ''; }
    else cur += ch;
  }
  result.push(cur);
  return result;
}

function exportProductsCSV(products: Product[]) {
  const header = ['name', 'category', 'subcategory', 'price', 'discountPrice', 'stock', 'sku', 'description', 'image', 'bestSeller'];
  const rows = products.map(p => [
    p.name, p.category, p.subcategory ?? '', p.price, p.discountPrice ?? '', p.stock, p.sku ?? '', p.description ?? '', p.image ?? '', p.bestSeller ? 'true' : 'false',
  ]);
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  // CSV Import state
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [showCsvPreview, setShowCsvPreview] = useState(false);

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
        await productsApi.update(editing.dbId, { ...editing, stock: editing.stock, sku: editing.sku }, token);
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
      } catch (e) { alert('Import failed: ' + (e as Error).message); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCsvRead = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { alert('CSV must have a header row and at least one data row.'); return; }
      const headers = parseCsvRow(lines[0]);
      const rows = lines.slice(1).map(line => {
        const vals = parseCsvRow(line);
        return Object.fromEntries(headers.map((h, i) => [h.trim(), vals[i]?.trim() ?? '']));
      });
      setCsvHeaders(headers.map(h => h.trim()));
      setCsvPreview(rows);
      setShowCsvPreview(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleApplyCsvImport = async () => {
    setImporting(true);
    try {
      const prods = csvPreview.map(row => ({
        name: row.name ?? row.Name ?? '',
        category: row.category ?? row.Category ?? '',
        subcategory: row.subcategory ?? '',
        price: parseFloat(row.price ?? row.Price ?? '0') || 0,
        discountPrice: row.discountPrice ? parseFloat(row.discountPrice) : undefined,
        stock: row.stock ?? 'In Stock',
        sku: row.sku ?? '',
        description: row.description ?? '',
        image: row.image ?? '',
        bestSeller: (row.bestSeller ?? '').toLowerCase() === 'true',
      })).filter(p => p.name);
      await productsApi.bulkSave(prods, getAdminToken() ?? '');
      await fetchProducts();
      setShowCsvPreview(false); setCsvPreview([]); setCsvHeaders([]);
      alert(`Imported ${prods.length} products from CSV!`);
    } catch (e) { alert('CSV import failed: ' + (e as Error).message); }
    finally { setImporting(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a1a' }}>Products</h1>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          {/* Export CSV */}
          <button onClick={() => exportProductsCSV(filtered)}
            style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: '8px', padding: '.45rem 1rem', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer' }}>
            ⬇️ Export CSV
          </button>
          {/* Import CSV */}
          <input ref={csvRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCsvRead} />
          <button onClick={() => csvRef.current?.click()}
            style={{ background: '#2980b9', color: '#fff', border: 'none', borderRadius: '8px', padding: '.45rem 1rem', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer' }}>
            ⬆️ Import CSV
          </button>
          {/* Import JSON */}
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleJsonImport} />
          <button onClick={() => fileRef.current?.click()}
            style={{ background: '#f5f5f5', color: '#555', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.45rem 1rem', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer' }}>
            Import JSON
          </button>
          <button
            onClick={() => setEditing({ dbId: 0, name: '', category: '', subcategory: '', price: 0, stock: 'In Stock', newest: 1, bestSeller: false, image: '' } as Product)}
            style={{ background: '#a7354d', color: '#fff', border: 'none', borderRadius: '8px', padding: '.45rem 1rem', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer' }}>
            + Add Product
          </button>
        </div>
      </div>

      {/* CSV Preview */}
      {showCsvPreview && csvPreview.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,.07)', marginBottom: '1.25rem', border: '2px solid #2980b9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '.95rem' }}>CSV Preview — {csvPreview.length} rows</h3>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button onClick={handleApplyCsvImport} disabled={importing}
                style={{ background: '#a7354d', color: '#fff', border: 'none', borderRadius: '8px', padding: '.45rem 1.25rem', fontSize: '.85rem', fontWeight: 600, cursor: importing ? 'not-allowed' : 'pointer', opacity: importing ? .7 : 1 }}>
                {importing ? 'Importing…' : 'Apply Import'}
              </button>
              <button onClick={() => { setShowCsvPreview(false); setCsvPreview([]); }}
                style={{ background: '#eee', color: '#555', border: 'none', borderRadius: '8px', padding: '.45rem 1rem', fontSize: '.85rem', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '260px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8rem' }}>
              <thead style={{ background: '#f0f0f0', position: 'sticky', top: 0 }}>
                <tr>
                  {csvHeaders.slice(0, 8).map(h => (
                    <th key={h} style={{ padding: '.5rem .75rem', textAlign: 'left', fontWeight: 600, color: '#555', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                  {csvHeaders.length > 8 && <th style={{ padding: '.5rem .75rem', color: '#aaa' }}>+{csvHeaders.length - 8} more</th>}
                </tr>
              </thead>
              <tbody>
                {csvPreview.slice(0, 10).map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f5f5f5' }}>
                    {csvHeaders.slice(0, 8).map(h => (
                      <td key={h} style={{ padding: '.45rem .75rem', color: '#444', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row[h] ?? ''}
                      </td>
                    ))}
                    {csvHeaders.length > 8 && <td style={{ padding: '.45rem .75rem', color: '#aaa' }}>…</td>}
                  </tr>
                ))}
                {csvPreview.length > 10 && (
                  <tr><td colSpan={Math.min(csvHeaders.length, 9)} style={{ padding: '.5rem .75rem', color: '#aaa', fontStyle: 'italic' }}>…and {csvPreview.length - 10} more rows</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ border: '1.5px solid #ddd', borderRadius: '8px', padding: '.5rem .75rem', fontSize: '.88rem', width: '210px' }} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ border: '1.5px solid #ddd', borderRadius: '8px', padding: '.5rem .75rem', fontSize: '.88rem' }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <span style={{ fontSize: '.85rem', color: '#888' }}>{filtered.length} products</span>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '.75rem' }}>
        {loading ? [...Array(10)].map((_, i) => (
          <div key={i} style={{ background: '#f5f5f5', borderRadius: '12px', aspectRatio: '1', animation: 'pulse 1.5s infinite' }} />
        )) : filtered.map(p => (
          <div key={p.dbId} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ aspectRatio: '1', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {p.image
                ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '2.5rem' }}>👗</span>}
            </div>
            <div style={{ padding: '.5rem .75rem' }}>
              <p style={{ fontSize: '.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
              <p style={{ fontSize: '.75rem', color: '#888' }}>{p.category}</p>
              <p style={{ fontSize: '.8rem', fontWeight: 700, color: '#a7354d' }}>₹{(p.discountPrice ?? p.price).toLocaleString('en-IN')}</p>
            </div>
            <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', gap: '4px', opacity: 0, transition: 'opacity .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}>
              <button onClick={() => setEditing(p)}
                style={{ background: '#fff', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,.15)', fontSize: '.82rem' }}>✏️</button>
              <button onClick={() => handleDelete(p.dbId)}
                style={{ background: '#fff', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,.15)', fontSize: '.82rem' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '560px', margin: 'auto' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>{editing.dbId > 0 ? 'Edit' : 'Add'} Product</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', fontSize: '.88rem' }}>
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
                <div key={field} style={{ gridColumn: field === 'image' ? '1 / -1' : undefined }}>
                  <label style={{ fontSize: '.78rem', color: '#888', display: 'block', marginBottom: '.25rem' }}>{label}</label>
                  <input
                    value={String(editing[field] ?? '')}
                    onChange={e => setEditing(ed => ed ? { ...ed, [field]: e.target.value } : ed)}
                    style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '7px', padding: '.5rem .65rem', fontSize: '.88rem', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', gridColumn: '1 / -1' }}>
                <input type="checkbox" id="bs" checked={editing.bestSeller}
                  onChange={e => setEditing(ed => ed ? { ...ed, bestSeller: e.target.checked } : ed)} />
                <label htmlFor="bs" style={{ fontSize: '.88rem' }}>Best Seller</label>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '.78rem', color: '#888', display: 'block', marginBottom: '.25rem' }}>Description</label>
                <textarea
                  rows={3}
                  value={editing.description ?? ''}
                  onChange={e => setEditing(ed => ed ? { ...ed, description: e.target.value } : ed)}
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '7px', padding: '.5rem .65rem', fontSize: '.88rem', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.25rem' }}>
              <button onClick={() => setEditing(null)}
                style={{ flex: 1, background: '#f5f5f5', color: '#555', border: 'none', borderRadius: '8px', padding: '.65rem', cursor: 'pointer', fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, background: '#a7354d', color: '#fff', border: 'none', borderRadius: '8px', padding: '.65rem', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: saving ? .7 : 1 }}>
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
