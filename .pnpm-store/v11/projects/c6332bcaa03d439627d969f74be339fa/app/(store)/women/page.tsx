import type { Metadata } from "next";
import { productsApi } from "@/lib/api";
import ProductCard from "@/components/product/ProductCard";
import Link from "next/link";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Women | Mahalaxmi Fashion Hub",
  description: "Women's fashion — ethnic and daily wear",
};

export default async function WomenPage() {
  const { products } = await productsApi.getAll({ category: "women", pageSize: 100 }).catch(() => ({ products: [] }));

  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Shop by Category</p>
        <h1>👩 Women</h1>
        <p>Women's fashion — ethnic and daily wear</p>
      </section>

      <main className="section-wrap">
        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#888" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👩</div>
            <p>No products found in this category yet.</p>
            <Link href="/products" className="button primary" style={{ display: "inline-block", marginTop: "1rem" }}>Browse All Products</Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 className="section-heading" style={{ margin: 0 }}>Women ({products.length})</h2>
              <Link href="/products?category=women" style={{ color: "#a7354d", fontWeight: 600, fontSize: ".9rem" }}>View All →</Link>
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
