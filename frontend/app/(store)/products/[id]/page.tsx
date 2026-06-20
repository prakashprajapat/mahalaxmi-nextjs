'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { productsApi } from '@/lib/api';
import { addToCart } from '@/lib/cart';
import type { Product } from '@/types';

// Server component that passes data to client
export default function ProductPage({ params }: { params: { id: string } }) {
  return <ProductDetail id={Number(params.id)} />;
}

function ProductDetail({ id }: { id: number }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState('');
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);

  if (loading && !product) {
    productsApi.getById(id).then(r => { setProduct(r.product); setLoading(false); });
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-400">Loading...</div>
  );
  if (!product) return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-400">Product not found.</div>
  );

  const price  = product.discountPrice ?? product.price;
  const saving = product.price - price;
  const savePct = product.price > 0 ? Math.round((saving / product.price) * 100) : 0;

  const handleAddToCart = () => {
    addToCart(product, qty, size || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50">
          {product.image ? (
            <Image src={product.image} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">👗</div>
          )}
          {product.bestSeller && (
            <span className="absolute top-3 left-3 badge bg-[#D4AF37] text-white">Best Seller</span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide">{product.category}</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{product.name}</h1>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-[#8B1A1A]">₹{price.toLocaleString('en-IN')}</span>
            {saving > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">₹{product.price.toLocaleString('en-IN')}</span>
                <span className="badge bg-green-100 text-green-700">{savePct}% off</span>
              </>
            )}
          </div>

          <p className={`text-sm font-medium ${product.stock === 'In Stock' ? 'text-green-600' : 'text-red-500'}`}>
            {product.stock}
          </p>

          {/* Size selector (if sizes available in description) */}
          {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2 text-gray-700">Select Size</p>
              <div className="flex gap-2 flex-wrap">
                {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`w-12 h-10 rounded-lg border text-sm font-medium transition-colors
                      ${size === s
                        ? 'border-[#8B1A1A] bg-[#8B1A1A] text-white'
                        : 'border-gray-300 hover:border-[#8B1A1A]'}`}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Qty:</span>
            <button onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-50">−</button>
            <span className="w-8 text-center font-medium">{qty}</span>
            <button onClick={() => setQty(q => q + 1)}
              className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-50">+</button>
          </div>

          <div className="flex gap-3 mt-2">
            <button onClick={handleAddToCart} className="btn-primary flex-1">
              {added ? '✓ Added to Cart!' : 'Add to Cart'}
            </button>
            <button
              onClick={() => { handleAddToCart(); router.push('/checkout'); }}
              className="btn-secondary flex-1">
              Buy Now
            </button>
          </div>

          {product.description && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2 text-gray-800">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
