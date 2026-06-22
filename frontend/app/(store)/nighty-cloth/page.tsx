import type { Metadata } from 'next';
import { productsApi } from '@/lib/api';
import CategoryPageContent from '@/components/product/CategoryPageContent';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Nighty Cloth | Mahalaxmi Fashion Hub',
  description: 'Nighty cloth and rayon nightwear fabric for tailoring',
};

export default async function NightyClothPage() {
  const { products } = await productsApi.getAll({ category: 'nighty-cloth', pageSize: 200 }).catch(() => ({ products: [] }));
  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Shop by Category</p>
        <h1>🧶 Nighty Cloth</h1>
        <p>Nighty cloth and rayon nightwear fabric for tailoring</p>
      </section>
      <CategoryPageContent products={products as any} category="Nighty Cloth" icon="🧶" desc="Nighty cloth and rayon nightwear fabric for tailoring" allHref="/products?category=nighty-cloth" />
    </>
  );
}
