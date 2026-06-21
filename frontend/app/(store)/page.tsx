import Link from 'next/link';
import { productsApi } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';

export const revalidate = 60;

const categories = [
  { label: 'Saree', href: '/products?category=saree', icon: '🥻', desc: 'Designer & ethnic sarees' },
  { label: 'Nighty', href: '/products?category=nighty', icon: '🌙', desc: 'Comfortable nightwear' },
  { label: 'Petticoat', href: '/products?category=petticoat', icon: '👗', desc: 'Quality inner skirts' },
  { label: 'Women', href: '/products?category=women', icon: '👩', desc: "Women's fashion" },
  { label: 'Men', href: '/products?category=men', icon: '👔', desc: "Men's wear" },
  { label: 'Popline', href: '/products?category=popline', icon: '🧵', desc: 'Popline fabric rolls' },
];

export default async function HomePage() {
  const { products } = await productsApi.getAll({ pageSize: 100 }).catch(() => ({ products: [] }));
  const bestSellers = products.filter((p: any) => p.bestSeller).slice(0, 8);
  const newArrivals = [...products].sort((a: any, b: any) => b.newest - a.newest).slice(0, 8);

  return (
    <>
      {/* Hero */}
      <section className="hero" id="hero">
        <img
          src="https://images.pexels.com/photos/2220316/pexels-photo-2220316.jpeg?auto=compress&cs=tinysrgb&w=1200"
          alt="Mahalaxmi Fashion Hub - Ethnic Wear"
          className="hero-bg-img"
        />
        <div className="hero-content-overlay">
          <p className="hero-desc">
            Designer sarees, daily nightwear, petticoats, and fabric essentials with a boutique feel, honest support, and fast WhatsApp ordering.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/products?category=saree">Shop Sarees</Link>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
          {categories.map(cat => (
            <Link key={cat.href} href={cat.href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#fff',
                border: '1.5px solid #e0e0e0',
                borderRadius: '12px',
                padding: '1.25rem 1rem',
                textAlign: 'center',
                transition: 'all .2s',
                cursor: 'pointer',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#a7354d'; (e.currentTarget as HTMLDivElement).style.background = '#fdf0f3'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e0e0e0'; (e.currentTarget as HTMLDivElement).style.background = '#fff'; }}
              >
                <div style={{ fontSize: '2.2rem', marginBottom: '.4rem' }}>{cat.icon}</div>
                <div style={{ fontWeight: 700, color: '#a7354d', fontSize: '.95rem', marginBottom: '.2rem' }}>{cat.label}</div>
                <div style={{ fontSize: '.77rem', color: '#888' }}>{cat.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="section-wrap" id="best-sellers" style={{ background: '#fdf0f3', maxWidth: '100%', padding: '2.5rem 0' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 className="section-heading" style={{ margin: 0 }}>Best Sellers</h2>
              <Link href="/products?bestSeller=true" style={{ color: '#a7354d', fontWeight: 600, fontSize: '.9rem' }}>View All →</Link>
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
