import Link from 'next/link';
import { productsApi, settingsApi } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';

export const revalidate = 60;

export default async function HomePage() {
  const [{ products }, settings] = await Promise.all([
    productsApi.getAll({ pageSize: 100 }).catch(() => ({ products: [] as any[] })),
    settingsApi.getAll().catch(() => ({ settings: {} as Record<string, string> })),
  ]);

  const bestSellers = products.filter((p: any) => p.bestSeller).slice(0, 8);
  const newArrivals = [...products].sort((a: any, b: any) => b.dbId - a.dbId).slice(0, 8);

  const s = settings.settings ?? {};
  const offerEnabled = s.offerEnabled === 'true';
  const offerEyebrow = s.offerEyebrow || 'Festival Offer';
  const offerTitle = s.offerTitle || 'Fresh festive deals are live now';
  const offerText = s.offerText || 'Update this banner anytime from the admin panel to promote discounts, launches, or special collections.';
  const offerButtonLabel = s.offerButtonLabel || 'Explore Offer';
  const offerButtonLink = s.offerButtonLink || '/products?bestSeller=true';

  return (
    <>
      {/* Hero */}
      <section style={{ position: 'relative', width: '100%' }}>
        <img
          src="/hero-banner.jpg"
          alt="Mahalaxmi Fashion Hub - Ethnic Wear for the Entire Family"
          style={{ width: '100%', display: 'block' }}
        />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '0 4% 3%'
        }}>
          <p style={{ color: '#ffd6de', fontSize: '.9rem', marginBottom: '.5rem', letterSpacing: 2 }}>NEW ARRIVALS 2026</p>
          <h1 style={{ color: '#fff', fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', fontWeight: 800, margin: '0 0 .75rem', lineHeight: 1.2, maxWidth: '50%' }}>
            Every Look,<br />A New Experience
          </h1>
          <p style={{ color: '#f0e6ea', fontSize: 'clamp(.8rem, 1.5vw, 1rem)', marginBottom: '1.25rem', maxWidth: '42%' }}>
            Designer sarees, daily nightwear, petticoats, and fabric essentials — boutique feel, honest support, fast WhatsApp ordering.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link className="button primary" href="/saree">Shop Sarees</Link>
            <Link href="/return-exchange" style={{ color: '#fff', border: '1.5px solid #fff', padding: '.55rem 1.4rem', borderRadius: '8px', fontWeight: 600, fontSize: '.95rem', textDecoration: 'none' }}>Return Policy</Link>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {['Premium edits', 'WhatsApp assistance', 'Return support'].map(badge => (
              <span key={badge} style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', padding: '.25rem .75rem', borderRadius: '20px', fontSize: '.78rem', backdropFilter: 'blur(4px)' }}>{badge}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Offer Banner */}
      {offerEnabled && (
        <section style={{ background: 'linear-gradient(135deg, #a7354d 0%, #5c1a28 100%)', color: '#fff', padding: '2rem 1.5rem' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.1em', opacity: .8, marginBottom: '.35rem' }}>{offerEyebrow}</p>
              <h2 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: 800, margin: '0 0 .5rem' }}>{offerTitle}</h2>
              <p style={{ opacity: .85, fontSize: '.9rem', maxWidth: '500px' }}>{offerText}</p>
            </div>
            <Link href={offerButtonLink} className="button" style={{ background: '#fff', color: '#a7354d', fontWeight: 700, whiteSpace: 'nowrap', padding: '.65rem 1.5rem', borderRadius: '8px', textDecoration: 'none', flexShrink: 0 }}>
              {offerButtonLabel}
            </Link>
          </div>
        </section>
      )}

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
        <section style={{ background: '#fdf0f3', padding: '2.5rem 0' }} id="best-sellers">
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

      {/* Why Shop With Us */}
      <section style={{ background: '#fafafa', padding: '2.5rem 1.5rem', borderTop: '1px solid #eee' }}>
        <div className="section-wrap">
          <h2 className="section-heading" style={{ marginBottom: '1.5rem' }}>Why Customers Stay</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[
              { icon: '🧵', title: 'Fabric-focused collections', desc: 'Curated for festive and daily wear — every piece chosen for quality and value.' },
              { icon: '💬', title: 'WhatsApp assistance', desc: 'Get 1:1 help before ordering. Ask about fabric, size, or availability on chat.' },
              { icon: '🔄', title: '7-day returns', desc: 'Easy returns and exchange within 7 days of delivery with full policy transparency.' },
              { icon: '🚚', title: 'Pan-India shipping', desc: 'Fast delivery via Delhivery across India. Track your order live.' },
            ].map(f => (
              <div key={f.title} style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #eee' }}>
                <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>{f.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '.4rem' }}>{f.title}</h3>
                <p style={{ color: '#666', fontSize: '.88rem', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
