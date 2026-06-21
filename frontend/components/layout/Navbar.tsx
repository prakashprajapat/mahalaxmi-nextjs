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
        </nav>

        <div className="brand-row">
          {/* Mobile menu */}
          <details className="site-menu" style={{ display: 'none' }} onToggle={e => setMenuOpen((e.target as HTMLDetailsElement).open)}>
            <summary aria-label="Open customer menu">
              <span className="site-menu-lines">
                <span /><span /><span />
              </span>
            </summary>
            <div className="site-menu-panel">
              <Link className="account-cta menu-account-cta" href="/account">Login / Signup</Link>
              <Link href="/account">My Account</Link>
              <Link href="/account?tab=orders">My Orders</Link>
              <Link href="/wishlist">Wishlist</Link>
              <Link href="/tracking">Track Order</Link>
            </div>
          </details>

          <Link href="/" className="brand" aria-label="Mahalaxmi Fashion Hub home">
            <span className="brand-mark">
              <img src="/logo.webp" alt="Mahalaxmi Fashion Hub logo" width="48" height="48"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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
            <Link className="cart-link" href="/cart">Cart <span>{count > 0 ? count : 0}</span></Link>
            <Link className="account-cta" href="/account">
              {isLoggedIn ? 'My Account' : 'Login / Signup'}
            </Link>
          </div>
        </div>

        {/* Department Nav */}
        <nav className="department-nav" aria-label="Shop by department">
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

      {/* WhatsApp Float */}
      <a className="whatsapp-float" href="https://wa.me/919429429880"
        aria-label="Chat on WhatsApp" target="_blank" rel="noopener noreferrer">
        💬 WhatsApp
      </a>
    </>
  );
}
