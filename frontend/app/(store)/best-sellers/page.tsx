import type { Metadata } from "next";
import { productsApi } from "@/lib/api";
import ProductCard from "@/components/product/ProductCard";
import Link from "next/link";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Best Sellers | Mahalaxmi Fashion Hub",
  description: "Our most popular products — bestselling sarees, nightwear, petticoats and more",
};

export default async function BestSellersPage() {
  const { products } = await productsApi.getAll({ bestSeller: true, pageSize: 100 }).catch(() => ({ products: [] }));

  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Most Loved</p>
        <h1>⭐ Best Sellers</h1>
        <p>Our most popular products — loved by thousands of customers across India.</p>
      </section>

      <main className="section-wrap">
        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#888" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⭐</div>
            <p>Best sellers coming soon!</p>
            <Link href="/products" className="button primary" style={{ display: "inline-block", marginTop: "1rem" }}>Browse All Products</Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 className="section-heading" style={{ margin: 0 }}>Best Sellers ({products.length})</h2>
            </div>
            <div className="products-grid">
              {products.map((p: any) => <ProductCard key={p.dbId} product={p} />)}
            </div>
          </>
        )}
      </main>
    </>
  );
}
