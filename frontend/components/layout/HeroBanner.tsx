import Link from 'next/link';

export default function HeroBanner() {
  return (
    <div className="relative bg-gradient-to-br from-[#8B1A1A] via-[#a52020] to-[#6e1414] text-white overflow-hidden">
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #D4AF37 0%, transparent 60%), radial-gradient(circle at 80% 20%, #fff 0%, transparent 40%)' }} />

      <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 relative">
        <div className="max-w-lg">
          <p className="text-[#D4AF37] font-medium text-sm uppercase tracking-widest mb-3">New Collection 2024</p>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
            Elegance in<br />Every Thread
          </h1>
          <p className="text-white/80 mb-8 text-lg">
            Discover premium sarees, nighty, petticoats and more. Free shipping above ₹999.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/products" className="bg-[#D4AF37] text-[#1a1a1a] font-bold px-8 py-3 rounded-xl hover:bg-[#c4a030] transition-colors">
              Shop Now
            </Link>
            <Link href="/products?category=saree" className="border border-white/50 text-white px-8 py-3 rounded-xl hover:bg-white/10 transition-colors">
              View Sarees
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
