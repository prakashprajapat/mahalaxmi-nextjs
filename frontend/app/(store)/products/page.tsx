import type { Metadata } from 'next';
import { productsApi } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import Link from 'next/link';

export const revalidate = 60;

interface Props {
  searchParams: { category?: string; subcategory?: string; q?: string; bestSeller?: string };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const label = searchParams.category
    ? searchParams.category.charAt(0).toUpperCase() + searchParams.category.slice(1)
    : searchParams.bestSeller === 'true' ? 'Best Sellers' : 'All Products';
  return { title: `${label} | Mahalaxmi Fashion Hub` };
}

const categories = [
  { label: 'Saree', href: '/saree' },
  { label: 'Nighty', href: '/nighty' },
  { label: 'Petticoat', href: '/petticoat' },
  { label: 'Women', href: '/women' },
  { label: 'Men', href: '/men' },
  { label: 'Popline', href: '/popline' },
  { label: 'Nighty Cloth', href: '/nighty-cloth' },
  { label: 'Best Sellers', href: '/best-sellers' },
];

export default async function ProductsPage({ searchParams }: Props) {
  const { products } = await productsApi.getAll({
    category: searchParams.category,
    subcategory: searchParams.subcategory,
    bestSeller: searchParams.bestSeller === 'true' ? true : undefined,
    pageSize: 200,
  }).catch(() => ({ products: [] }));

  const filtered = searchParams.q
    ? products.filter((p: any) =>
        p.name.toLowerCase().includes(searchParams.q!.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchParams.q!.toLowerCase()))
    : products;

  const title = searchParams.bestSeller === 'true'
    ? 'Best Sellers'
    : searchParams.category
      ? searchParams.category.charAt(0).toUpperCase() + searchParams.category.slice(1)
      : 'All Products';

  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Shop</p>
        <h1>{title}</h1>
        <p>{filtered.length} product{filtered.length !== 1 ? 's' : ''} available</p>
      </section>

      <div style={{ display: 'flex', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Sidebar Filter */}
        <aside style={{ width: '200px', flexShrink: 0 }}>
          <div className="form-card" style={{ padding: '1.25rem', position: 'sticky', top: '1rem' }}>
            <h3 style={{ margin: '0 0 .75rem', fontSize: '.95rem', color: '#a7354d', fontWeight: 700 }}>Categories</h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
              <Link href="/products" style={{ fontSize: '.9rem', color: !searchParams.category ? '#a7354d' : '#444', fontWeight: !searchParams.category ? 700 : 400, padding: '.3rem .5rem', borderRadius: '4px', background: !searchParams.category ? '#fdf0f3' : 'transparent' }}>
                All Products
              </Link>
              {categories.map(c => (
                <Link key={c.href} href={c.href} style={{ fontSize: '.9rem', color: searchParams.category === c.label.toLowerCase().replace(' ', '-') ? '#a7354d' : '#444', fontWeight: searchParams.category === c.label.toLowerCase().replace(' ', '-') ? 700 : 400, padding: '.3rem .5rem', borderRadius: '4px', background: searchParams.category === c.label.toLowerCase().replace(' ', '-') ? '#fdf0f3' : 'transparent', textDecoration: 'none' }}>
                  {c.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Products Grid */}
        <div style={{ flex: 1 }}>
          {searchParams.q && (
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              Search results for: <strong>&ldquo;{searchParams.q}&rdquo;</strong>
            </p>
          )}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <p>No products found.</p>
              <Link href="/products" className="button primary" style={{ display: 'inline-block', marginTop: '1rem' }}>View All Products</Link>
            </div>
          ) : (
            <div className="products-grid">
              {filtered.map((p: any) => <ProductCard key={p.dbId} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
