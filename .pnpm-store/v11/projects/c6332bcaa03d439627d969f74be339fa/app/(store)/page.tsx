import Link from 'next/link';
import { productsApi } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';

export const revalidate = 60;

export default async function HomePage() {
  const { products } = await productsApi.getAll({ pageSize: 100 }).catch(() => ({ products: [] as any[] }));
  const bestSellers = products.filter((p: any) => p.bestSeller).slice(0, 8);
  const newArrivals = [...products].sort((a: any, b: any) => b.dbId - a.dbId).slice(0, 8);

  return (
    <>
      {/* Hero */}
      <section className="hero" id="hero">
        <img
          src="/hero-banner.jpg"
          alt="Mahalaxmi Fashion Hub"
          className="hero-bg-img"
        />
        <div className="hero-content-overlay">
          <p className="eyebrow" style={{ color: '#ffd6de' }}>New Arrivals 2026</p>
          <h1 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 800, margin: '0 0 .75rem', lineHeight: 1.15 }}>
            Every Look,<br />A New Experience
          </h1>
          <p className="hero-desc">
            Designer sarees, daily nightwear, petticoats, and fabric essentials — boutique feel, honest support, fast WhatsApp ordering.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/saree">Shop Sarees</Link>
            <Link className="button secondary" style={{ color: '#fff', borderColor: '#fff' }} href="/return-exchange">Return Policy</Link>
          </div>
          <div className="hero-badges">
            <span>Premium edits</span>
            <span>WhatsApp assistance</span>
            <span>Return support</span>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="section-wrap" id="categories">
        <h2 className="section-heading">Shop by Category</h2>
        <div className="category-grid">
          {[
            { label: 'Saree', href: '/saree', icon: '🥻', desc: 'Designer & ethnic sarees' },
            { label: 'Nighty', href: '/nighty', icon: '🌙', desc: 'Comfortable nightwear' },
            { label: 'Petticoat', href: '/petticoat', icon: '👗', desc: 'Quality inner skirts' },
            { label: 'Women', href: '/women', icon: '👩', desc: "Women's fashion" },
            { label: 'Men', href: '/men', icon: '👔', desc: "Men's wear" },
            { label: 'Popline', href: '/popline', icon: '🧵', desc: 'Popline fabric rolls' },
            { label: 'Nighty Cloth', href: '/nighty-cloth', icon: '🧶', desc: 'Fabric for tailoring' },
            { label: 'Best Sellers', href: '/best-sellers', icon: '⭐', desc: 'Most loved products' },
          ].map(cat => (
            <Link key={cat.href} href={cat.href} className="category-card">
              <div className="category-icon">{cat.icon}</div>
              <div className="category-label">{cat.label}</div>
              <div className="category-desc">{cat.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section style={{ background: '#fdf0f3', padding: '2.5rem 0' }}>
          <div className="section-wrap">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 className="section-heading" style={{ margin: 0 }}>Best Sellers</h2>
              <Link href="/best-sellers" style={{ color: '#a7354d', fontWeight: 600, fontSize: '.9rem' }}>View All →</Link>
            </div>
            <div className="products-grid">
              {bestSellers.map((p: any) => <ProductCard key={p.dbId} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="section-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 className="section-heading" style={{ margin: 0 }}>New Arrivals</h2>
            <Link href="/products" style={{ color: '#a7354d', fontWeight: 600, fontSize: '.9rem' }}>View All →</Link>
          </div>
          <div className="products-grid">
            {newArrivals.map((p: any) => <ProductCard key={p.dbId} product={p} />)}
          </div>
        </section>
      )}

      {/* Trust Strip */}
      <section style={{ background: '#1a1a2e', color: '#fff', padding: '2.5rem 1.5rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center' }}>
          {[
            { icon: '🚚', title: 'Fast Shipping', desc: 'Delivered across India' },
            { icon: '🔄', title: 'Easy Returns', desc: '7-day return policy' },
            { icon: '💬', title: 'WhatsApp Support', desc: '+91 9429429880' },
            { icon: '🔒', title: 'Secure Payment', desc: 'Razorpay encrypted checkout' },
          ].map(f => (
            <div key={f.title}>
              <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>{f.icon}</div>
              <strong style={{ display: 'block', marginBottom: '.25rem' }}>{f.title}</strong>
              <span style={{ fontSize: '.85rem', opacity: .7 }}>{f.desc}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
