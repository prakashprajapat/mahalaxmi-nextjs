'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCart, cartCount } from '@/lib/cart';
import { getCustomer } from '@/lib/auth';

export default function Navbar() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, []);

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <p>Welcome to Mahalaxmi Fashion Hub!</p>
        <p>Order / Return / Exchange / Customization / Bulk Orders:{' '}
          <a href="https://wa.me/919429429880" target="_blank" rel="noopener noreferrer">WhatsApp +91 9429429880</a>
        </p>
      </div>

      {/* Offer Strip */}
      <section className="premium-offer-strip">
        <span>Wedding Edit Live</span>
        <strong>Fresh sarees, nightwear, fabrics and daily essentials</strong>
        <Link href="/products?bestSeller=true">Shop Now</Link>
      </section>

      {/* Header */}
      <header className="site-header">
        <nav className="policy-nav">
          <Link href="/cancellation-policy">Cancellation Policy</Link>
          <Link href="/return-policy">Return Policy</Link>
          <Link href="/return-exchange">Refund &amp; Exchange Policy</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/tracking">Track Order</Link>
          <Link href="/forgot-password">Forgot Password</Link>
          <Link href="/safety-center">Safety Center</Link>
        </nav>

        <div className="brand-row">
          {/* Mobile hamburger */}
          <button
            className="site-menu-btn"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Open menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '.25rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ display: 'block', width: '22px', height: '2px', background: '#333', borderRadius: '2px' }} />
            <span style={{ display: 'block', width: '22px', height: '2px', background: '#333', borderRadius: '2px' }} />
            <span style={{ display: 'block', width: '22px', height: '2px', background: '#333', borderRadius: '2px' }} />
          </button>

          <Link href="/" className="brand" aria-label="Mahalaxmi Fashion Hub home">
            <span className="brand-mark">
              <img src="/logo.webp" alt="Mahalaxmi Fashion Hub logo" width="48" height="48" />
            </span>
            <span>
              <strong>Mahalaxmi Fashion Hub</strong>
              <span className="brand-tagline">Every Look, A New Experience</span>
            </span>
          </Link>

          <form className="search" role="search"
            onSubmit={e => { e.preventDefault(); if (search.trim()) router.push(`/products?q=${encodeURIComponent(search)}`); }}>
            <input
              id="searchInput"
              name="q"
              type="search"
              placeholder="Search saree, nighty, petticoat..."
              aria-label="Search products"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          <div className="brand-actions">
            <Link className="cart-link" href="/cart">
              Cart <span className="cart-count">{count > 0 ? count : 0}</span>
            </Link>
            <Link className="account-cta" href="/account">
              {isLoggedIn ? 'My Account' : 'Login / Signup'}
            </Link>
          </div>
        </div>

        {/* Department Nav */}
        <nav className="department-nav" aria-label="Shop by department">
          <Link href="/">Home</Link>
          <Link href="/products?category=saree">Saree</Link>
          <Link href="/products?category=women">Women</Link>
          <Link href="/products?category=men">Men</Link>
          <Link href="/products?bestSeller=true">Best Sellers</Link>
          <Link href="/products?category=nighty">Nighty</Link>
          <Link href="/products?category=petticoat">Petticoat</Link>
          <Link href="/products?category=popline">Popline</Link>
          <Link href="/products?category=nighty-cloth">Nighty Cloth</Link>
        </nav>
      </header>

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500 }}>
          {/* Backdrop */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)' }} onClick={() => setMenuOpen(false)} />
          {/* Panel */}
          <nav style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: '280px',
            background: '#fff', padding: '1.5rem 0', overflowY: 'auto',
            boxShadow: '4px 0 16px rgba(0,0,0,.15)',
          }}>
            <div style={{ padding: '0 1.25rem 1rem', borderBottom: '1px solid #eee', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: '#a7354d' }}>Mahalaxmi Fashion Hub</strong>
              <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            {/* Auth Links */}
            <div style={{ padding: '0 1.25rem 1rem', borderBottom: '1px solid #eee', marginBottom: '1rem' }}>
              <Link href="/account" onClick={() => setMenuOpen(false)}
                className="account-cta menu-account-cta"
                style={{ display: 'block', textAlign: 'center', padding: '.6rem', borderRadius: '8px', marginBottom: '.5rem' }}>
                {isLoggedIn ? 'My Account' : 'Login / Signup'}
              </Link>
              {isLoggedIn && (
                <Link href="/orders" onClick={() => setMenuOpen(false)}
                  style={{ display: 'block', padding: '.5rem', color: '#555', fontSize: '.9rem', textDecoration: 'none' }}>📦 My Orders</Link>
              )}
              <Link href="/wishlist" onClick={() => setMenuOpen(false)}
                style={{ display: 'block', padding: '.5rem', color: '#555', fontSize: '.9rem', textDecoration: 'none' }}>❤️ Wishlist</Link>
              <Link href="/cart" onClick={() => setMenuOpen(false)}
                style={{ display: 'block', padding: '.5rem', color: '#555', fontSize: '.9rem', textDecoration: 'none' }}>🛒 Cart ({count})</Link>
              <Link href="/tracking" onClick={() => setMenuOpen(false)}
                style={{ display: 'block', padding: '.5rem', color: '#555', fontSize: '.9rem', textDecoration: 'none' }}>🚚 Track Order</Link>
            </div>

            {/* Category Links */}
            <div style={{ padding: '0 1.25rem' }}>
              <p style={{ fontSize: '.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.5rem' }}>Shop by Category</p>
              {[
                { href: '/saree', label: '🥻 Saree' },
                { href: '/women', label: '👩 Women' },
                { href: '/men', label: '👔 Men' },
                { href: '/nighty', label: '🌙 Nighty' },
                { href: '/petticoat', label: '👗 Petticoat' },
                { href: '/popline', label: '🧵 Popline' },
                { href: '/nighty-cloth', label: '🧶 Nighty Cloth' },
                { href: '/best-sellers', label: '⭐ Best Sellers' },
              ].map(l => (
                <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                  style={{ display: 'block', padding: '.5rem', color: '#333', fontSize: '.9rem', textDecoration: 'none', fontWeight: 500 }}>
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Policy Links */}
            <div style={{ padding: '1rem 1.25rem 0', borderTop: '1px solid #eee', marginTop: '1rem' }}>
              <p style={{ fontSize: '.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.5rem' }}>Help & Policies</p>
              {[
                { href: '/cancellation-policy', label: 'Cancellation Policy' },
                { href: '/return-policy', label: 'Return Policy' },
                { href: '/return-exchange', label: 'Refund & Exchange' },
                { href: '/privacy-policy', label: 'Privacy Policy' },
                { href: '/safety-center', label: 'Safety Center' },
                { href: '/contact', label: 'Contact Us' },
              ].map(l => (
                <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                  style={{ display: 'block', padding: '.4rem', color: '#666', fontSize: '.85rem', textDecoration: 'none' }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}

      {/* WhatsApp Float */}
      <a className="whatsapp-float" href="https://wa.me/919429429880"
        aria-label="Chat on WhatsApp" target="_blank" rel="noopener noreferrer">
        💬 WhatsApp
      </a>
    </>
  );
}
