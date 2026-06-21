'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { productsApi } from '@/lib/api';
import { addToCart } from '@/lib/cart';
import { addToWishlist, isInWishlist } from '@/lib/wishlist';
import type { Product } from '@/types';

export default function ProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState('');
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.getById(Number(params.id))
      .then(r => {
        setProduct(r.product);
        setWishlisted(isInWishlist(r.product.dbId));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
      Loading…
    </div>
  );
  if (!product) return (
    <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <p style={{ color: '#aaa' }}>Product not found.</p>
      <Link href="/products" className="button primary">Browse Products</Link>
    </div>
  );

  const price = product.discountPrice ?? product.price;
  const saving = product.price > price ? Math.round(((product.price - price) / product.price) * 100) : 0;
  const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  const handleAddToCart = () => {
    addToCart(product, qty, size || undefined);
    setAdded(true);
    window.dispatchEvent(new Event('cart-updated'));
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = () => {
    addToWishlist(product);
    setWishlisted(true);
  };

  return (
    <>
      {/* Breadcrumb */}
      <nav style={{ background: '#f9f9f9', borderBottom: '1px solid #eee', padding: '.6rem 1.5rem', fontSize: '.83rem', color: '#888' }}>
        <Link href="/" style={{ color: '#a7354d' }}>Home</Link> &rsaquo;{' '}
        <Link href="/products" style={{ color: '#a7354d' }}>Products</Link> &rsaquo;{' '}
        {product.category && <><Link href={`/${product.category}`} style={{ color: '#a7354d' }}>{product.category}</Link> &rsaquo; </>}
        <span>{product.name}</span>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'start' }}>

          {/* Image */}
          <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '3/4', background: '#f5f5f5' }}>
            {product.image ? (
              <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', color: '#ddd' }}>👗</div>
            )}
            {product.bestSeller && <span className="badge badge-yellow" style={{ position: 'absolute', top: 12, left: 12 }}>Best Seller</span>}
            {saving > 0 && <span className="badge badge-red" style={{ position: 'absolute', top: product.bestSeller ? 44 : 12, left: 12 }}>{saving}% off</span>}
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <p style={{ fontSize: '.78rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.35rem' }}>
                {product.category}
              </p>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 .5rem', color: '#1a1a1a', lineHeight: 1.25 }}>{product.name}</h1>
              <p style={{ fontSize: '.85rem', color: product.stock === 'In Stock' ? '#27ae60' : '#e74c3c', fontWeight: 600 }}>
                {product.stock}
              </p>
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '.75rem', flexWrap: 'wrap' }}>
              <span className="price" style={{ fontSize: '2rem' }}>₹{price.toLocaleString('en-IN')}</span>
              {saving > 0 && (
                <>
                  <span className="price-orig" style={{ fontSize: '1.1rem' }}>₹{product.price.toLocaleString('en-IN')}</span>
                  <span style={{ background: '#e8f5e9', color: '#27ae60', padding: '.2rem .6rem', borderRadius: '20px', fontSize: '.82rem', fontWeight: 700 }}>
                    Save {saving}%
                  </span>
                </>
              )}
            </div>

            {/* Size Selector */}
            <div>
              <p style={{ fontWeight: 600, fontSize: '.9rem', marginBottom: '.5rem' }}>Select Size</p>
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                {SIZES.map(s => (
                  <button key={s} onClick={() => setSize(s)} style={{
                    width: '44px', height: '40px', borderRadius: '6px', border: size === s ? '2px solid #a7354d' : '1.5px solid #ddd',
                    background: size === s ? '#a7354d' : '#fff', color: size === s ? '#fff' : '#333',
                    fontSize: '.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                  }}>{s}</button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <span style={{ fontWeight: 600, fontSize: '.9rem' }}>Quantity:</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: '36px', height: '36px', border: 'none', background: '#f5f5f5', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ width: '36px', textAlign: 'center', fontWeight: 700 }}>{qty}</span>
                <button onClick={() => setQty(q => q + 1)} style={{ width: '36px', height: '36px', border: 'none', background: '#f5f5f5', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              <button onClick={handleAddToCart} className="button primary" style={{ flex: 1, minWidth: '140px' }}>
                {added ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
              <button onClick={() => { handleAddToCart(); router.push('/checkout'); }} className="button secondary" style={{ flex: 1, minWidth: '140px' }}>
                Buy Now
              </button>
            </div>

            <button onClick={handleWishlist} style={{ background: 'none', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem 1rem', cursor: 'pointer', color: wishlisted ? '#a7354d' : '#666', fontWeight: 600, fontSize: '.9rem', width: '100%' }}>
              {wishlisted ? '❤️ Saved to Wishlist' : '🤍 Add to Wishlist'}
            </button>

            {/* WhatsApp */}
            <a href={`https://wa.me/919429429880?text=Hi, I'm interested in: ${product.name}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: '#25d366', fontWeight: 600, fontSize: '.9rem', textDecoration: 'none' }}>
              <span style={{ fontSize: '1.2rem' }}>💬</span> Order on WhatsApp
            </a>

            {/* Description */}
            {product.description && (
              <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '.5rem' }}>Product Details</h3>
                <p style={{ color: '#555', fontSize: '.9rem', lineHeight: 1.7 }}>{product.description}</p>
              </div>
            )}

            {/* Trust badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.5rem', paddingTop: '.5rem', borderTop: '1px solid #eee' }}>
              {[
                { icon: '🚚', text: 'Fast Shipping' },
                { icon: '🔄', text: '7-Day Return' },
                { icon: '🔒', text: 'Secure Pay' },
              ].map(b => (
                <div key={b.text} style={{ textAlign: 'center', fontSize: '.75rem', color: '#777' }}>
                  <div style={{ fontSize: '1.3rem' }}>{b.icon}</div>
                  {b.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
