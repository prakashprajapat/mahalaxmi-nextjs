import { productsApi } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import HeroBanner from '@/components/layout/HeroBanner';
import CategoryGrid from '@/components/layout/CategoryGrid';

export const revalidate = 60; // ISR — revalidate every 60s

export default async function HomePage() {
  const { products } = await productsApi.getAll({ pageSize: 100 }).catch(() => ({ products: [] }));

  const bestSellers  = products.filter(p => p.bestSeller).slice(0, 8);
  const newArrivals  = [...products].sort((a, b) => b.newest - a.newest).slice(0, 8);

  return (
    <>
      <HeroBanner />

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-center mb-6 text-[#8B1A1A]">Shop by Category</h2>
        <CategoryGrid />
      </section>

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-10">
          <h2 className="text-2xl font-bold mb-6 text-[#8B1A1A]">Best Sellers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {bestSellers.map(p => <ProductCard key={p.dbId} product={p} />)}
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-10">
          <h2 className="text-2xl font-bold mb-6 text-[#8B1A1A]">New Arrivals</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {newArrivals.map(p => <ProductCard key={p.dbId} product={p} />)}
          </div>
        </section>
      )}
    </>
  );
}
