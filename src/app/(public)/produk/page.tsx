import type { Metadata } from "next";
import { EmptyState } from "@/components/ui";
import { ListShell } from "@/components/site/ListShell";
import { ProductRow } from "@/components/site/ProductRow";
import { SearchForm } from "@/components/site/SearchForm";
import { sellerName } from "@/lib/format";
import { getAllLandingProducts, getLandingTenants } from "@/lib/server-api";
import { matches } from "@/lib/sellers";

export const metadata: Metadata = { title: "Produk" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const [{ products, failed }, { tenants }] = await Promise.all([getAllLandingProducts(), getLandingTenants()]);
  const list = query
    ? products.filter((p) => matches(p.name, query) || matches(p.description, query) || matches(sellerName(p), query))
    : products;

  return (
    <ListShell
      sideTitle="UMKM"
      sideLinks={tenants.map((t) => ({ href: `/umkm/${t.id}`, label: t.name }))}
      title={query ? `HASIL PENCARIAN` : "SEMUA PRODUK"}
      toolbar={<SearchForm action="/produk" defaultValue={query} placeholder="Cari produk..." />}
    >
      {query && (
        <p style={{ margin: "0 0 12px 8px", fontWeight: 600, color: "var(--gray-700)" }}>
          {list.length} produk untuk &ldquo;{query}&rdquo;
        </p>
      )}
      {failed ? (
        <EmptyState title="Produk belum dapat dimuat">Silakan muat ulang halaman beberapa saat lagi.</EmptyState>
      ) : list.length === 0 ? (
        <EmptyState title={query ? "Produk tidak ditemukan" : "Belum ada produk"}>
          {query ? "Coba kata kunci lain." : "Produk akan tampil setelah disetujui administrator."}
        </EmptyState>
      ) : (
        list.map((p) => <ProductRow key={p.id} product={p} />)
      )}
    </ListShell>
  );
}
