import type { Metadata } from 'next';
import { productsApi } from '@/lib/api';
import CategoryPageContent from '@/components/product/CategoryPageContent';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Popline | Mahalaxmi Fashion Hub',
  description: 'Popline cotton fabric and printed dress material',
};

export default async function PoplinePage() {
  const { products } = await productsApi.getAll({ category: 'popline', pageSize: 200 }).catch(() => ({ products: [] }));
  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Shop by Category</p>
        <h1>🧵 Popline</h1>
        <p>Popline cotton fabric and printed dress material</p>
      </section>
      <CategoryPageContent products={products as any} category="Popline" icon="🧵" desc="Popline cotton fabric and printed dress material" allHref="/products?category=popline" />
    </>
  );
}
