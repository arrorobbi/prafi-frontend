import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { EmptyState } from "@/components/ui";
import { ListShell } from "@/components/site/ListShell";
import { ProductRow } from "@/components/site/ProductRow";
import { SearchForm } from "@/components/site/SearchForm";
import { imageSrc, sellerName, categoryPath, productPath, tenantPath } from "@/lib/format";
import { abs, breadcrumbLd, JsonLd, pageMeta } from "@/lib/seo";
import styles from "./list.module.css";
import { getAllLandingProducts, getLandingCategories, getLandingTenants } from "@/lib/server-api";
import { matches } from "@/lib/sellers";
import type { Product, ProductCategory } from "@/lib/types";

type Props = { searchParams: Promise<{ q?: string; kategori?: string; urut?: string }> };

/** ?kategori= is the category's slug; its id still works for links made before slugs */
const findCategory = (categories: ProductCategory[], value: string) => categories.find((c) => c.slug === value) ?? categories.find((c) => String(c.id) === value);
/** What goes in the address for a category */
const categoryParam = (c: ProductCategory) => c.slug || String(c.id);

/** Best average stars first; among equals the one with more reviews; products without reviews last (newest first). */
function byRating(a: Product, b: Product) {
  if (a.ratingAverage == null || b.ratingAverage == null) return (a.ratingAverage == null ? 1 : 0) - (b.ratingAverage == null ? 1 : 0);
  return b.ratingAverage - a.ratingAverage || b.reviewCount - a.reviewCount;
}

/**
 * /produk and each category (?kategori=) are pages of their own for search engines; search results (?q=) are not
 * indexed and count as the list they search in.
 */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q = "", kategori } = await searchParams;
  const { categories } = kategori ? await getLandingCategories() : { categories: [] };
  const category = kategori ? findCategory(categories, kategori) : undefined;
  const path = category ? categoryPath(category) : "/produk";
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

/**
 * Every approved product, best rated first (?urut=terbaru: newest first); ?q= searches, ?kategori=<slug> shows one
 * category (the home page carousel links here).
 */
export default async function ProductsPage({ searchParams }: Props) {
  const { q = "", kategori, urut } = await searchParams;
  const query = q.trim();
  const newest = urut === "terbaru";
  const [{ products, failed }, { tenants }, { categories }] = await Promise.all([
    getAllLandingProducts(),
    getLandingTenants(),
    getLandingCategories(),
  ]);
  const category = kategori ? findCategory(categories, kategori) : undefined;
  // An address with the category's id (from before slugs): on to the one with its slug, keeping search and order
  if (category?.slug && kategori !== category.slug) {
    const params = new URLSearchParams({ ...(query && { q: query }), kategori: category.slug, ...(urut && { urut }) });
    permanentRedirect(`/produk?${params}`);
  }
  const found = products.filter(
    (p) =>
      (!category || p.categoryId === category.id) &&
      (!query || matches(p.name, query) || matches(p.description, query) || matches(sellerName(p), query)),
  );
  // The API answers newest first; sort() is stable, so equal ratings keep that order
  const list = newest ? found : [...found].sort(byRating);
  /** This list with another order (the search and the category are kept) */
  const sortHref = (value?: string) => {
    const params = new URLSearchParams({ ...(query && { q: query }), ...(category && { kategori: categoryParam(category) }), ...(value && { urut: value }) });
    return `/produk${params.size ? `?${params}` : ""}`;
  };

  // The list itself for search engines (not for search results, which aren't indexed)
  const listLd = !query && list.length > 0 && {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: category ? `Produk ${category.name}` : "Semua Produk UMKM",
    numberOfItems: list.length,
    itemListElement: list.slice(0, 50).map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: abs(productPath(p)) })),
  };

  return (
    <>
    {listLd && <JsonLd data={listLd} />}
    <JsonLd
      data={breadcrumbLd([
        { name: "Beranda", path: "/" },
        { name: "Produk", path: "/produk" },
        ...(category ? [{ name: category.name, path: categoryPath(category) }] : []),
      ])}
    />
    <ListShell
      sideTitle="UMKM"
      sideLinks={tenants.map((t) => ({ href: tenantPath(t), label: t.name }))}
      title={query ? `HASIL PENCARIAN` : category ? `KATEGORI ${category.name.toUpperCase()}` : "SEMUA PRODUK"}
      toolbar={
        <SearchForm
          action="/produk"
          defaultValue={query}
          placeholder={category ? `Cari di ${category.name}...` : "Cari produk..."}
          hidden={{ ...(category && { kategori: categoryParam(category) }), ...(newest && { urut: "terbaru" }) }}
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
      {list.length > 1 && (
        <nav className={styles.sort} aria-label="Urutkan produk">
          <span>Urutkan:</span>
          <Link href={sortHref()} aria-current={newest ? undefined : "true"} rel="nofollow">
            Rating tertinggi
          </Link>
          <Link href={sortHref("terbaru")} aria-current={newest ? "true" : undefined} rel="nofollow">
            Terbaru
          </Link>
        </nav>
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
