import type { Metadata } from 'next';
import { productsApi } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import Link from 'next/link';

export const revalidate = 60;

interface Props {
  searchParams: { category?: string; subcategory?: string; q?: string; bestSeller?: string; sort?: string };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const label = searchParams.category
    ? searchParams.category.charAt(0).toUpperCase() + searchParams.category.slice(1).replace(/-/g, ' ')
    : searchParams.bestSeller === 'true' ? 'Best Sellers' : 'All Products';
  return { title: `${label} | Mahalaxmi Fashion Hub` };
}

const CATEGORIES = [
  { label: 'All Products', href: '/products', value: '' },
  { label: 'Saree', href: '/saree', value: 'saree' },
  { label: 'Women', href: '/women', value: 'women' },
  { label: 'Men', href: '/men', value: 'men' },
  { label: 'Nighty', href: '/nighty', value: 'nighty' },
  { label: 'Petticoat', href: '/petticoat', value: 'petticoat' },
  { label: 'Popline', href: '/popline', value: 'popline' },
  { label: 'Nighty Cloth', href: '/nighty-cloth', value: 'nighty-cloth' },
  { label: 'Best Sellers', href: '/best-sellers', value: 'best-sellers' },
];

function sortProducts(products: any[], sort: string): any[] {
  const arr = [...products];
  switch (sort) {
    case 'price-low':  return arr.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
    case 'price-high': return arr.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
    case 'newest':     return arr.sort((a, b) => b.dbId - a.dbId);
    case 'discount':   return arr.sort((a, b) => {
      const discA = a.discountPrice ? Math.round(((a.price - a.discountPrice) / a.price) * 100) : 0;
      const discB = b.discountPrice ? Math.round(((b.price - b.discountPrice) / b.price) * 100) : 0;
      return discB - discA;
    });
    default: return arr;
  }
}

function buildUrl(searchParams: Props['searchParams'], overrides: Partial<Props['searchParams']>) {
  const merged = { ...searchParams, ...overrides };
  const qs = Object.entries(merged)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join('&');
  return `/products${qs ? '?' + qs : ''}`;
}

export default async function ProductsPage({ searchParams }: Props) {
  const { products } = await productsApi.getAll({
    category: searchParams.category,
    subcategory: searchParams.subcategory,
    bestSeller: searchParams.bestSeller === 'true' ? true : undefined,
    pageSize: 200,
  }).catch(() => ({ products: [] }));

  let filtered = searchParams.q
    ? products.filter((p: any) =>
        p.name.toLowerCase().includes(searchParams.q!.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchParams.q!.toLowerCase()) ||
        (p.subcategory ?? '').toLowerCase().includes(searchParams.q!.toLowerCase()))
    : products;

  const sort = searchParams.sort || 'position';
  const sorted = sortProducts(filtered, sort);

  const title = searchParams.bestSeller === 'true'
    ? 'Best Sellers'
    : searchParams.category
      ? searchParams.category.charAt(0).toUpperCase() + searchParams.category.slice(1).replace(/-/g, ' ')
      : 'All Products';

  const currentCat = searchParams.category ?? (searchParams.bestSeller === 'true' ? 'best-sellers' : '');

  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Shop</p>
        <h1>{title}</h1>
        <p>{sorted.length} product{sorted.length !== 1 ? 's' : ''} available</p>
      </section>

      <div style={{ display: 'flex', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Sidebar Filter */}
        <aside style={{ width: '200px', flexShrink: 0 }}>
          <div className="form-card" style={{ padding: '1.25rem', position: 'sticky', top: '1rem' }}>
            <h3 style={{ margin: '0 0 .75rem', fontSize: '.95rem', color: '#a7354d', fontWeight: 700 }}>Categories</h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
              {CATEGORIES.map(c => {
                const isActive = c.value === currentCat || (!c.value && !currentCat);
                return (
                  <Link key={c.href} href={c.href} style={{
                    fontSize: '.88rem', color: isActive ? '#a7354d' : '#444',
                    fontWeight: isActive ? 700 : 400, padding: '.3rem .5rem',
                    borderRadius: '4px', background: isActive ? '#fdf0f3' : 'transparent',
                    textDecoration: 'none', transition: 'all .15s',
                  }}>
                    {c.label}
                  </Link>
                );
              })}
            </nav>

            <div style={{ borderTop: '1px solid #eee', marginTop: '1rem', paddingTop: '1rem' }}>
              <h3 style={{ margin: '0 0 .75rem', fontSize: '.95rem', color: '#a7354d', fontWeight: 700 }}>Sort By</h3>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                {[
                  { value: 'position', label: 'Default' },
                  { value: 'price-low', label: 'Price: Low to High' },
                  { value: 'price-high', label: 'Price: High to Low' },
                  { value: 'newest', label: 'Newest First' },
                  { value: 'discount', label: 'Discount: High to Low' },
                ].map(s => (
                  <Link key={s.value}
                    href={buildUrl(searchParams, { sort: s.value !== 'position' ? s.value : undefined })}
                    style={{
                      fontSize: '.85rem', color: sort === s.value || (s.value === 'position' && !sort) ? '#a7354d' : '#555',
                      fontWeight: sort === s.value || (s.value === 'position' && !sort) ? 700 : 400,
                      padding: '.3rem .5rem', borderRadius: '4px',
                      background: sort === s.value || (s.value === 'position' && !sort) ? '#fdf0f3' : 'transparent',
                      textDecoration: 'none',
                    }}>
                    {s.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div style={{ flex: 1 }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '.5rem' }}>
            {searchParams.q && (
              <p style={{ color: '#666', fontSize: '.9rem' }}>
                Results for: <strong>&ldquo;{searchParams.q}&rdquo;</strong>
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginLeft: 'auto' }}>
              <span style={{ fontSize: '.82rem', color: '#888' }}>Sort:</span>
              <select defaultValue={sort}
                onChange={e => {
                  const url = buildUrl(searchParams, { sort: e.target.value !== 'position' ? e.target.value : undefined });
                  window.location.href = url;
                }}
                style={{ border: '1.5px solid #ddd', borderRadius: '8px', padding: '.35rem .75rem', fontSize: '.85rem', cursor: 'pointer' }}>
                <option value="position">Default</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
                <option value="newest">Newest First</option>
                <option value="discount">Discount: High → Low</option>
              </select>
            </div>
          </div>

          {sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <p>No products found.</p>
              <Link href="/products" className="button primary" style={{ display: 'inline-block', marginTop: '1rem' }}>View All Products</Link>
            </div>
          ) : (
            <div className="products-grid">
              {sorted.map((p: any) => <ProductCard key={p.dbId} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
