'use client';
import { useEffect, useState } from 'react';
import { customersApi } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';
import type { Customer } from '@/types';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const token = getAdminToken() ?? '';
    customersApi.getAll(token, { search, page })
      .then(r => { setCustomers(r.customers); setTotal(r.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, page]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Customers ({total})</h1>

      <input
        placeholder="Search by name, email, phone..."
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        className="border rounded-lg px-3 py-2 text-sm w-72 mb-4"
      />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              {['Code', 'Name', 'Email', 'Phone', 'State', 'Status', 'Joined'].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading...</td></tr>
            ) : customers.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{c.customerCode}</td>
                <td className="px-4 py-3">{c.firstName} {c.lastName}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{c.email}</td>
                <td className="px-4 py-3 text-xs">{c.phone}</td>
                <td className="px-4 py-3 text-xs">{c.state || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`badge text-xs ${c.accountStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {c.accountStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleDateString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
        <span>Page {page} · {customers.length} of {total}</span>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40">← Prev</button>
          <button disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40">Next →</button>
        </div>
      </div>
    </div>
  );
}
