'use client';
import { useEffect, useState, useRef } from 'react';
import { productsApi } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';
import type { Product } from '@/types';

const CATEGORIES = ['Saree','Women','Men','Nighty','Petticoat','Popline','Nighty Cloth','Best Sellers'];
const SIZES_PRESET = ['XS','S','M','L','XL','XXL','XXXL','Free Size','28','30','32','34','36','38','40','42'];
const COLORS_PRESET = ['Red','Blue','Green','Yellow','Pink','Orange','Purple','Grey','Black','White','Navy','Maroon'];

function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let cur = ''; let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (inQuote && line[i+1] === '"') { cur += '"'; i++; } else inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { result.push(cur); cur = ''; }
    else cur += ch;
  }
  result.push(cur);
  return result;
}

function exportProductsCSV(products: Product[]) {
  const header = ['name','category','subcategory','price','discountPrice','stock','sku','description','image','bestSeller','hsnCode','gstRate'];
  const rows = products.map(p => [
    p.name, p.category, p.subcategory ?? '', p.price, p.discountPrice ?? '',
    p.stock, p.sku ?? '', p.description ?? '', p.image ?? '', p.bestSeller ? 'true' : 'false',
    (p as any).hsnCode ?? '6211', (p as any).gstRate ?? 5,
  ]);
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `products-${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

const emptyProduct = (): Partial<Product> => ({
  name: '', category: 'Saree', subcategory: '', price: 0, discountPrice: undefined,
  stock: 'In Stock', sku: '', description: '', image: '', bestSeller: false,
  hsnCode: '6211', gstRate: 5,
} as any);

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [discountPct, setDiscountPct] = useState('');
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLLabelElement>(null);

  const fetchProducts = () =>
    productsApi.getAll({ pageSize: 500 })
      .then(r => setProducts(r.products))
      .finally(() => setLoading(false));

  useEffect(() => { fetchProducts(); }, []);

  const categories = CATEGORIES;
  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.subcategory ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const handleSave = async () => {
    if (!editing || !editing.name?.trim()) { alert('Product name is required.'); return; }
    if (!editing.price || editing.price <= 0) { alert('Price must be greater than 0.'); return; }
    setSaving(true);
    const token = getAdminToken() ?? '';
    try {
      if (isNew) {
        await productsApi.bulkSave([editing], token);
      } else if ((editing as Product).dbId > 0) {
        await productsApi.update((editing as Product).dbId, editing, token);
      }
      await fetchProducts();
      setEditing(null);
      setIsNew(false);
    } catch (e) { alert((e as Error).message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product permanently?')) return;
    await productsApi.delete(id, getAdminToken() ?? '').catch(e => alert(e.message));
    await fetchProducts();
  };

  const handleMarkAll = async (stock: 'In Stock' | 'Out of Stock') => {
    if (!confirm(`Mark all ${products.length} products as "${stock}"?`)) return;
    const token = getAdminToken() ?? '';
    for (const p of products) {
      await productsApi.update(p.dbId, { ...p, stock }, token).catch(() => {});
    }
    await fetchProducts();
    alert(`All products marked as ${stock}.`);
  };

  // CSV file handling
  const handleCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) { setBulkStatus('CSV is empty or has no data rows.'); return; }
      const headers = parseCsvRow(lines[0]).map(h => h.trim().toLowerCase());
      setCsvHeaders(headers);
      const rows = lines.slice(1).map(l => {
        const vals = parseCsvRow(l);
        return Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? '').trim()]));
      }).filter(r => Object.values(r).some(v => v));
      setCsvPreview(rows);
      setBulkStatus(`Preview: ${rows.length} products ready to import.`);
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (!csvPreview.length) return;
    setImporting(true);
    try {
      const products = csvPreview.map(row => ({
        name: row.name || row['product name'] || '',
        category: row.category || 'Saree',
        subcategory: row.subcategory || '',
        price: Number(row.price || row['mrp'] || 0),
        discountPrice: row.discountprice || row['discount price'] || row['sale price']
          ? Number(row.discountprice || row['discount price'] || row['sale price']) : null,
        stock: row.stock || 'In Stock',
        sku: row.sku || row['sku id'] || '',
        description: row.description || '',
        image: row.image || row['image url'] || '',
        bestSeller: ['true','yes','1'].includes((row.bestseller || row['best seller'] || '').toLowerCase()),
        hsnCode: row.hsncode || row['hsn code'] || '6211',
        gstRate: Number(row.gstrate || row['gst rate'] || 5),
      }));
      await productsApi.bulkSave(products, getAdminToken() ?? '');
      await fetchProducts();
      setCsvPreview([]); setCsvHeaders([]);
      setBulkStatus(`✅ Successfully imported ${products.length} products.`);
    } catch (e) { setBulkStatus('❌ Import failed: ' + (e as Error).message); }
    finally { setImporting(false); }
  };

  const openEdit = (p: Product) => {
    setEditing({ ...p });
    setIsNew(false);
    setDiscountPct(p.discountPrice && p.price > 0
      ? String(Math.round(((p.price - p.discountPrice) / p.price) * 100)) : '');
  };

  const openNew = () => {
    setEditing(emptyProduct());
    setIsNew(true);
    setDiscountPct('');
  };

  const handlePctChange = (pct: string) => {
    setDiscountPct(pct);
    const n = parseFloat(pct);
    if (!isNaN(n) && n > 0 && n < 100 && editing?.price) {
      setEditing(p => ({ ...p!, discountPrice: Math.round((editing!.price! * (1 - n / 100))) }));
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a1a' }}>Products ({filtered.length})</h1>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => handleMarkAll('In Stock')}
            style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: '8px', padding: '.5rem 1rem', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer' }}>
            ✅ Mark All In Stock
          </button>
          <button onClick={() => handleMarkAll('Out of Stock')}
            style={{ background: '#e67e22', color: '#fff', border: 'none', borderRadius: '8px', padding: '.5rem 1rem', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer' }}>
            🏖️ Mark All Out of Stock
          </button>
          <button onClick={() => exportProductsCSV(filtered)}
            style={{ background: '#555', color: '#fff', border: 'none', borderRadius: '8px', padding: '.5rem 1rem', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer' }}>
            ⬇️ Export CSV
          </button>
          <button onClick={() => setShowBulk(v => !v)}
            style={{ background: '#1565c0', color: '#fff', border: 'none', borderRadius: '8px', padding: '.5rem 1rem', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer' }}>
            📤 Bulk Import
          </button>
          <button onClick={openNew}
            style={{ background: '#a7354d', color: '#fff', border: 'none', borderRadius: '8px', padding: '.5rem 1.25rem', fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }}>
            + Add Product
          </button>
        </div>
      </div>

      {/* Bulk Import Panel */}
      {showBulk && (
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '.75rem' }}>📤 Bulk CSV/Excel Import</h3>
          <p style={{ fontSize: '.85rem', color: '#666', marginBottom: '1rem' }}>
            Upload a CSV file with columns: <code>name, category, subcategory, price, discountPrice, stock, sku, description, image, bestSeller, hsnCode, gstRate</code>
          </p>
          <label ref={dropRef} style={{
            display: 'block', border: '2px dashed #ddd', borderRadius: '12px', padding: '2rem',
            textAlign: 'center', cursor: 'pointer', marginBottom: '1rem',
            background: '#fafafa', transition: 'border-color .2s',
          }}
            onDragOver={e => { e.preventDefault(); if (dropRef.current) dropRef.current.style.borderColor = '#a7354d'; }}
            onDragLeave={() => { if (dropRef.current) dropRef.current.style.borderColor = '#ddd'; }}
            onDrop={e => { e.preventDefault(); if (dropRef.current) dropRef.current.style.borderColor = '#ddd'; const f = e.dataTransfer.files[0]; if (f) handleCsvFile(f); }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>📁</div>
            <p style={{ fontWeight: 600, marginBottom: '.25rem' }}>Drop CSV file here or click to browse</p>
            <p style={{ fontSize: '.82rem', color: '#888' }}>Supported: .csv files</p>
            <input ref={csvRef} type="file" accept=".csv,text/csv" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvFile(f); }} />
          </label>
          <input type="hidden" onClick={() => csvRef.current?.click()} />
          <button onClick={() => csvRef.current?.click()}
            style={{ background: '#f5f5f5', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.5rem 1.25rem', fontSize: '.88rem', fontWeight: 600, cursor: 'pointer', marginBottom: '1rem' }}>
            Browse File
          </button>

          {bulkStatus && (
            <p style={{ fontSize: '.88rem', color: bulkStatus.startsWith('✅') ? '#27ae60' : bulkStatus.startsWith('❌') ? '#c0392b' : '#555', marginBottom: '1rem', fontWeight: 600 }}>
              {bulkStatus}
            </p>
          )}

          {csvPreview.length > 0 && (
            <>
              <div style={{ overflowX: 'auto', marginBottom: '1rem', maxHeight: '200px', border: '1px solid #eee', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.78rem' }}>
                  <thead style={{ background: '#f9f9f9', position: 'sticky', top: 0 }}>
                    <tr>{csvHeaders.map(h => <th key={h} style={{ padding: '.4rem .75rem', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600, color: '#555' }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {csvPreview.slice(0, 10).map((row, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #f5f5f5' }}>
                        {csvHeaders.map(h => <td key={h} style={{ padding: '.4rem .75rem', whiteSpace: 'nowrap', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row[h]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvPreview.length > 10 && <p style={{ fontSize: '.8rem', color: '#888', marginBottom: '.75rem' }}>Showing first 10 of {csvPreview.length} rows</p>}
              <button onClick={handleBulkImport} disabled={importing}
                style={{ background: '#a7354d', color: '#fff', border: 'none', borderRadius: '8px', padding: '.65rem 1.5rem', fontSize: '.9rem', fontWeight: 600, cursor: importing ? 'not-allowed' : 'pointer', opacity: importing ? .7 : 1 }}>
                {importing ? 'Importing...' : `Apply Import (${csvPreview.length} products)`}
              </button>
            </>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', marginBottom: '1rem', alignItems: 'center' }}>
        <input placeholder="Search name, SKU, subcategory..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ border: '1.5px solid #ddd', borderRadius: '8px', padding: '.5rem .75rem', fontSize: '.88rem', width: '280px' }} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ border: '1.5px solid #ddd', borderRadius: '8px', padding: '.5rem .75rem', fontSize: '.88rem' }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Product Table */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
            <thead style={{ background: '#f9f9f9' }}>
              <tr>
                {['Image','SKU','Name','Category','Price','Discount','Stock','Best Seller','Actions'].map(h => (
                  <th key={h} style={{ padding: '.75rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '.72rem', color: '#888', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>Loading products…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>No products found.</td></tr>
              ) : filtered.map((p, i) => (
                <tr key={p.dbId} style={{ borderTop: i > 0 ? '1px solid #f5f5f5' : undefined }}>
                  <td style={{ padding: '.65rem 1rem' }}>
                    {p.image
                      ? <img src={p.image} alt={p.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '6px' }} />
                      : <div style={{ width: 48, height: 48, background: '#f5f5f5', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>👗</div>}
                  </td>
                  <td style={{ padding: '.65rem 1rem', fontFamily: 'monospace', fontSize: '.75rem', color: '#888' }}>{p.sku || '—'}</td>
                  <td style={{ padding: '.65rem 1rem', fontWeight: 500, maxWidth: '200px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    {p.subcategory && <div style={{ fontSize: '.72rem', color: '#aaa' }}>{p.subcategory}</div>}
                  </td>
                  <td style={{ padding: '.65rem 1rem', fontSize: '.8rem' }}>{p.category}</td>
                  <td style={{ padding: '.65rem 1rem', fontWeight: 600 }}>₹{p.price.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '.65rem 1rem', fontSize: '.8rem', color: p.discountPrice ? '#27ae60' : '#ccc' }}>
                    {p.discountPrice ? `₹${p.discountPrice.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td style={{ padding: '.65rem 1rem' }}>
                    <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '.2rem .55rem', borderRadius: '10px',
                      background: p.stock === 'In Stock' ? '#e8f5e9' : '#fdecea',
                      color: p.stock === 'In Stock' ? '#2e7d32' : '#c62828' }}>
                      {p.stock}
                    </span>
                  </td>
                  <td style={{ padding: '.65rem 1rem', textAlign: 'center' }}>
                    {p.bestSeller ? '⭐' : '—'}
                  </td>
                  <td style={{ padding: '.65rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '.4rem' }}>
                      <button onClick={() => openEdit(p)}
                        style={{ color: '#1565c0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.82rem', fontWeight: 600 }}>Edit</button>
                      <button onClick={() => handleDelete(p.dbId)}
                        style={{ color: '#c62828', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.82rem', fontWeight: 600 }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 300, padding: '1rem', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '700px', marginTop: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.15rem' }}>
              {isNew ? '➕ Add New Product' : '✏️ Edit Product'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* SKU */}
              <div>
                <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>SKU ID</label>
                <input value={editing.sku ?? ''} onChange={e => setEditing(p => ({ ...p!, sku: e.target.value }))}
                  placeholder="MFH1001"
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.88rem', boxSizing: 'border-box' }} />
              </div>
              {/* HSN Code */}
              <div>
                <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>HSN Code</label>
                <input value={(editing as any).hsnCode ?? '6211'} onChange={e => setEditing(p => ({ ...p!, hsnCode: e.target.value } as any))}
                  placeholder="6211"
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.88rem', boxSizing: 'border-box' }} />
              </div>
              {/* Name */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Product Name *</label>
                <input value={editing.name ?? ''} onChange={e => setEditing(p => ({ ...p!, name: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.88rem', boxSizing: 'border-box' }} />
              </div>
              {/* Category */}
              <div>
                <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Category *</label>
                <select value={editing.category ?? 'Saree'} onChange={e => setEditing(p => ({ ...p!, category: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.88rem' }}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              {/* Subcategory */}
              <div>
                <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Subcategory</label>
                <input value={editing.subcategory ?? ''} onChange={e => setEditing(p => ({ ...p!, subcategory: e.target.value }))}
                  placeholder="Optional (e.g. Cotton, Designer)"
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.88rem', boxSizing: 'border-box' }} />
              </div>
              {/* Price */}
              <div>
                <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Price (₹) *</label>
                <input type="number" min="1" value={editing.price ?? ''} onChange={e => setEditing(p => ({ ...p!, price: Number(e.target.value) }))}
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.88rem', boxSizing: 'border-box' }} />
              </div>
              {/* Discount % */}
              <div>
                <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Discount % <span style={{ fontWeight: 400, color: '#888' }}>(auto-calculates price)</span></label>
                <input type="number" min="1" max="99" value={discountPct} onChange={e => handlePctChange(e.target.value)}
                  placeholder="e.g. 20"
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.88rem', boxSizing: 'border-box' }} />
              </div>
              {/* Discount Price */}
              <div>
                <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Discount Price (₹)</label>
                <input type="number" min="1" value={editing.discountPrice ?? ''} onChange={e => setEditing(p => ({ ...p!, discountPrice: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="Optional"
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.88rem', boxSizing: 'border-box' }} />
              </div>
              {/* GST Rate */}
              <div>
                <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>GST Rate</label>
                <select value={(editing as any).gstRate ?? 5} onChange={e => setEditing(p => ({ ...p!, gstRate: Number(e.target.value) } as any))}
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.88rem' }}>
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                </select>
              </div>
              {/* Stock */}
              <div>
                <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Stock Status</label>
                <select value={editing.stock ?? 'In Stock'} onChange={e => setEditing(p => ({ ...p!, stock: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.88rem' }}>
                  <option>In Stock</option>
                  <option>Out of Stock</option>
                  <option>Limited Stock</option>
                </select>
              </div>
              {/* Image URL */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Product Image URL</label>
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                  <input value={editing.image ?? ''} onChange={e => setEditing(p => ({ ...p!, image: e.target.value }))}
                    placeholder="https://..."
                    style={{ flex: 1, border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.88rem', boxSizing: 'border-box' }} />
                  {editing.image && (
                    <img src={editing.image} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                  )}
                </div>
              </div>
              {/* Description */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Description</label>
                <textarea value={editing.description ?? ''} onChange={e => setEditing(p => ({ ...p!, description: e.target.value }))}
                  rows={3} placeholder="Product details, fabric, use case, styling notes..."
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.88rem', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              {/* Best Seller */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <input type="checkbox" id="chkBestSeller" checked={editing.bestSeller ?? false}
                  onChange={e => setEditing(p => ({ ...p!, bestSeller: e.target.checked }))} style={{ width: '16px', height: '16px' }} />
                <label htmlFor="chkBestSeller" style={{ fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }}>
                  ⭐ Mark as Best Seller
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => { setEditing(null); setIsNew(false); }}
                style={{ flex: 1, background: '#f5f5f5', color: '#555', border: 'none', borderRadius: '8px', padding: '.65rem', cursor: 'pointer', fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 2, background: '#a7354d', color: '#fff', border: 'none', borderRadius: '8px', padding: '.65rem', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: saving ? .7 : 1 }}>
                {saving ? 'Saving...' : isNew ? 'Add Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
