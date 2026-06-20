'use client';
import { useEffect, useState } from 'react';
import { ordersApi } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';
import type { Order } from '@/types';

const ALL_STATUSES = [
  'Order Received', 'Pending', 'Order Packed', 'Ready for Shipping',
  'Shipped', 'Transit', 'Delivered', 'Return Requested', 'Cancelled',
];

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
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Orders</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          placeholder="Search by ID, name, phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-64"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-gray-500 self-center">{filtered.length} orders</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                {['Order ID', 'Date', 'Customer', 'Phone', 'Amount', 'Method', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : filtered.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{o.id}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(o.placedAt ?? o.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">{o.customerName || '—'}</td>
                  <td className="px-4 py-3 text-xs">{o.customerPhone || '—'}</td>
                  <td className="px-4 py-3 font-medium">₹{o.total.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 capitalize">{o.method}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${
                      o.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                      o.status === 'Cancelled' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-700'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setSelected(o); setNewStatus(o.status); setAwb(o.awb ?? ''); }}
                      className="text-[#8B1A1A] hover:underline text-xs">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold mb-4">Update Order #{selected.id}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">AWB / Tracking Number</label>
                <input value={awb} onChange={e => setAwb(e.target.value)}
                  placeholder="Optional"
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setSelected(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleUpdate} disabled={updating} className="btn-primary flex-1 text-sm">
                {updating ? 'Saving...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
