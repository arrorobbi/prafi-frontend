import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { ListShell } from "@/components/site/ListShell";
import { ProductRow } from "@/components/site/ProductRow";
import { SearchForm } from "@/components/site/SearchForm";
import { sellerName } from "@/lib/format";
import { getAllLandingProducts, getLandingCategories, getLandingTenants } from "@/lib/server-api";
import { matches } from "@/lib/sellers";

export const metadata: Metadata = { title: "Produk" };

/** Every approved product; ?q= searches, ?kategori=<id> shows one category (the home page carousel links here). */
export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; kategori?: string }> }) {
  const { q = "", kategori } = await searchParams;
  const query = q.trim();
  const [{ products, failed }, { tenants }, { categories }] = await Promise.all([
    getAllLandingProducts(),
    getLandingTenants(),
    getLandingCategories(),
  ]);
  const category = kategori ? categories.find((c) => String(c.id) === kategori) : undefined;
  const list = products.filter(
    (p) =>
      (!category || p.categoryId === category.id) &&
      (!query || matches(p.name, query) || matches(p.description, query) || matches(sellerName(p), query)),
  );

  return (
    <ListShell
      sideTitle="UMKM"
      sideLinks={tenants.map((t) => ({ href: `/umkm/${t.id}`, label: t.name }))}
      title={query ? `HASIL PENCARIAN` : category ? `KATEGORI ${category.name.toUpperCase()}` : "SEMUA PRODUK"}
      toolbar={
        <SearchForm
          action="/produk"
          defaultValue={query}
          placeholder={category ? `Cari di ${category.name}...` : "Cari produk..."}
          hidden={category ? { kategori: String(category.id) } : undefined}
        />
      }
    >
      {(query || category) && (
        <p style={{ margin: "0 0 12px 8px", fontWeight: 600, color: "var(--gray-700)" }}>
          {list.length} produk{query && <> untuk &ldquo;{query}&rdquo;</>}
          {category && (
            <>
              {" "}
              di kategori {category.name} ·{" "}
              <Link href={query ? `/produk?q=${encodeURIComponent(query)}` : "/produk"} style={{ color: "var(--orange)" }}>
                Semua kategori
              </Link>
            </>
          )}
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
