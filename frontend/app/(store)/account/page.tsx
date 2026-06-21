'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCustomer, getToken, logout, setCustomer as saveCustomer, setToken } from '@/lib/auth';
import { customersApi } from '@/lib/api';
import type { Customer } from '@/types';

export default function AccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [tab, setTab] = useState<'profile' | 'orders'>('profile');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const c = getCustomer();
    if (c) setCustomer(c);
  }, []);

  const handleLogin = async () => {
    setLoading(true); setError('');
    try {
      const res = await customersApi.login({ email: form.email, password: form.password });
      setToken(res.token);
      saveCustomer(res.customer);
      setCustomer(res.customer);
      window.dispatchEvent(new Event('auth-changed'));
    } catch (e) {
      setError((e as Error).message || 'Login failed. Please check your credentials.');
    } finally { setLoading(false); }
  };

  // Logged in view
  if (customer) return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Customer Account</p>
        <h1>My Account</h1>
        <p>Welcome back, {customer.firstName}!</p>
      </section>

      <main className="account-shell">
        <nav className="account-menu">
          <Link className={tab === 'profile' ? 'active' : ''} href="#" onClick={e => { e.preventDefault(); setTab('profile'); }}>Account Dashboard</Link>
          <Link className={tab === 'orders' ? 'active' : ''} href="#" onClick={e => { e.preventDefault(); setTab('orders'); }}>My Orders</Link>
          <Link href="/account/wishlist">Wishlist</Link>
          <Link href="/tracking">Track Order</Link>
          <Link href="#" onClick={e => { e.preventDefault(); logout(); setCustomer(null); window.dispatchEvent(new Event('auth-changed')); }}
            style={{ color: '#c0392b' }}>Logout</Link>
        </nav>

        <section>
          {tab === 'profile' && (
            <div className="form-card">
              <h2>Account Details</h2>
              <div className="form-grid" style={{ pointerEvents: 'none' }}>
                <label>Name<input value={`${customer.firstName} ${customer.lastName}`} readOnly /></label>
                <label>Customer ID<input value={customer.customerCode || '—'} readOnly /></label>
                <label>Email<input value={customer.email} readOnly /></label>
                <label>Phone<input value={customer.phone} readOnly /></label>
                <label className="full-field">Address
                  <input value={[customer.addrLine1, customer.addrLine2, customer.postOffice, customer.district, customer.state, customer.pincode].filter(Boolean).join(', ')} readOnly />
                </label>
                <label>Account Status
                  <input value={customer.accountStatus || 'Active'} readOnly />
                </label>
              </div>
            </div>
          )}

          {tab === 'orders' && <OrdersList customer={customer} />}
        </section>
      </main>
    </>
  );

  // Login view
  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Customer Account</p>
        <h1>Customer Login / Registration</h1>
        <p>Login to your existing account or create a new one.</p>
      </section>

      <main className="account-shell">
        <nav className="account-menu">
          <Link className="active" href="/account">Login / Signup</Link>
          <Link href="/account/register">New Registration</Link>
          <Link href="/tracking">Track Order</Link>
        </nav>

        <section className="auth-stack">
          <div className="form-card">
            <h2>Customer Login</h2>
            <form className="form-grid" onSubmit={e => { e.preventDefault(); handleLogin(); }}>
              <label className="full-field">
                Email Address
                <input required type="email" placeholder="you@example.com" autoComplete="email"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </label>
              <label className="full-field">
                Password
                <input required type="password" placeholder="Enter password" autoComplete="current-password"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </label>

              {error && <p className="wiz-message full-field">{error}</p>}

              <div className="form-actions">
                <button type="submit" className="button primary" disabled={loading}>
                  {loading ? 'Logging in…' : 'Login'}
                </button>
                <Link href="/account/register" className="button secondary">Create Account</Link>
              </div>
              <p className="full-field" style={{ marginTop: '10px', textAlign: 'right', fontSize: '.88rem' }}>
                <Link className="inline-link" href="/forgot-password">Forgot Password?</Link>
              </p>
            </form>
          </div>

          <div className="form-card" style={{ background: '#fdf0f3' }}>
            <h2>Quick Safety Tips</h2>
            <ul className="safety-list">
              <li>Do not share your password, OTP, UPI PIN, or full card details in support chat.</li>
              <li>If there is an order issue, keep the parcel-opening video and order ID ready.</li>
              <li>Contact us only via official WhatsApp: <a className="inline-link" href="https://wa.me/919429429880">+91 9429429880</a></li>
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}

function OrdersList({ customer }: { customer: Customer }) {
  const [orders, setOrders] = useState<import('@/types').Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    import('@/lib/api').then(({ ordersApi }) =>
      ordersApi.getAll({ phone: customer.phone, email: customer.email }, token ?? '')
        .then(r => setOrders(r.orders))
        .catch(() => setOrders([]))
        .finally(() => setLoading(false))
    );
  }, [customer]);

  if (loading) return <div className="form-card"><p style={{ textAlign: 'center', color: '#999', padding: '2rem 0' }}>Loading orders…</p></div>;
  if (orders.length === 0) return (
    <div className="form-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
      <h3 style={{ color: '#555' }}>No orders yet</h3>
      <p style={{ color: '#888', marginBottom: '1.5rem' }}>Your order history will appear here.</p>
      <Link href="/products" className="button primary">Start Shopping</Link>
    </div>
  );

  return (
    <div className="form-card">
      <h2>Order History</h2>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>AWB</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td><strong>#{o.id}</strong></td>
                <td>{new Date(o.placedAt ?? o.createdAt).toLocaleDateString('en-IN')}</td>
                <td>{o.cart.length} item(s)</td>
                <td><strong>₹{o.total.toLocaleString('en-IN')}</strong></td>
                <td>
                  <span className={`badge ${o.status === 'Delivered' ? 'badge-green' : o.status === 'Cancelled' ? 'badge-red' : 'badge-yellow'}`}>
                    {o.status}
                  </span>
                </td>
                <td>{o.awb || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
