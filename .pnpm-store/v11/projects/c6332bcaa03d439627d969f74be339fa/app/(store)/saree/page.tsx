import type { Metadata } from "next";
import { productsApi } from "@/lib/api";
import ProductCard from "@/components/product/ProductCard";
import Link from "next/link";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Saree | Mahalaxmi Fashion Hub",
  description: "Designer &amp; ethnic sarees — silk, cotton, georgette and more",
};

export default async function SareePage() {
  const { products } = await productsApi.getAll({ category: "saree", pageSize: 100 }).catch(() => ({ products: [] }));

  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Shop by Category</p>
        <h1>🥻 Saree</h1>
        <p>Designer &amp; ethnic sarees — silk, cotton, georgette and more</p>
      </section>

      <main className="section-wrap">
        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#888" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🥻</div>
            <p>No products found in this category yet.</p>
            <Link href="/products" className="button primary" style={{ display: "inline-block", marginTop: "1rem" }}>Browse All Products</Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 className="section-heading" style={{ margin: 0 }}>Saree ({products.length})</h2>
              <Link href="/products?category=saree" style={{ color: "#a7354d", fontWeight: 600, fontSize: ".9rem" }}>View All →</Link>
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
