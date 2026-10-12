import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { ListShell } from "@/components/site/ListShell";
import { ProductRow } from "@/components/site/ProductRow";
import { SearchForm } from "@/components/site/SearchForm";
import { imageSrc, sellerName } from "@/lib/format";
import { abs, breadcrumbLd, JsonLd, pageMeta } from "@/lib/seo";
import { getAllLandingProducts, getLandingCategories, getLandingTenants } from "@/lib/server-api";
import { matches } from "@/lib/sellers";

type Props = { searchParams: Promise<{ q?: string; kategori?: string }> };

/**
 * /produk and each category (?kategori=) are pages of their own for search engines; search results (?q=) are not
 * indexed and count as the list they search in.
 */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q = "", kategori } = await searchParams;
  const { categories } = kategori ? await getLandingCategories() : { categories: [] };
  const category = kategori ? categories.find((c) => String(c.id) === kategori) : undefined;
  const path = category ? `/produk?kategori=${category.id}` : "/produk";
  return pageMeta({
    title: category ? `Produk ${category.name}` : "Semua Produk UMKM",
    description: category
      ? `Produk kategori ${category.name} dari UMKM Kawasan Transmigrasi Prafi, Manokwari: lihat harga, ulasan pembeli, dan hubungi penjualnya langsung di Trans Niaga.`
      : "Semua produk UMKM Kawasan Transmigrasi Prafi, Manokwari: makanan, minuman, hasil desa, dan lainnya. Lihat harga, ulasan pembeli, dan hubungi penjualnya langsung.",
    path,
    image: category?.image ? { url: imageSrc(category.image), alt: `Kategori ${category.name}` } : null,
    index: !q.trim(),
  });
}

/** Every approved product; ?q= searches, ?kategori=<id> shows one category (the home page carousel links here). */
export default async function ProductsPage({ searchParams }: Props) {
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

  // The list itself for search engines (not for search results, which aren't indexed)
  const listLd = !query && list.length > 0 && {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: category ? `Produk ${category.name}` : "Semua Produk UMKM",
    numberOfItems: list.length,
    itemListElement: list.slice(0, 50).map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: abs(`/produk/${p.id}`) })),
  };

  return (
    <>
    {listLd && <JsonLd data={listLd} />}
    <JsonLd
      data={breadcrumbLd([
        { name: "Beranda", path: "/" },
        { name: "Produk", path: "/produk" },
        ...(category ? [{ name: category.name, path: `/produk?kategori=${category.id}` }] : []),
      ])}
    />
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
    </>
  );
}
