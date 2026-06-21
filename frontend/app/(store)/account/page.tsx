'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCustomer, getToken, logout, setCustomer as saveCustomer, setToken } from '@/lib/auth';
import { customersApi } from '@/lib/api';
import type { Customer } from '@/types';

const MENU_LINKS = [
  { href: '/orders', label: '📦 My Orders' },
  { href: '/account/wishlist', label: '❤️ Wishlist' },
  { href: '/account/address', label: '📍 Address' },
  { href: '/account/edit', label: '✏️ Edit Account' },
  { href: '/account/pan', label: '🪪 PAN Card' },
  { href: '/account/newsletter', label: '📧 Newsletter' },
  { href: '/account/saved-cards', label: '💳 Saved Cards' },
  { href: '/account/downloads', label: '📥 Downloads' },
  { href: '/reviews', label: '⭐ Reviews' },
  { href: '/tracking', label: '🚚 Track Order' },
];

export default function AccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
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

  if (customer) return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Customer Account</p>
        <h1>My Account</h1>
        <p>Welcome back, {customer.firstName}!</p>
      </section>

      <main className="account-shell">
        <nav className="account-menu">
          <Link className="active" href="/account">Dashboard</Link>
          {MENU_LINKS.map(l => <Link key={l.href} href={l.href}>{l.label}</Link>)}
          <Link href="#" onClick={e => { e.preventDefault(); logout(); setCustomer(null); window.dispatchEvent(new Event('auth-changed')); }}
            style={{ color: '#e67e22' }}>🔓 Logout</Link>
          <Link href="/account/deactivate" style={{ color: '#c0392b', fontSize: '.85rem' }}>Deactivate</Link>
          <Link href="/account/delete" style={{ color: '#c0392b', fontSize: '.85rem' }}>Delete Account</Link>
        </nav>

        <section>
          <div className="form-card">
            <h2>Account Dashboard</h2>
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

            {/* Quick Links Grid */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '1rem', color: '#555' }}>Quick Links</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '.6rem' }}>
                {MENU_LINKS.map(l => (
                  <Link key={l.href} href={l.href} style={{
                    display: 'block', padding: '.75rem', background: '#fdf0f3', borderRadius: '8px',
                    textDecoration: 'none', color: '#a7354d', fontSize: '.85rem', fontWeight: 600,
                    textAlign: 'center', transition: 'background .15s',
                  }}>
                    {l.label}
                  </Link>
                ))}
                <Link href="/account/deactivate" style={{ display: 'block', padding: '.75rem', background: '#fff8e1', borderRadius: '8px', textDecoration: 'none', color: '#e67e22', fontSize: '.85rem', fontWeight: 600, textAlign: 'center' }}>
                  ⏸️ Deactivate
                </Link>
                <Link href="/account/delete" style={{ display: 'block', padding: '.75rem', background: '#fdecea', borderRadius: '8px', textDecoration: 'none', color: '#c0392b', fontSize: '.85rem', fontWeight: 600, textAlign: 'center' }}>
                  🗑️ Delete Account
                </Link>
              </div>
            </div>
          </div>
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
