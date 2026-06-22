'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getAdminToken, adminLogout } from '@/lib/auth';

const navItems = [
  { href: '/admin', label: '📊 Dashboard', exact: true },
  { href: '/admin/products', label: '👗 Products' },
  { href: '/admin/orders', label: '📦 Orders' },
  { href: '/admin/customers', label: '👥 Customers' },
  { href: '/admin/reports', label: '📈 Reports & GSTR-1' },
  { href: '/admin/reviews', label: '⭐ Reviews' },
  { href: '/admin/categories', label: '🏷️ Categories' },
  { href: '/admin/staff', label: '👤 Staff' },
  { href: '/admin/settings', label: '⚙️ Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!getAdminToken()) router.replace('/admin/login');
    else setAuthed(true);
  }, [router]);

  if (!authed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <p style={{ color: '#999' }}>Checking authentication…</p>
    </div>
  );

  const isActive = (item: typeof navItems[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const currentLabel = navItems.find(n => isActive(n))?.label?.replace(/^[^\s]+\s/, '') || 'Admin Panel';

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <strong>Mahalaxmi Fashion Hub</strong>
          <span>Admin Panel</span>
        </div>
        <nav className="admin-nav">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={isActive(item) ? 'active' : ''}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,.1)', marginTop: 'auto' }}>
          <Link href="/" style={{ color: '#aaa', fontSize: '.85rem', display: 'block', marginBottom: '.5rem' }}>
            🌐 View Website
          </Link>
          <button
            onClick={() => { adminLogout(); router.push('/admin/login'); }}
            style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '.85rem', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Top bar */}
      <div className="admin-topbar">
        <button
          onClick={() => setMobileNavOpen(v => !v)}
          style={{ display: 'none', background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#333', marginRight: '.5rem' }}
          className="admin-mobile-menu-btn"
          aria-label="Toggle menu">
          ☰
        </button>
        <h1>{currentLabel}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '.85rem', color: '#666' }}>
          <Link href="/" style={{ color: '#a7354d', fontWeight: 600, fontSize: '.82rem' }}>🌐 Store</Link>
          <button onClick={() => { adminLogout(); router.push('/admin/login'); }}
            style={{ background: 'none', border: 'none', color: '#a7354d', cursor: 'pointer', fontWeight: 600, fontSize: '.85rem' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileNavOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.5)' }}
          onClick={() => setMobileNavOpen(false)}>
          <div style={{ width: '240px', height: '100%', background: '#1a1a2e', padding: '1.5rem 0' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '0 1rem 1rem', borderBottom: '1px solid rgba(255,255,255,.1)', marginBottom: '1rem' }}>
              <strong style={{ color: '#fff', fontSize: '.95rem' }}>Mahalaxmi Fashion Hub</strong>
              <span style={{ display: 'block', color: '#aaa', fontSize: '.75rem' }}>Admin Panel</span>
            </div>
            {navItems.map(item => (
              <Link key={item.href} href={item.href}
                onClick={() => setMobileNavOpen(false)}
                style={{
                  display: 'block', padding: '.7rem 1.25rem', fontSize: '.9rem',
                  color: isActive(item) ? '#fff' : '#aaa',
                  background: isActive(item) ? 'rgba(167,53,77,.4)' : 'transparent',
                  textDecoration: 'none',
                }}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}
