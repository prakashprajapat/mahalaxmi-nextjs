'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { productsApi, reviewsApi } from '@/lib/api';
import { addToCart } from '@/lib/cart';
import { addToWishlist, isInWishlist } from '@/lib/wishlist';
import { getCustomer, getToken } from '@/lib/auth';
import type { Product, Review } from '@/types';

interface ExtraJson {
  sizes?: string[];
  colors?: string[];
  colorCodes?: Record<string, string>;
  variantMatrix?: Record<string, number>;
  images?: string[];
  packImages?: string[];
}

function Stars({ n, onClick }: { n: number; onClick?: (v: number) => void }) {
  return (
    <span style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} onClick={() => onClick?.(i)} style={{ color: i <= n ? '#f59e0b' : '#ddd', fontSize: '1.1rem' }}>★</span>
      ))}
    </span>
  );
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [extra, setExtra] = useState<ExtraJson>({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [activeImg, setActiveImg] = useState('');
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  // Review form
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    productsApi.getById(Number(params.id))
      .then(r => {
        setProduct(r.product);
        setWishlisted(isInWishlist(r.product.dbId));
        let ex: ExtraJson = {};
        try { ex = JSON.parse((r.product as any).extraJson ?? '{}'); } catch { ex = {}; }
        setExtra(ex);
        setActiveImg(r.product.image ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    reviewsApi.getByProduct(Number(params.id))
      .then(r => setReviews(r.reviews ?? []))
      .catch(() => setReviews([]));
  }, [params.id]);

  if (loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>Loading…</div>
  );
  if (!product) return (
    <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <p style={{ color: '#aaa' }}>Product not found.</p>
      <Link href="/products" className="button primary">Browse Products</Link>
    </div>
  );

  const price = product.discountPrice ?? product.price;
  const saving = product.price > price ? Math.round(((product.price - price) / product.price) * 100) : 0;

  const gallery: string[] = [];
  if (product.image) gallery.push(product.image);
  (extra.images ?? []).forEach(img => { if (img && !gallery.includes(img)) gallery.push(img); });
  (extra.packImages ?? []).forEach(img => { if (img && !gallery.includes(img)) gallery.push(img); });

  const sizes: string[] = extra.sizes ?? (extra.variantMatrix ? [...new Set(Object.keys(extra.variantMatrix).map(k => k.split('|')[0]))] : []);
  const colors: string[] = extra.colors ?? (extra.variantMatrix ? [...new Set(Object.keys(extra.variantMatrix).map(k => k.split('|')[1]).filter(Boolean))] : []);
  const colorCodes: Record<string, string> = extra.colorCodes ?? {};

  const variantKey = colors.length > 0 ? `${size}|${color}` : size;
  const variantStock = extra.variantMatrix ? (extra.variantMatrix[variantKey] ?? null) : null;
  const outOfStock = product.stock === 'Out of Stock' || (variantStock !== null && variantStock === 0);

  const handleAddToCart = () => {
    if (outOfStock) return;
    addToCart(product, qty, size || undefined);
    setAdded(true);
    window.dispatchEvent(new Event('cart-updated'));
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = () => { addToWishlist(product); setWishlisted(true); };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const customer = getCustomer();
    if (!customer) { setReviewMsg('Please login to submit a review.'); return; }
    if (!reviewText.trim()) { setReviewMsg('Please write your review.'); return; }
    setSubmittingReview(true); setReviewMsg('');
    try {
      await reviewsApi.submit({ productId: product.dbId, rating, text: reviewText.trim() }, getToken() ?? '');
      setReviewMsg('✅ Review submitted! It will appear after approval.');
      setReviewText(''); setRating(5);
    } catch (e) { setReviewMsg('❌ ' + (e as Error).message); }
    finally { setSubmittingReview(false); }
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <>
      {/* Breadcrumb */}
      <nav style={{ background: '#f9f9f9', borderBottom: '1px solid #eee', padding: '.6rem 1.5rem', fontSize: '.83rem', color: '#888' }}>
        <Link href="/" style={{ color: '#a7354d' }}>Home</Link> &rsaquo;{' '}
        <Link href="/products" style={{ color: '#a7354d' }}>Products</Link> &rsaquo;{' '}
        {product.category && <><Link href={`/${product.category.toLowerCase().replace(' ','-')}`} style={{ color: '#a7354d' }}>{product.category}</Link> &rsaquo; </>}
        <span>{product.name}</span>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'start' }}>

          {/* Image Gallery */}
          <div>
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '3/4', background: '#f5f5f5', marginBottom: '.75rem' }}>
              {activeImg
                ? <img src={activeImg} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', color: '#ddd' }}>👗</div>}
              {product.bestSeller && <span className="badge badge-yellow" style={{ position: 'absolute', top: 12, left: 12 }}>Best Seller</span>}
              {saving > 0 && <span className="badge badge-red" style={{ position: 'absolute', top: product.bestSeller ? 44 : 12, left: 12 }}>{saving}% off</span>}
            </div>
            {gallery.length > 1 && (
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                {gallery.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(img)} style={{
                    width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden',
                    border: activeImg === img ? '2px solid #a7354d' : '2px solid #eee',
                    padding: 0, cursor: 'pointer', background: '#f5f5f5', flexShrink: 0,
                  }}>
                    <img src={img} alt={`View ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <p style={{ fontSize: '.78rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.35rem' }}>{product.category}</p>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 .5rem', color: '#1a1a1a', lineHeight: 1.25 }}>{product.name}</h1>
              {avgRating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.25rem' }}>
                  <Stars n={Math.round(Number(avgRating))} />
                  <span style={{ fontSize: '.85rem', color: '#555', fontWeight: 600 }}>{avgRating}</span>
                  <span style={{ fontSize: '.8rem', color: '#aaa' }}>({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                </div>
              )}
              <p style={{ fontSize: '.85rem', color: product.stock === 'In Stock' ? '#27ae60' : '#e74c3c', fontWeight: 600 }}>{product.stock}</p>
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '.75rem', flexWrap: 'wrap' }}>
              <span className="price" style={{ fontSize: '2rem' }}>₹{price.toLocaleString('en-IN')}</span>
              {saving > 0 && (
                <>
                  <span className="price-orig" style={{ fontSize: '1.1rem' }}>₹{product.price.toLocaleString('en-IN')}</span>
                  <span style={{ background: '#e8f5e9', color: '#27ae60', padding: '.2rem .6rem', borderRadius: '20px', fontSize: '.82rem', fontWeight: 700 }}>Save {saving}%</span>
                </>
              )}
            </div>

            {/* Colors */}
            {colors.length > 0 && (
              <div>
                <p style={{ fontWeight: 600, fontSize: '.9rem', marginBottom: '.5rem' }}>
                  Select Color {color && <span style={{ fontWeight: 400, color: '#888' }}>— {color}</span>}
                </p>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  {colors.map(c => (
                    <button key={c} onClick={() => setColor(c)} title={c} style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: colorCodes[c] ?? '#ccc',
                      border: color === c ? '3px solid #a7354d' : '2px solid #ddd',
                      cursor: 'pointer', outline: color === c ? '2px solid #a7354d' : 'none',
                      outlineOffset: '2px',
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
              <div>
                <p style={{ fontWeight: 600, fontSize: '.9rem', marginBottom: '.5rem' }}>Select Size</p>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  {sizes.map(s => {
                    const vKey = colors.length > 0 ? `${s}|${color}` : s;
                    const stock = extra.variantMatrix ? (extra.variantMatrix[vKey] ?? null) : null;
                    const oos = stock !== null && stock === 0;
                    return (
                      <button key={s} onClick={() => !oos && setSize(s)} disabled={oos} style={{
                        minWidth: '44px', height: '40px', padding: '0 .75rem', borderRadius: '6px',
                        border: size === s ? '2px solid #a7354d' : '1.5px solid #ddd',
                        background: oos ? '#f5f5f5' : size === s ? '#a7354d' : '#fff',
                        color: oos ? '#ccc' : size === s ? '#fff' : '#333',
                        fontSize: '.85rem', fontWeight: 600,
                        cursor: oos ? 'not-allowed' : 'pointer',
                        textDecoration: oos ? 'line-through' : 'none',
                      }}>{s}</button>
                    );
                  })}
                </div>
                {variantStock !== null && (
                  <p style={{ fontSize: '.8rem', marginTop: '.4rem', color: outOfStock ? '#e74c3c' : '#27ae60', fontWeight: 600 }}>
                    {outOfStock ? 'Out of stock for this selection' : `${variantStock} in stock`}
                  </p>
                )}
              </div>
            )}

            {/* Quantity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <span style={{ fontWeight: 600, fontSize: '.9rem' }}>Quantity:</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                <button onClick={() => setQty(q => Math.max(1, q-1))} style={{ width: '36px', height: '36px', border: 'none', background: '#f5f5f5', cursor: 'pointer', fontSize: '1.1rem' }}>−</button>
                <span style={{ width: '36px', textAlign: 'center', fontWeight: 700 }}>{qty}</span>
                <button onClick={() => setQty(q => q+1)} style={{ width: '36px', height: '36px', border: 'none', background: '#f5f5f5', cursor: 'pointer', fontSize: '1.1rem' }}>+</button>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              <button onClick={handleAddToCart} disabled={outOfStock} className="button primary" style={{ flex: 1, minWidth: '140px', opacity: outOfStock ? .5 : 1 }}>
                {outOfStock ? 'Out of Stock' : added ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
              <button onClick={() => { if (!outOfStock) { handleAddToCart(); router.push('/checkout'); } }} disabled={outOfStock} className="button secondary" style={{ flex: 1, minWidth: '140px', opacity: outOfStock ? .5 : 1 }}>
                Buy Now
              </button>
            </div>

            <button onClick={handleWishlist} style={{ background: 'none', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem 1rem', cursor: 'pointer', color: wishlisted ? '#a7354d' : '#666', fontWeight: 600, fontSize: '.9rem', width: '100%' }}>
              {wishlisted ? '❤️ Saved to Wishlist' : '🤍 Add to Wishlist'}
            </button>

            {/* WhatsApp */}
            <a href={`https://wa.me/919429429880?text=Hi, I'm interested in: ${encodeURIComponent(product.name)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: '#25d366', fontWeight: 600, fontSize: '.9rem', textDecoration: 'none' }}>
              <span style={{ fontSize: '1.2rem' }}>💬</span> Order on WhatsApp
            </a>

            {/* Description */}
            {product.description && (
              <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '.5rem' }}>Product Details</h3>
                <p style={{ color: '#555', fontSize: '.9rem', lineHeight: 1.7 }}>{product.description}</p>
              </div>
            )}

            {/* Trust badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.5rem', paddingTop: '.5rem', borderTop: '1px solid #eee' }}>
              {[
                { icon: '🚚', text: 'Fast Shipping' },
                { icon: '🔄', text: '7-Day Return' },
                { icon: '🔒', text: 'Secure Pay' },
              ].map(b => (
                <div key={b.text} style={{ textAlign: 'center', fontSize: '.75rem', color: '#777' }}>
                  <div style={{ fontSize: '1.3rem' }}>{b.icon}</div>
                  {b.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div style={{ marginTop: '3rem', borderTop: '2px solid #eee', paddingTop: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            Customer Reviews {avgRating && <span style={{ fontSize: '1rem', color: '#f59e0b', fontWeight: 800 }}>★ {avgRating}</span>}
            <span style={{ fontSize: '.85rem', color: '#aaa', fontWeight: 400, marginLeft: '.5rem' }}>({reviews.length})</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
            {/* Reviews List */}
            <div>
              {reviews.length === 0 ? (
                <p style={{ color: '#aaa', fontStyle: 'italic' }}>No reviews yet. Be the first to review!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {reviews.map(r => (
                    <div key={r.id} style={{ background: '#f9f9f9', borderRadius: '10px', padding: '1rem', border: '1px solid #eee' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.5rem' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '.9rem' }}>{r.customerName || 'Customer'}</span>
                          <div style={{ marginTop: '.15rem' }}><Stars n={r.rating} /></div>
                        </div>
                        {r.createdAt && (
                          <span style={{ fontSize: '.75rem', color: '#aaa' }}>
                            {new Date(r.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '.88rem', color: '#555', lineHeight: 1.6, margin: 0 }}>{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Write a Review */}
            <div style={{ background: '#fdf0f3', borderRadius: '12px', padding: '1.25rem', border: '1.5px solid #f5c6cb' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem', color: '#a7354d' }}>Write a Review</h3>
              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                <div>
                  <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '.35rem' }}>Your Rating</label>
                  <Stars n={rating} onClick={setRating} />
                </div>
                <div>
                  <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '.35rem' }}>Your Review</label>
                  <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} rows={4}
                    placeholder="Share your experience..."
                    style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.88rem', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                {reviewMsg && <p style={{ fontSize: '.85rem', color: reviewMsg.startsWith('✅') ? '#27ae60' : '#c0392b', fontWeight: 600 }}>{reviewMsg}</p>}
                <button type="submit" disabled={submittingReview} className="button primary" style={{ alignSelf: 'flex-start' }}>
                  {submittingReview ? 'Submitting…' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
