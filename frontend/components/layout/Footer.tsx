import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div className="site-footer-brand">
          <Link className="brand footer-brand" href="/">
            <span className="brand-mark">
              <img src="/logo.webp" alt="Mahalaxmi Fashion Hub logo" width="48" height="48"
                style={{ borderRadius: '8px' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </span>
            <span>
              <strong>Mahalaxmi Fashion Hub</strong>
              <span className="brand-tagline">Every Look, A New Experience</span>
            </span>
          </Link>
          <p>Designer sarees, daily nightwear, petticoats and fabric essentials — curated with a boutique touch.</p>
          <p className="site-footer-contact">Ward No. 45, Near Mahadev Temple, Balotra, Rajasthan 344022</p>
        </div>

        <nav className="site-footer-col">
          <h2>Shop</h2>
          <Link href="/products?category=saree">Saree</Link>
          <Link href="/products?category=nighty">Nighty</Link>
          <Link href="/products?category=petticoat">Petticoat</Link>
          <Link href="/products?bestSeller=true">Best Sellers</Link>
          <Link href="/products?category=popline">Popline</Link>
        </nav>

        <nav className="site-footer-col">
          <h2>Help</h2>
          <Link href="/tracking">Track Order</Link>
          <Link href="/return-exchange">Returns &amp; Exchange</Link>
          <Link href="/cancellation-policy">Cancellation Policy</Link>
          <Link href="/return-policy">Return Policy</Link>
          <Link href="/account">My Account</Link>
        </nav>

        <nav className="site-footer-col">
          <h2>Connect</h2>
          <a href="https://wa.me/919429429880" target="_blank" rel="noopener noreferrer">WhatsApp +91 9429429880</a>
          <a href="https://www.instagram.com/mahalaxmifashionhub.blt/" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://www.facebook.com/mahalaxmifashionhub.blt/" target="_blank" rel="noopener noreferrer">Facebook</a>
          <a href="mailto:contact@mahalaxmifashionhub.com">contact@mahalaxmifashionhub.com</a>
        </nav>
      </div>

      <div className="site-footer-baseline">
        <small>&copy; {new Date().getFullYear()} Mahalaxmi Fashion Hub. All rights reserved.</small>
        <nav className="site-footer-legal">
          <Link href="/privacy-policy">Privacy</Link>
          <Link href="/return-policy">Returns</Link>
          <Link href="/cancellation-policy">Cancellation</Link>
          <Link href="/terms-conditions">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
