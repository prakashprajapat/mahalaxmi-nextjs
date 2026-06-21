'use client';
import { useEffect, useState } from 'react';
import { ordersApi } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';
import type { Order } from '@/types';

const ALL_STATUSES = [
  'Order Received', 'Pending', 'Order Packed', 'Ready for Shipping',
  'Shipped', 'Transit', 'Delivered', 'Return Requested', 'Cancelled',
];

function exportCSV(orders: Order[]) {
  const header = ['Order ID', 'Date', 'Customer', 'Phone', 'Email', 'City', 'State', 'Total', 'Method', 'Status', 'AWB'];
  const rows = orders.map(o => [
    o.id,
    new Date(o.placedAt ?? o.createdAt).toLocaleDateString('en-IN'),
    o.customerName ?? '',
    o.customerPhone ?? '',
    (o as any).customerEmail ?? '',
    (o as any).shippingCity ?? '',
    (o as any).shippingState ?? '',
    o.total,
    o.method,
    o.status,
    o.awb ?? '',
  ]);
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [awb, setAwb] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = () => {
    const token = getAdminToken() ?? '';
    ordersApi.getAll(undefined, token)
      .then(r => setOrders(r.orders))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.customerName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (o.customerPhone ?? '').includes(search);
    const matchStatus = !filter || o.status === filter;
    return matchSearch && matchStatus;
  });

  const handleUpdate = async () => {
    if (!selected || !newStatus) return;
    setUpdating(true);
    try {
      await ordersApi.updateStatus({ orderId: selected.id, status: newStatus, awb }, getAdminToken() ?? '');
      fetchOrders();
      setSelected(null);
    } catch (e) {
      alert((e as Error).message);
    } finally { setUpdating(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a1a' }}>Orders</h1>
        <button
          onClick={() => exportCSV(filtered)}
          style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: '8px', padding: '.5rem 1.25rem', fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }}>
          ⬇️ Export CSV ({filtered.length})
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', marginBottom: '1rem', alignItems: 'center' }}>
        <input
          placeholder="Search by ID, name, phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: '1.5px solid #ddd', borderRadius: '8px', padding: '.5rem .75rem', fontSize: '.88rem', width: '260px' }}
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ border: '1.5px solid #ddd', borderRadius: '8px', padding: '.5rem .75rem', fontSize: '.88rem' }}>
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <span style={{ fontSize: '.85rem', color: '#888' }}>{filtered.length} orders</span>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' }}>
            <thead style={{ background: '#f9f9f9' }}>
              <tr>
                {['Order ID', 'Date', 'Customer', 'Phone', 'Amount', 'Method', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '.75rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '.75rem', color: '#888', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>Loading...</td></tr>
              ) : filtered.map((o, i) => (
                <tr key={o.id} style={{ borderTop: i > 0 ? '1px solid #f5f5f5' : undefined }}>
                  <td style={{ padding: '.75rem 1rem', fontFamily: 'monospace', fontSize: '.78rem', color: '#555' }}>{o.id}</td>
                  <td style={{ padding: '.75rem 1rem', fontSize: '.78rem', color: '#888' }}>
                    {new Date(o.placedAt ?? o.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ padding: '.75rem 1rem' }}>{o.customerName || '—'}</td>
                  <td style={{ padding: '.75rem 1rem', fontSize: '.82rem' }}>{o.customerPhone || '—'}</td>
                  <td style={{ padding: '.75rem 1rem', fontWeight: 600 }}>₹{o.total.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '.75rem 1rem', textTransform: 'capitalize' }}>{o.method}</td>
                  <td style={{ padding: '.75rem 1rem' }}>
                    <span style={{
                      fontSize: '.75rem', fontWeight: 700, padding: '.25rem .65rem', borderRadius: '12px',
                      background: o.status === 'Delivered' ? '#e8f5e9' : o.status === 'Cancelled' ? '#fdecea' : '#fff3cd',
                      color: o.status === 'Delivered' ? '#2e7d32' : o.status === 'Cancelled' ? '#c62828' : '#856404',
                    }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: '.75rem 1rem' }}>
                    <button
                      onClick={() => { setSelected(o); setNewStatus(o.status); setAwb(o.awb ?? ''); }}
                      style={{ color: '#a7354d', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.82rem', fontWeight: 600 }}>
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '380px' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Update Order #{selected.id}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <div>
                <label style={{ fontSize: '.85rem', color: '#555', display: 'block', marginBottom: '.3rem' }}>Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.9rem' }}>
                  {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '.85rem', color: '#555', display: 'block', marginBottom: '.3rem' }}>AWB / Tracking Number</label>
                <input value={awb} onChange={e => setAwb(e.target.value)}
                  placeholder="Optional"
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.9rem', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.25rem' }}>
              <button onClick={() => setSelected(null)}
                style={{ flex: 1, background: '#f5f5f5', color: '#555', border: 'none', borderRadius: '8px', padding: '.65rem', cursor: 'pointer', fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={handleUpdate} disabled={updating}
                style={{ flex: 1, background: '#a7354d', color: '#fff', border: 'none', borderRadius: '8px', padding: '.65rem', cursor: updating ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: updating ? .7 : 1 }}>
                {updating ? 'Saving...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
