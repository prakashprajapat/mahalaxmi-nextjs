import type { Metadata } from 'next';
import { productsApi } from '@/lib/api';
import CategoryPageContent from '@/components/product/CategoryPageContent';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Nighty | Mahalaxmi Fashion Hub',
  description: 'Cotton, printed and zip nightwear for everyday comfort',
};

export default async function NightyPage() {
  const { products } = await productsApi.getAll({ category: 'nighty', pageSize: 200 }).catch(() => ({ products: [] }));
  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Shop by Category</p>
        <h1>🌙 Nighty</h1>
        <p>Cotton, printed and zip nightwear for everyday comfort</p>
      </section>
      <CategoryPageContent products={products as any} category="Nighty" icon="🌙" desc="Cotton, printed and zip nightwear for everyday comfort" allHref="/products?category=nighty" />
    </>
  );
}
