'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCustomer } from '@/lib/auth';

const NL_KEY = 'mfh-newsletter';

export default function NewsletterPage() {
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!getCustomer()) { router.push('/account'); return; }
    const val = localStorage.getItem(NL_KEY);
    setSubscribed(val === 'true');
  }, [router]);

  const toggle = () => {
    const newVal = !subscribed;
    setSubscribed(newVal);
    localStorage.setItem(NL_KEY, String(newVal));
    setMsg(newVal ? 'You are now subscribed to our newsletter.' : 'You have unsubscribed from our newsletter.');
  };

  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">My Account</p>
        <h1>Newsletter</h1>
        <p>Manage your newsletter subscription preferences.</p>
      </section>

      <main className="account-shell">
        <nav className="account-menu">
          <Link href="/account">Dashboard</Link>
          <Link href="/orders">My Orders</Link>
          <Link href="/account/pan">PAN Card</Link>
          <Link href="/account/newsletter" className="active">Newsletter</Link>
          <Link href="/account/saved-cards">Saved Cards</Link>
          <Link href="/account/downloads">Downloads</Link>
        </nav>

        <section>
          <div className="form-card">
            <h2>Newsletter Preferences</h2>
            <p style={{ fontSize: '.9rem', color: '#666', marginBottom: '1.5rem' }}>
              Subscribe to receive updates about new arrivals, exclusive offers, and festive sales from Mahalaxmi Fashion Hub.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1.5px solid #eee', borderRadius: '10px', marginBottom: '1.5rem' }}>
              <button
                onClick={toggle}
                style={{
                  width: '52px', height: '28px', borderRadius: '14px', border: 'none',
                  background: subscribed ? '#a7354d' : '#ccc',
                  position: 'relative', cursor: 'pointer', transition: 'background .2s',
                }}
              >
                <span style={{
                  position: 'absolute', top: '3px', left: subscribed ? '27px' : '3px',
                  width: '22px', height: '22px', borderRadius: '50%', background: '#fff',
                  transition: 'left .2s', display: 'block',
                }} />
              </button>
              <div>
                <strong style={{ fontSize: '.95rem' }}>Email Newsletter</strong>
                <p style={{ fontSize: '.85rem', color: '#888', margin: 0 }}>
                  {subscribed ? 'Currently subscribed' : 'Currently unsubscribed'}
                </p>
              </div>
            </div>

            {msg && (
              <p style={{ color: subscribed ? '#27ae60' : '#888', fontSize: '.88rem', fontWeight: 600 }}>
                {subscribed ? '✓' : '—'} {msg}
              </p>
            )}

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fdf0f3', borderRadius: '10px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.5rem', color: '#a7354d' }}>What you get:</h3>
              <ul style={{ fontSize: '.88rem', color: '#555', lineHeight: 1.8, paddingLeft: '1.25rem' }}>
                <li>New collection launches</li>
                <li>Exclusive subscriber discounts</li>
                <li>Festival & seasonal sale alerts</li>
                <li>New stock notifications</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
