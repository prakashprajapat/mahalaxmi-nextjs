'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { Product } from '@/types';
import { addToCart } from '@/lib/cart';

export default function ProductCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);
  const price = product.discountPrice ?? product.price;
  const saving = product.price > price ? Math.round(((product.price - price) / product.price) * 100) : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
    setAdded(true);
    window.dispatchEvent(new Event('cart-updated'));
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link href={`/products/${product.dbId}`} className="product-card" style={{ display: 'block', textDecoration: 'none' }}>
      <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '3/4', background: '#f5f5f5' }}>
        {product.image ? (
          <img src={product.image} alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s' }}
            onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', color: '#ddd' }}>
            👗
          </div>
        )}

        {/* Badges */}
        <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {product.bestSeller && (
            <span className="badge badge-yellow">Best Seller</span>
          )}
          {saving > 0 && (
            <span className="badge badge-red">{saving}% off</span>
          )}
        </div>

        {/* Quick Add */}
        <button onClick={handleAdd} className="quick-add-btn"
          style={{
            position: 'absolute', bottom: '8px', left: '8px', right: '8px',
            background: '#a7354d', color: '#fff', border: 'none', borderRadius: '6px',
            padding: '.5rem', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
            opacity: 0, transition: 'opacity .2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0'; }}
        >
          {added ? '✓ Added to Cart!' : '+ Add to Cart'}
        </button>
      </div>

      <div className="product-card-body">
        <p style={{ fontSize: '.72rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '.2rem' }}>
          {product.category}
        </p>
        <h3 style={{ margin: '0 0 .4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '.4rem' }}>
          <span className="price">₹{price.toLocaleString('en-IN')}</span>
          {saving > 0 && <span className="price-orig">₹{product.price.toLocaleString('en-IN')}</span>}
        </div>
        <p style={{ fontSize: '.78rem', marginTop: '.3rem', color: product.stock === 'In Stock' ? '#27ae60' : '#e74c3c' }}>
          {product.stock}
        </p>
      </div>
    </Link>
  );
}
