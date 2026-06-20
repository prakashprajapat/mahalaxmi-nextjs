import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div className="col-span-2 sm:col-span-1">
          <h3 className="text-white font-bold text-lg mb-3">Mahalaxmi Fashion Hub</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Premium Indian fashion — Sarees, Nighty, Petticoat & more. Quality you can trust.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Shop</h4>
          <ul className="space-y-2 text-sm">
            {[
              ['Sarees', '/products?category=saree'],
              ['Nighty', '/products?category=nighty'],
              ['Petticoat', '/products?category=petticoat'],
              ['Best Sellers', '/products?bestSeller=true'],
              ['New Arrivals', '/products'],
            ].map(([label, href]) => (
              <li key={href}><Link href={href} className="hover:text-white">{label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Help</h4>
          <ul className="space-y-2 text-sm">
            {[
              ['Contact Us', '/contact'],
              ['About Us', '/about-us'],
              ['Track Order', '/orders'],
              ['Return Policy', '/return-policy'],
              ['Privacy Policy', '/privacy-policy'],
            ].map(([label, href]) => (
              <li key={href}><Link href={href} className="hover:text-white">{label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Contact</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>📧 contact@mahalaxmifashionhub.com</li>
            <li>📞 WhatsApp Support</li>
            <li className="flex gap-3 mt-3">
              <a href="#" className="hover:text-white">📱 Instagram</a>
              <a href="#" className="hover:text-white">📘 Facebook</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Mahalaxmi Fashion Hub. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms-conditions" className="hover:text-gray-300">Terms</Link>
            <Link href="/privacy-policy" className="hover:text-gray-300">Privacy</Link>
            <Link href="/cancellation-policy" className="hover:text-gray-300">Cancellation</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
