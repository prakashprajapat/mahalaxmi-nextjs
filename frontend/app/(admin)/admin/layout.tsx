'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getAdminToken, adminLogout } from '@/lib/auth';

const navItems = [
  { href: '/admin', label: '📊 Dashboard' },
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

  if (!authed) return null;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-[#8B1A1A] text-white flex flex-col">
        <div className="p-4 border-b border-white/20">
          <p className="font-bold text-sm">Mahalaxmi Fashion Hub</p>
          <p className="text-xs text-white/60">Admin Panel</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-white/20 font-medium'
                  : 'hover:bg-white/10'}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3">
          <button
            onClick={() => { adminLogout(); router.push('/admin/login'); }}
            className="w-full text-left text-sm text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
