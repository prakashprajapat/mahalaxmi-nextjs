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
  { href: '/admin/reports', label: '📈 Reports' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);

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
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,.1)' }}>
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
        <h1>
          {navItems.find(n => isActive(n))?.label?.replace(/^[^\s]+\s/, '') || 'Admin Panel'}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '.85rem', color: '#666' }}>
          <span>admin@mahalaxmifashionhub.com</span>
          <button onClick={() => { adminLogout(); router.push('/admin/login'); }}
            style={{ background: 'none', border: 'none', color: '#a7354d', cursor: 'pointer', fontWeight: 600, fontSize: '.85rem' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}
