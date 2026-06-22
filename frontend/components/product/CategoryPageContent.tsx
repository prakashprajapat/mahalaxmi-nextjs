'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import type { Product } from '@/types';

interface Props {
  products: Product[];
  category: string;
  icon: string;
  desc: string;
  allHref: string;
}

export default function CategoryPageContent({ products, category, icon, desc, allHref }: Props) {
  const [sort, setSort] = useState('position');
  const [subcatFilter, setSubcatFilter] = useState('');

  const subcategories = useMemo(() => {
    const subs = [...new Set(products.map(p => p.subcategory).filter(Boolean))];
    return subs as string[];
  }, [products]);

  const sorted = useMemo(() => {
    let arr = subcatFilter ? products.filter(p => p.subcategory === subcatFilter) : [...products];
    switch (sort) {
      case 'price-low':  arr = arr.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price)); break;
      case 'price-high': arr = arr.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price)); break;
      case 'newest':     arr = arr.sort((a, b) => b.dbId - a.dbId); break;
      case 'discount':   arr = arr.sort((a, b) => {
        const da = a.discountPrice ? Math.round(((a.price - a.discountPrice) / a.price) * 100) : 0;
        const db = b.discountPrice ? Math.round(((b.price - b.discountPrice) / b.price) * 100) : 0;
        return db - da;
      }); break;
      default: break;
    }
    return arr;
  }, [products, sort, subcatFilter]);

  return (
    <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#888' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>
          <p>No products found in this category yet.</p>
          <Link href="/products" className="button primary" style={{ display: 'inline-block', marginTop: '1rem' }}>Browse All Products</Link>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#333' }}>{sorted.length} products</span>
              {subcategories.length > 0 && (
                <select value={subcatFilter} onChange={e => setSubcatFilter(e.target.value)}
                  style={{ border: '1.5px solid #ddd', borderRadius: '8px', padding: '.35rem .75rem', fontSize: '.85rem', cursor: 'pointer' }}>
                  <option value="">All Subcategories</option>
                  {subcategories.map(s => <option key={s}>{s}</option>)}
                </select>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span style={{ fontSize: '.82rem', color: '#888' }}>Sort:</span>
              <select value={sort} onChange={e => setSort(e.target.value)}
                style={{ border: '1.5px solid #ddd', borderRadius: '8px', padding: '.35rem .75rem', fontSize: '.85rem', cursor: 'pointer' }}>
                <option value="position">Default</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
                <option value="newest">Newest First</option>
                <option value="discount">Discount: High → Low</option>
              </select>
              <Link href={allHref} style={{ color: '#a7354d', fontWeight: 600, fontSize: '.88rem', whiteSpace: 'nowrap' }}>View All →</Link>
            </div>
          </div>

          {sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
              <p>No products match the selected filter.</p>
              <button onClick={() => setSubcatFilter('')} style={{ background: 'none', border: 'none', color: '#a7354d', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>Clear Filter</button>
            </div>
          ) : (
            <div className="products-grid">
              {sorted.map((p: any) => <ProductCard key={p.dbId} product={p} />)}
            </div>
          )}
        </>
      )}
    </main>
  );
}
