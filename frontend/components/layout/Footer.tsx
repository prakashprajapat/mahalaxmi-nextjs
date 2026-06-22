import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div className="site-footer-brand">
          <Link className="brand footer-brand" href="/">
            <span className="brand-mark">
              <img src="/logo.webp" alt="Mahalaxmi Fashion Hub logo" width="48" height="48"
                style={{ borderRadius: '8px' }} />
            </span>
            <span>
              <strong>Mahalaxmi Fashion Hub</strong>
              <span className="brand-tagline">Every Look, A New Experience</span>
            </span>
          </Link>
          <p>Designer sarees, daily nightwear, petticoats and fabric essentials — curated with a boutique touch.</p>
          <p className="site-footer-contact">Ward No. 45, Near Mahadev Temple, Balotra, Rajasthan 344022</p>
          <p className="site-footer-contact">📞 +91 9429429880</p>
        </div>

        <nav className="site-footer-col">
          <h2>Shop</h2>
          <Link href="/products?category=saree">Saree</Link>
          <Link href="/products?category=nighty">Nighty</Link>
          <Link href="/products?category=petticoat">Petticoat</Link>
          <Link href="/products?category=women">Women</Link>
          <Link href="/products?category=men">Men</Link>
          <Link href="/products?category=popline">Popline</Link>
          <Link href="/products?category=nighty-cloth">Nighty Cloth</Link>
          <Link href="/products?bestSeller=true">Best Sellers</Link>
        </nav>

        <nav className="site-footer-col">
          <h2>My Account</h2>
          <Link href="/account">Login / Signup</Link>
          <Link href="/orders">My Orders</Link>
          <Link href="/wishlist">Wishlist</Link>
          <Link href="/tracking">Track Order</Link>
          <Link href="/cart">Shopping Cart</Link>
          <Link href="/account/downloads">Downloads</Link>
        </nav>

        <nav className="site-footer-col">
          <h2>Help</h2>
          <Link href="/return-exchange">Returns &amp; Exchange</Link>
          <Link href="/cancellation-policy">Cancellation Policy</Link>
          <Link href="/return-policy">Return Policy</Link>
          <Link href="/shipping-delivery-policy">Shipping Policy</Link>
          <Link href="/safety-center">Safety Center</Link>
          <Link href="/contact">Contact Us</Link>
        </nav>

        <nav className="site-footer-col">
          <h2>Connect</h2>
          <a href="https://wa.me/919429429880" target="_blank" rel="noopener noreferrer">WhatsApp +91 9429429880</a>
          <a href="https://www.instagram.com/mahalaxmifashionhub.blt/" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://www.facebook.com/mahalaxmifashionhub.blt/" target="_blank" rel="noopener noreferrer">Facebook</a>
          <a href="mailto:contact@mahalaxmifashionhub.com">contact@mahalaxmifashionhub.com</a>
          <Link href="/about-us">About Us</Link>
        </nav>
      </div>

      <div className="site-footer-baseline">
        <small>&copy; {new Date().getFullYear()} Mahalaxmi Fashion Hub. All rights reserved.</small>
        <nav className="site-footer-legal">
          <Link href="/privacy-policy">Privacy</Link>
          <Link href="/return-policy">Returns</Link>
          <Link href="/cancellation-policy">Cancellation</Link>
          <Link href="/terms-conditions">Terms</Link>
          <Link href="/shipping-delivery-policy">Shipping</Link>
          <Link href="/safety-center">Safety</Link>
        </nav>
      </div>
    </footer>
  );
}
