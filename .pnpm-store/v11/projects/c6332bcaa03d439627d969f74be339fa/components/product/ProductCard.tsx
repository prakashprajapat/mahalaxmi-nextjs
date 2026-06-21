'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { Product } from '@/types';
import { addToCart } from '@/lib/cart';
import { addToWishlist, isInWishlist } from '@/lib/wishlist';

export default function ProductCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(isInWishlist(product.dbId));

  const price = product.discountPrice ?? product.price;
  const saving = product.price > price ? Math.round(((product.price - price) / product.price) * 100) : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
    setAdded(true);
    window.dispatchEvent(new Event('cart-updated'));
    setTimeout(() => setAdded(false), 1500);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    addToWishlist(product);
    setWishlisted(true);
  };

  return (
    <div className="product-card">
      {/* Image */}
      <div className="product-card-img">
        <Link href={`/products/${product.dbId}`}>
          {product.image ? (
            <img src={product.image} alt={product.name} />
          ) : (
            <div className="product-card-placeholder">👗</div>
          )}
        </Link>

        {/* Top badges */}
        <div className="product-card-top-left">
          {product.bestSeller && <span className="product-badge-new">Best Seller</span>}
          {!product.bestSeller && <span className="product-badge-new">New</span>}
          {saving > 0 && <span className="product-badge-sale">{saving}% off</span>}
        </div>

        {/* Wishlist */}
        <button className={`product-wishlist-btn ${wishlisted ? 'active' : ''}`} onClick={handleWishlist} title="Add to Wishlist">
          {wishlisted ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Body */}
      <div className="product-card-body">
        {product.category && (
          <p className="product-card-cat">{product.category.toUpperCase()}</p>
        )}

        <span className={`product-stock-badge ${product.stock === 'In Stock' ? 'in-stock' : 'out-stock'}`}>
          {product.stock || 'In Stock'}
        </span>

        <Link href={`/products/${product.dbId}`} className="product-card-name">
          {product.name}
        </Link>

        {/* Rating */}
        <div className="product-rating">
          <span className="stars">★★★★★</span>
          <span className="rating-val">4.8</span>
        </div>

        {/* Price */}
        <div className="product-price-row">
          <span className="price">₹{price.toLocaleString('en-IN')}</span>
          {saving > 0 && <span className="price-orig">₹{product.price.toLocaleString('en-IN')}</span>}
        </div>

        {/* Buttons */}
        <button onClick={handleAdd} className="btn-add-cart">
          {added ? '✓ Added!' : 'Add to Cart'}
        </button>
        <Link href={`/products/${product.dbId}`} className="btn-details">
          Details &amp; Reviews
        </Link>
      </div>
    </div>
  );
}
