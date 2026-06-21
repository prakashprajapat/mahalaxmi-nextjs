import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Us | Mahalaxmi Fashion Hub',
  description: 'Contact us for orders, product queries, returns, or support. WhatsApp, phone, and store address available.',
};

export default function ContactPage() {
  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Get in Touch</p>
        <h1>Contact Us</h1>
        <p>We are here to help — for orders, product queries, returns, or any support. Reach us on WhatsApp for the fastest response.</p>
      </section>

      <main className="policy-page">
        <article className="policy-card">
          <h2>WhatsApp &amp; Phone</h2>
          <p>For the fastest support, message or call us directly on WhatsApp:</p>
          <p><strong>+91 9429429880</strong></p>
          <p><a href="https://wa.me/919429429880" target="_blank" rel="noopener noreferrer" style={{ color: '#a7354d', fontWeight: 600 }}>Chat on WhatsApp →</a></p>

          <h2>Store Address</h2>
          <p>Ward No. 45, Near Mahadev Temple,<br />Balotra, Rajasthan — 344022, India.</p>
          <p>Store hours: Monday to Saturday, 10:00 AM – 8:00 PM.</p>

          <h2>Social Media</h2>
          <ol>
            <li><a href="https://www.instagram.com/mahalaxmifashionhub.blt/" target="_blank" rel="noopener noreferrer">Instagram — @mahalaxmifashionhub.blt</a></li>
            <li><a href="https://www.facebook.com/mahalaxmifashionhub.blt/" target="_blank" rel="noopener noreferrer">Facebook — Mahalaxmi Fashion Hub</a></li>
          </ol>

          <h2>Common Queries</h2>
          <ol>
            <li><strong>Order status:</strong> Use the <Link href="/tracking">Track Order</Link> page or WhatsApp us your order ID.</li>
            <li><strong>Returns &amp; exchange:</strong> See our <Link href="/return-exchange">Refund &amp; Exchange Policy</Link> or WhatsApp us within the return window.</li>
            <li><strong>Product availability:</strong> Send us a WhatsApp message with the product name or image for real-time stock updates.</li>
            <li><strong>Custom orders:</strong> Contact us on WhatsApp to discuss bulk orders, custom saree selection, or gifting queries.</li>
          </ol>

          <h2>Response Time</h2>
          <p>We typically respond within 1–2 hours on WhatsApp during store hours (Mon–Sat, 10 AM – 8 PM). Orders placed on Sunday are processed the following Monday.</p>
        </article>
      </main>
    </>
  );
}
