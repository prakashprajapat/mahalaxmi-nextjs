import { productsApi } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import ProductFilters from '@/components/product/ProductFilters';

export const revalidate = 60;

interface Props {
  searchParams: { category?: string; subcategory?: string; q?: string };
}

export default async function ProductsPage({ searchParams }: Props) {
  const { products } = await productsApi.getAll({
    category: searchParams.category,
    subcategory: searchParams.subcategory,
    pageSize: 100,
  }).catch(() => ({ products: [] }));

  const filtered = searchParams.q
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchParams.q!.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchParams.q!.toLowerCase()))
    : products;

  const title = searchParams.category
    ? searchParams.category.charAt(0).toUpperCase() + searchParams.category.slice(1)
    : 'All Products';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 text-[#8B1A1A]">{title}</h1>
      <p className="text-gray-500 mb-6">{filtered.length} products</p>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="w-full lg:w-56 shrink-0">
          <ProductFilters />
        </aside>

        <div className="flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No products found.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(p => <ProductCard key={p.dbId} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
