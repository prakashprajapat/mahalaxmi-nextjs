import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Customer Reviews | Mahalaxmi Fashion Hub',
  description: 'Read what customers say about Mahalaxmi Fashion Hub sarees, nightwear and ethnic wear.',
};

const reviews = [
  { name: 'Priya S.', location: 'Mumbai', rating: 5, text: 'Bahut sundar saree mili! Quality ekdum first-class hai. WhatsApp pe help bhi bahut achi mili. Definitely repeat customer!', product: 'Designer Saree', date: 'June 2026' },
  { name: 'Rekha M.', location: 'Jaipur', rating: 5, text: 'Nighty bahut comfortable hai, cotton quality excellent. Delivery bhi 4 din mein aa gayi. Highly recommended!', product: 'Cotton Nighty', date: 'June 2026' },
  { name: 'Sunita K.', location: 'Ahmedabad', rating: 4, text: 'Petticoat ki quality achhi hai, fitting bhi sahi hai. Packing bhi ekdum safe thi. Next order zaroor karungi.', product: 'Petticoat', date: 'May 2026' },
  { name: 'Kavita R.', location: 'Delhi', rating: 5, text: 'Silk saree dekh ke dil khush ho gaya! Colour exactly waisa hi aaya jaise photo mein tha. Return policy bhi clear hai.', product: 'Silk Saree', date: 'May 2026' },
  { name: 'Anita D.', location: 'Pune', rating: 5, text: 'Popline fabric ki quality bahut achi hai. Bulk order kiya tha, sab items sahi aaye. WhatsApp support 24/7 jaisi lagti hai!', product: 'Popline Fabric', date: 'April 2026' },
  { name: 'Meena T.', location: 'Balotra', rating: 5, text: 'Local store mein gaye the pehle, phir online order kiya. Dono jagah se experience bahut achha raha. Maa aur main dono satisfy hain!', product: 'Saree Collection', date: 'April 2026' },
];

export default function ReviewsPage() {
  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">What Customers Say</p>
        <h1>Customer Reviews</h1>
        <p>Real reviews from real customers who have shopped at Mahalaxmi Fashion Hub.</p>
      </section>

      <main className="policy-page">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {reviews.map((r, i) => (
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

        <article className="policy-card" style={{ textAlign: 'center' }}>
          <h2>Share Your Experience</h2>
          <p>Bought from us? We would love to hear from you. Send your review on WhatsApp and we will feature it here.</p>
          <a href="https://wa.me/919429429880" target="_blank" rel="noopener noreferrer" className="button primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
            Write a Review on WhatsApp
          </a>
        </article>

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
