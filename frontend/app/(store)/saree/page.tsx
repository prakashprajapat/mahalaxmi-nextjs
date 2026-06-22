import type { Metadata } from 'next';
import { productsApi } from '@/lib/api';
import CategoryPageContent from '@/components/product/CategoryPageContent';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Saree | Mahalaxmi Fashion Hub',
  description: 'Designer & ethnic sarees — silk, cotton, georgette and more',
};

export default async function SareePage() {
  const { products } = await productsApi.getAll({ category: 'saree', pageSize: 200 }).catch(() => ({ products: [] }));
  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Shop by Category</p>
        <h1>🥻 Saree</h1>
        <p>Designer & ethnic sarees — silk, cotton, georgette and more</p>
      </section>
      <CategoryPageContent products={products as any} category="Saree" icon="🥻" desc="Designer & ethnic sarees — silk, cotton, georgette and more" allHref="/products?category=saree" />
    </>
  );
}
