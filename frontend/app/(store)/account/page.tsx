'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCustomer, getToken, logout, setCustomer as saveCustomer, setToken } from '@/lib/auth';
import { customersApi } from '@/lib/api';
import type { Customer } from '@/types';

type Tab = 'profile' | 'orders' | 'login';

export default function AccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [tab, setTab] = useState<Tab>('login');
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [form, setForm] = useState({ email: '', password: '', phone: '', otp: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const c = getCustomer();
    if (c) { setCustomer(c); setTab('profile'); }
  }, []);

  const handlePasswordLogin = async () => {
    setLoading(true); setError('');
    try {
      const res = await customersApi.login({ email: form.email, password: form.password });
      setToken(res.token);
      saveCustomer(res.customer);
      setCustomer(res.customer);
      setTab('profile');
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  };

  const handleSendOtp = async () => {
    setLoading(true); setError('');
    try {
      await customersApi.sendOtp(form.phone);
      setOtpSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    setLoading(true); setError('');
    try {
      const res = await customersApi.verifyOtp(form.phone, form.otp);
      if (res.newUser) { router.push('/account/register'); return; }
      if (res.token && res.customer) {
        setToken(res.token);
        saveCustomer(res.customer);
        setCustomer(res.customer);
        setTab('profile');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  };

  if (customer) return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#8B1A1A]">My Account</h1>
          <p className="text-gray-500">{customer.firstName} {customer.lastName}</p>
        </div>
        <button onClick={() => { logout(); setCustomer(null); setTab('login'); }} className="text-sm text-red-500 hover:underline">
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        {(['profile', 'orders'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t ? 'border-[#8B1A1A] text-[#8B1A1A]' : 'border-transparent text-gray-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card p-6 grid sm:grid-cols-2 gap-4 text-sm">
          <Info label="Name" value={`${customer.firstName} ${customer.lastName}`} />
          <Info label="Email" value={customer.email} />
          <Info label="Phone" value={customer.phone} />
          <Info label="Customer Code" value={customer.customerCode} />
          <Info label="Address" value={`${customer.addrLine1}, ${customer.district}, ${customer.state} - ${customer.pincode}`} />
          <Info label="Account Status" value={customer.accountStatus} />
        </div>
      )}

      {tab === 'orders' && <OrdersList customer={customer} />}
    </div>
  );

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <h1 className="text-2xl font-bold mb-6 text-center text-[#8B1A1A]">Login</h1>

      <div className="flex gap-2 mb-6">
        {(['password', 'otp'] as const).map(m => (
          <button key={m} onClick={() => setLoginMode(m)}
            className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
              loginMode === m ? 'bg-[#8B1A1A] text-white border-[#8B1A1A]' : 'border-gray-300'}`}>
            {m === 'password' ? 'Email / Password' : 'OTP (WhatsApp)'}
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {loginMode === 'password' ? (
        <div className="space-y-3">
          <input placeholder="Email" type="email" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Password" type="password" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <button onClick={handlePasswordLogin} disabled={loading} className="btn-primary w-full">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input placeholder="WhatsApp Number" type="tel" value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          {!otpSent ? (
            <button onClick={handleSendOtp} disabled={loading} className="btn-primary w-full">
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          ) : (
            <>
              <input placeholder="Enter OTP" value={form.otp}
                onChange={e => setForm(f => ({ ...f, otp: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
              <button onClick={handleVerifyOtp} disabled={loading} className="btn-primary w-full">
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </>
          )}
        </div>
      )}

      <p className="text-center text-sm text-gray-500 mt-4">
        New here?{' '}
        <a href="/account/register" className="text-[#8B1A1A] hover:underline">Create Account</a>
      </p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-400 text-xs uppercase tracking-wide">{label}</p>
      <p className="font-medium text-gray-800">{value || '—'}</p>
    </div>
  );
}

function OrdersList({ customer }: { customer: Customer }) {
  const [orders, setOrders] = useState<import('@/types').Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    customersApi.getAll(token ?? '').catch(() => null);
    import('@/lib/api').then(({ ordersApi }) =>
      ordersApi.getAll({ phone: customer.phone, email: customer.email }, token ?? '')
        .then(r => setOrders(r.orders))
        .catch(() => setOrders([]))
        .finally(() => setLoading(false))
    );
  }, [customer]);

  if (loading) return <p className="text-gray-400 text-center py-8">Loading orders...</p>;
  if (orders.length === 0) return <p className="text-gray-400 text-center py-8">No orders yet.</p>;

  return (
    <div className="space-y-4">
      {orders.map(o => (
        <div key={o.id} className="card p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-sm">#{o.id}</p>
              <p className="text-gray-500 text-xs">{new Date(o.placedAt ?? o.createdAt).toLocaleDateString('en-IN')}</p>
            </div>
            <span className={`badge text-xs ${
              o.status === 'Delivered' ? 'bg-green-100 text-green-700' :
              o.status === 'Cancelled' ? 'bg-red-100 text-red-600' :
              'bg-yellow-100 text-yellow-700'}`}>
              {o.status}
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {o.cart.length} item(s) · <strong>₹{o.total.toLocaleString('en-IN')}</strong>
          </div>
          {o.awb && <p className="text-xs text-blue-600 mt-1">AWB: {o.awb}</p>}
        </div>
      ))}
    </div>
  );
}
