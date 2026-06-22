import type { Metadata } from 'next';
import { productsApi } from '@/lib/api';
import CategoryPageContent from '@/components/product/CategoryPageContent';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Petticoat | Mahalaxmi Fashion Hub',
  description: 'Cotton and shantoon petticoats in all waist sizes',
};

export default async function PetticoatPage() {
  const { products } = await productsApi.getAll({ category: 'petticoat', pageSize: 200 }).catch(() => ({ products: [] }));
  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Shop by Category</p>
        <h1>👗 Petticoat</h1>
        <p>Cotton and shantoon petticoats in all waist sizes</p>
      </section>
      <CategoryPageContent products={products as any} category="Petticoat" icon="👗" desc="Cotton and shantoon petticoats in all waist sizes" allHref="/products?category=petticoat" />
    </>
  );
}
