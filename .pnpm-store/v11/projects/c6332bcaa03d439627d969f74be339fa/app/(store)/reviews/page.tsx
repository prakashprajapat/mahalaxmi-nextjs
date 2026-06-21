'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCustomer, getToken } from '@/lib/auth';
import { ordersApi, reviewsApi } from '@/lib/api';
import type { Order } from '@/types';

const STATIC_REVIEWS = [
  { name: 'Priya S.', location: 'Mumbai', rating: 5, text: 'Bahut sundar saree mili! Quality ekdum first-class hai. WhatsApp pe help bhi bahut achi mili. Definitely repeat customer!', product: 'Designer Saree', date: 'June 2026' },
  { name: 'Rekha M.', location: 'Jaipur', rating: 5, text: 'Nighty bahut comfortable hai, cotton quality excellent. Delivery bhi 4 din mein aa gayi. Highly recommended!', product: 'Cotton Nighty', date: 'June 2026' },
  { name: 'Sunita K.', location: 'Ahmedabad', rating: 4, text: 'Petticoat ki quality achhi hai, fitting bhi sahi hai. Packing bhi ekdum safe thi. Next order zaroor karungi.', product: 'Petticoat', date: 'May 2026' },
  { name: 'Kavita R.', location: 'Delhi', rating: 5, text: 'Silk saree dekh ke dil khush ho gaya! Colour exactly waisa hi aaya jaise photo mein tha. Return policy bhi clear hai.', product: 'Silk Saree', date: 'May 2026' },
  { name: 'Anita D.', location: 'Pune', rating: 5, text: 'Popline fabric ki quality bahut achi hai. Bulk order kiya tha, sab items sahi aaye. WhatsApp support 24/7 jaisi lagti hai!', product: 'Popline Fabric', date: 'April 2026' },
  { name: 'Meena T.', location: 'Balotra', rating: 5, text: 'Local store mein gaye the pehle, phir online order kiya. Dono jagah se experience bahut achha raha. Maa aur main dono satisfy hain!', product: 'Saree Collection', date: 'April 2026' },
];

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '.25rem' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => onChange(n)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.75rem', color: n <= (hover || value) ? '#f59e0b' : '#ddd', padding: 0, lineHeight: 1 }}>
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const customer = getCustomer();
  const token = getToken() ?? '';

  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedProductId, setSelectedProductId] = useState(0);
  const [selectedProductName, setSelectedProductName] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (!customer) return;
    setLoadingOrders(true);
    ordersApi.getAll({ phone: customer.phone, email: customer.email }, token)
      .then(r => setDeliveredOrders(r.orders.filter(o => o.status === 'Delivered')))
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, []);

  const handleSubmit = async () => {
    if (!selectedProductId) { setError('Please select a product.'); return; }
    if (!rating) { setError('Please select a rating.'); return; }
    if (!reviewText.trim()) { setError('Please write a review.'); return; }
    setSubmitting(true); setError('');
    try {
      await reviewsApi.submit({ productId: selectedProductId, rating, text: reviewText, orderId: selectedOrder?.id }, token);
      setSubmitted(true);
    } catch (e) {
      setError((e as Error).message || 'Failed to submit review. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">What Customers Say</p>
        <h1>Customer Reviews</h1>
        <p>Real reviews from real customers who have shopped at Mahalaxmi Fashion Hub.</p>
      </section>

      <main className="policy-page">
        {/* Submit Review Section (logged in customers) */}
        {customer && (
          <article className="policy-card" style={{ marginBottom: '2rem' }}>
            <h2>Write a Review</h2>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                <h3 style={{ color: '#a7354d' }}>Review Submitted — Pending Approval</h3>
                <p style={{ color: '#666', marginTop: '.5rem' }}>Thank you! Your review will appear here once approved by our team.</p>
                <button className="button secondary" onClick={() => { setSubmitted(false); setRating(0); setReviewText(''); setSelectedProductId(0); setSelectedProductName(''); setSelectedOrder(null); }} style={{ marginTop: '1.5rem' }}>
                  Write Another Review
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {/* Select Order */}
                {deliveredOrders.length > 0 ? (
                  <>
                    <div>
                      <label style={{ fontWeight: 600, fontSize: '.9rem', display: 'block', marginBottom: '.4rem' }}>Select your delivered order</label>
                      <select
                        value={selectedOrder?.id ?? ''}
                        onChange={e => {
                          const order = deliveredOrders.find(o => o.id === e.target.value) ?? null;
                          setSelectedOrder(order);
                          setSelectedProductId(0); setSelectedProductName('');
                        }}
                        style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.9rem' }}>
                        <option value="">— Choose an order —</option>
                        {deliveredOrders.map(o => (
                          <option key={o.id} value={o.id}>
                            Order #{o.id} — {new Date(o.placedAt ?? o.createdAt).toLocaleDateString('en-IN')}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Select Product from Order */}
                    {selectedOrder && (
                      <div>
                        <label style={{ fontWeight: 600, fontSize: '.9rem', display: 'block', marginBottom: '.4rem' }}>Select product to review</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                          {selectedOrder.cart.map((item, i) => (
                            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.6rem 1rem', border: `1.5px solid ${selectedProductId === Number(item.id) ? '#a7354d' : '#eee'}`, borderRadius: '8px', cursor: 'pointer', background: selectedProductId === Number(item.id) ? '#fdf0f3' : '#fff' }}>
                              <input type="radio" name="product" checked={selectedProductId === Number(item.id)}
                                onChange={() => { setSelectedProductId(Number(item.id)); setSelectedProductName(item.name); }}
                                style={{ accentColor: '#a7354d' }} />
                              {item.image && <img src={item.image} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />}
                              <span style={{ fontSize: '.9rem' }}>{item.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : loadingOrders ? (
                  <p style={{ color: '#aaa', fontSize: '.9rem' }}>Loading your orders…</p>
                ) : (
                  <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '1rem', fontSize: '.9rem', color: '#666' }}>
                    You need a delivered order to write a review. <Link href="/products" style={{ color: '#a7354d' }}>Shop now</Link>
                  </div>
                )}

                {/* Rating */}
                {selectedProductId > 0 && (
                  <>
                    <div>
                      <label style={{ fontWeight: 600, fontSize: '.9rem', display: 'block', marginBottom: '.4rem' }}>Your Rating for: {selectedProductName}</label>
                      <StarPicker value={rating} onChange={setRating} />
                      {rating > 0 && <span style={{ fontSize: '.85rem', color: '#888', marginTop: '.3rem', display: 'block' }}>
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                      </span>}
                    </div>

                    <div>
                      <label style={{ fontWeight: 600, fontSize: '.9rem', display: 'block', marginBottom: '.4rem' }}>Your Review</label>
                      <textarea
                        value={reviewText}
                        onChange={e => { setReviewText(e.target.value); setError(''); }}
                        placeholder="Share your experience with this product — quality, fit, delivery, etc."
                        rows={4}
                        style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.9rem', resize: 'vertical', boxSizing: 'border-box' }}
                      />
                    </div>

                    {error && <p style={{ color: '#c0392b', fontSize: '.88rem' }}>{error}</p>}

                    <div>
                      <button className="button primary" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? 'Submitting…' : 'Submit Review'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </article>
        )}

        {/* Static Reviews Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {STATIC_REVIEWS.map((r, i) => (
            <article key={i} className="policy-card" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.5rem' }}>
                <div>
                  <strong style={{ fontSize: '1rem' }}>{r.name}</strong>
                  <span style={{ display: 'block', fontSize: '.8rem', color: '#888' }}>{r.location}</span>
                </div>
                <div style={{ color: '#f59e0b', fontSize: '1rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
              </div>
              <p style={{ fontSize: '.9rem', color: '#444', lineHeight: 1.6, marginBottom: '.75rem' }}>{r.text}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', color: '#aaa' }}>
                <span>📦 {r.product}</span>
                <span>{r.date}</span>
              </div>
            </article>
          ))}
        </div>

        {!customer && (
          <article className="policy-card" style={{ textAlign: 'center' }}>
            <h2>Share Your Experience</h2>
            <p>Bought from us? <Link href="/account" style={{ color: '#a7354d' }}>Login to your account</Link> to write a review, or send it on WhatsApp.</p>
            <a href="https://wa.me/919429429880" target="_blank" rel="noopener noreferrer" className="button primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
              Write a Review on WhatsApp
            </a>
          </article>
        )}

        <article className="policy-card">
          <h2>Why Customers Trust Us</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '.75rem' }}>
            {[
              { icon: '⭐', label: '4.8/5 Average Rating' },
              { icon: '🚚', label: 'Fast Pan-India Delivery' },
              { icon: '🔄', label: '7-Day Return Window' },
              { icon: '💬', label: 'WhatsApp Support' },
            ].map(f => (
              <div key={f.label} style={{ textAlign: 'center', padding: '1rem', background: '#fdf0f3', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '.35rem' }}>{f.icon}</div>
                <strong style={{ fontSize: '.85rem', color: '#a7354d' }}>{f.label}</strong>
              </div>
            ))}
          </div>
        </article>
      </main>
    </>
  );
}
