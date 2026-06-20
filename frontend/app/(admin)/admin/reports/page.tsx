'use client';
import { useEffect, useState } from 'react';
import { ordersApi } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';
import type { Order } from '@/types';

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const token = getAdminToken() ?? '';
    ordersApi.getAll(undefined, token)
      .then(r => setOrders(r.orders))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    const d = new Date(o.placedAt ?? o.createdAt);
    return d >= new Date(dateFrom) && d <= new Date(dateTo + 'T23:59:59');
  });

  const totalRevenue  = filtered.filter(o => !['Cancelled', 'Return'].includes(o.status)).reduce((s, o) => s + o.total, 0);
  const totalOrders   = filtered.length;
  const codOrders     = filtered.filter(o => o.method === 'cod').length;
  const onlineOrders  = filtered.filter(o => o.method !== 'cod').length;
  const delivered     = filtered.filter(o => o.status === 'Delivered').length;
  const cancelled     = filtered.filter(o => o.status === 'Cancelled').length;

  // GST Breakdown (5% on clothing)
  const gstableRevenue = filtered.filter(o => !['Cancelled', 'Return'].includes(o.status)).reduce((s, o) => s + o.subtotal, 0);
  const cgst = gstableRevenue * 0.025;
  const sgst = gstableRevenue * 0.025;

  // Category breakdown
  const categoryMap: Record<string, { qty: number; revenue: number }> = {};
  filtered.forEach(o => {
    o.cart.forEach(item => {
      const c = item.category || 'Unknown';
      if (!categoryMap[c]) categoryMap[c] = { qty: 0, revenue: 0 };
      categoryMap[c].qty += item.quantity;
      categoryMap[c].revenue += item.lineTotal;
    });
  });

  const exportCsv = () => {
    const rows = [
      ['Order ID', 'Date', 'Customer', 'Phone', 'Method', 'Subtotal', 'Shipping', 'Total', 'Status'],
      ...filtered.map(o => [
        o.id,
        new Date(o.placedAt ?? o.createdAt).toLocaleDateString('en-IN'),
        o.customerName ?? '',
        o.customerPhone ?? '',
        o.method,
        o.subtotal,
        o.shippingCost,
        o.total,
        o.status,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mfh-orders-${dateFrom}-to-${dateTo}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <button onClick={exportCsv} className="btn-secondary text-sm py-1.5">📥 Export CSV</button>
      </div>

      {/* Date Range */}
      <div className="flex gap-3 mb-6 items-center">
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
        <span className="text-gray-400">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          ['Revenue', `₹${totalRevenue.toLocaleString('en-IN')}`, 'bg-green-50 text-green-700'],
          ['Orders', totalOrders, 'bg-blue-50 text-blue-700'],
          ['COD', codOrders, 'bg-orange-50 text-orange-700'],
          ['Online', onlineOrders, 'bg-purple-50 text-purple-700'],
          ['Delivered', delivered, 'bg-teal-50 text-teal-700'],
          ['Cancelled', cancelled, 'bg-red-50 text-red-600'],
        ].map(([label, val, cls]) => (
          <div key={label as string} className={`rounded-xl p-4 ${(cls as string).split(' ')[0]}`}>
            <p className={`text-xl font-bold ${(cls as string).split(' ')[1]}`}>{val}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* GST Summary */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-bold mb-3 text-gray-700">GST Summary (5%)</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y">
              <tr><td className="py-2">Taxable Amount</td><td className="py-2 font-medium text-right">₹{gstableRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
              <tr><td className="py-2">CGST (2.5%)</td><td className="py-2 font-medium text-right">₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
              <tr><td className="py-2">SGST (2.5%)</td><td className="py-2 font-medium text-right">₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
              <tr><td className="py-2 font-bold">Total GST</td><td className="py-2 font-bold text-right">₹{(cgst + sgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-bold mb-3 text-gray-700">Category Breakdown</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-400 border-b">
              <tr><th className="pb-2 text-left">Category</th><th className="pb-2 text-right">Qty</th><th className="pb-2 text-right">Revenue</th></tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(categoryMap).sort(([,a], [,b]) => b.revenue - a.revenue).map(([cat, d]) => (
                <tr key={cat}>
                  <td className="py-2 capitalize">{cat}</td>
                  <td className="py-2 text-right">{d.qty}</td>
                  <td className="py-2 text-right font-medium">₹{d.revenue.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
