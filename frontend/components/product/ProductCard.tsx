'use client';
import Link from 'next/link';
import Image from 'next/image';
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
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link href={`/products/${product.dbId}`} className="card group block hover:shadow-md transition-shadow">
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {product.image ? (
          <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-gray-200">👗</div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.bestSeller && (
            <span className="badge bg-[#D4AF37] text-white text-xs">Best Seller</span>
          )}
          {saving > 0 && (
            <span className="badge bg-red-500 text-white text-xs">{saving}% off</span>
          )}
        </div>

        {/* Quick Add */}
        <button
          onClick={handleAdd}
          className="absolute bottom-2 left-2 right-2 bg-[#8B1A1A] text-white text-xs py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          {added ? '✓ Added!' : '+ Add to Cart'}
        </button>
      </div>

      <div className="p-3">
        <p className="text-xs text-gray-400 uppercase tracking-wide">{product.category}</p>
        <p className="text-sm font-medium text-gray-800 truncate mt-0.5">{product.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-bold text-[#8B1A1A]">₹{price.toLocaleString('en-IN')}</span>
          {saving > 0 && (
            <span className="text-xs text-gray-400 line-through">₹{product.price.toLocaleString('en-IN')}</span>
          )}
        </div>
        <p className={`text-xs mt-1 ${product.stock === 'In Stock' ? 'text-green-500' : 'text-red-400'}`}>
          {product.stock}
        </p>
      </div>
    </Link>
  );
}
