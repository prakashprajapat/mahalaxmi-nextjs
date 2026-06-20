'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCart, cartCount } from '@/lib/cart';
import { getCustomer } from '@/lib/auth';
import Image from 'next/image';

const categories = [
  { label: 'Sarees', href: '/products?category=saree' },
  { label: 'Nighty', href: '/products?category=nighty' },
  { label: 'Petticoat', href: '/products?category=petticoat' },
  { label: 'Women', href: '/products?category=women' },
  { label: 'Men', href: '/products?category=men' },
  { label: 'Best Sellers', href: '/products?bestSeller=true' },
];

export default function Navbar() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const update = () => {
      setCount(cartCount(getCart()));
      setIsLoggedIn(!!getCustomer());
    };
    update();
    window.addEventListener('cart-updated', update);
    window.addEventListener('auth-changed', update);
    return () => {
      window.removeEventListener('cart-updated', update);
      window.removeEventListener('auth-changed', update);
    };
  }, []);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      {/* Top bar */}
      <div className="bg-[#8B1A1A] text-white text-xs text-center py-1 px-4">
        Free shipping on orders above ₹999 | COD Available
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <div className="font-bold text-xl text-[#8B1A1A]">
            Mahalaxmi<span className="text-[#D4AF37]">Fashion</span>
          </div>
          <div className="text-xs text-gray-400 -mt-0.5">Fashion Hub</div>
        </Link>

        {/* Search */}
        <form
          onSubmit={e => { e.preventDefault(); router.push(`/products?q=${search}`); }}
          className="flex-1 hidden sm:flex">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sarees, nighty, petticoat..."
            className="flex-1 border rounded-l-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]"
          />
          <button type="submit"
            className="bg-[#8B1A1A] text-white px-4 py-2 rounded-r-lg text-sm hover:bg-[#6e1414]">🔍</button>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-3 ml-auto sm:ml-0">
          <Link href="/account" className="text-gray-600 hover:text-[#8B1A1A] text-sm hidden sm:flex items-center gap-1">
            👤 {isLoggedIn ? 'Account' : 'Login'}
          </Link>
          <Link href="/cart" className="relative text-gray-600 hover:text-[#8B1A1A]">
            🛒
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#8B1A1A] text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>
          <button onClick={() => setMenuOpen(m => !m)} className="sm:hidden text-gray-600 text-xl">☰</button>
        </div>
      </div>

      {/* Category Nav */}
      <nav className="hidden sm:block border-t">
        <div className="max-w-7xl mx-auto px-4 flex gap-6 py-2">
          {categories.map(c => (
            <Link key={c.href} href={c.href}
              className="text-sm text-gray-600 hover:text-[#8B1A1A] whitespace-nowrap">
              {c.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="sm:hidden border-t bg-white">
          <div className="px-4 py-2">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { router.push(`/products?q=${search}`); setMenuOpen(false); }}}
              placeholder="Search..."
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
            />
          </div>
          {[...categories, { label: isLoggedIn ? '👤 Account' : '👤 Login', href: '/account' }].map(c => (
            <Link key={c.href} href={c.href} onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm border-b text-gray-700 hover:bg-gray-50">
              {c.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
