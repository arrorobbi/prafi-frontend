import Link from "next/link";
import { IconChevronRight, IconDocs, IconHeart, IconMapPin, IconThumb } from "@/components/Icons";
import { MapArt } from "@/components/site/MapArt";
import { HomeHero, type CategorySlide } from "@/components/site/HomeHero";
import { ProductStrip } from "@/components/site/ProductStrip";
import { imageSrc, categoryPath, isBumdesName, shuffled } from "@/lib/format";
import { abs, JsonLd, ORGANIZATION_LD, pageMeta, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import { getAllLandingProducts, getLandingCategories, getLandingProducts } from "@/lib/server-api";
import type { Product, ProductCategory } from "@/lib/types";
import styles from "./home.module.css";
import { buttonVariants } from "@/components/shadcn/button";
import { Alert } from "@/components/shadcn/alert";
import { Card } from "@/components/shadcn/card";

export const revalidate = 60;

export const metadata = pageMeta({ path: "/", description: SITE_DESCRIPTION });

/** Who runs the site, and its search box (Google can show a site search under the result) */
const HOME_LD = {
  "@context": "https://schema.org",
  "@graph": [
    ORGANIZATION_LD,
    {
      "@type": "WebSite",
      "@id": abs("/#website"),
      url: abs("/"),
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "id-ID",
      publisher: { "@id": abs("/#organization") },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${abs("/produk")}?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

const REASONS = [
  {
    icon: IconThumb,
    title: "REKOMENDASI TERBAIK",
    text: "Semua produk yang ada disini merupakan produk dengan kualitas terbaik",
    tone: "orange",
  },
  {
    icon: IconHeart,
    title: "DIBUAT SEPENUH HATI",
    text: "Produk yang ada disini merupakan produk yang selalu dibuat dengan sepenuh hati",
    tone: "navy",
  },
  {
    icon: IconDocs,
    title: "PRODUK TERJAMIN",
    text: "Seluruh produk telah diverifikasi administrator sebelum tampil di Trans Niaga",
    tone: "orange",
  },
] as const;

/** The BUMDES category (village-owned enterprises) has its own feature card instead of a carousel slide */
const isBumdes = (c: ProductCategory) => isBumdesName(c.name);

/** How many products of a category travel with its slide: the cards beside the carousel are drawn from them */
const SLIDE_POOL = 24;
/** "Produk Rekomendasi Lainnya" */
const MORE_COUNT = 10;
/** Products whose reviews average less than this are never shown there */
const MORE_MIN_RATING = 3;

/** Best average first; among equals the one with more reviews */
const byRating = (a: Product, b: Product) => (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0) || b.reviewCount - a.reviewCount;

/**
 * The carousel: one slide per category that has approved products (except BUMDES), showing the category's image
 * (or, without one, its best product's photo). Each slide carries up to SLIDE_POOL of its products in random order:
 * the first 3 are shown next to it, and every time the slide comes back the visitor's browser draws 3 again.
 */
function categorySlides(categories: ProductCategory[], all: Product[]): CategorySlide[] {
  return categories
    .filter((c) => !isBumdes(c))
    .map((c) => ({ category: c, products: all.filter((p) => p.categoryId === c.id) }))
    .filter(({ products }) => products.length > 0)
    // Categories with their own image first, so the carousel opens on one
    .sort((a, b) => Number(!!b.category.image) - Number(!!a.category.image))
    .map(({ category: c, products }) => ({
      key: c.id,
      image: c.image ? imageSrc(c.image) : imageSrc([...products].sort(byRating)[0].image),
      alt: c.image?.altText || c.name,
      caption: c.name,
      href: categoryPath(c),
      products: shuffled(products).slice(0, SLIDE_POOL),
    }));
}

/**
 * "Produk Rekomendasi Lainnya": the MORE_COUNT best rated products (average MORE_MIN_RATING or more, best first).
 * When fewer have such reviews, the rest are random products without any review yet. Products rated below
 * MORE_MIN_RATING never appear here. The random part changes whenever the page is rebuilt (at most a minute).
 */
function moreProducts(all: Product[]) {
  const best = all.filter((p) => p.ratingAverage != null && p.ratingAverage >= MORE_MIN_RATING).sort(byRating).slice(0, MORE_COUNT);
  const unreviewed = shuffled(all.filter((p) => !p.reviewCount));
  return [...best, ...unreviewed].slice(0, MORE_COUNT);
}

export default async function HomePage() {
  const { categories } = await getLandingCategories();
  // Every approved product, newest first: the carousel's cards and "Produk Rekomendasi Lainnya" come from it
  const [{ products, failed }, recommended] = await Promise.all([getAllLandingProducts(), getLandingProducts(1, 12, { recommended: true })]);
  const slides = categorySlides(categories, products);
  // The card beside the carousel features BUMDES (when its category has an image); otherwise the map card
  const bumdes = categories.find((c) => isBumdes(c) && c.image);
  // Without category slides, the hero shows recommended products (reviews average 4.8+), or the newest ones
  const fallback = recommended.products.length ? recommended.products.slice(0, 3) : products.slice(0, 3);
  const others = moreProducts(products);

  return (
    <>
      <JsonLd data={HOME_LD} />
      <HomeHero
        slides={slides}
        fallback={fallback}
        side={
          <>
            <h1 className="sr-only">Trans Niaga: produk pilihan UMKM Kawasan Transmigrasi Prafi</h1>
            {bumdes ? (
              <Card className={`${styles.mapCard} ${styles.bumdesCard} card-link`}>
                <Link href={categoryPath(bumdes)} className={styles.bumdesPhoto} tabIndex={-1} aria-hidden>
                  <img src={imageSrc(bumdes.image)} alt="" />
                </Link>
                <div className={styles.mapText}>
                  <span className={styles.bumdesKicker}>Badan Usaha Milik Desa</span>
                  <h2>Ada apa saja di BUMDES Prafi?</h2>
                  <p className={styles.bumdesText}>
                    Produk hasil desa, dikelola bersama warga kampung transmigrasi. Penasaran apa saja yang mereka tawarkan?
                  </p>
                  <Link href={categoryPath(bumdes)} className={`${buttonVariants({ variant: "orange", size: "sm" })} card-link-main`}>
                    Intip Produk BUMDES <IconChevronRight />
                  </Link>
                </div>
              </Card>
            ) : (
              <Card className={`${styles.mapCard} card-link`}>
                <MapArt className={styles.map} />
                <div className={styles.mapText}>
                  <h2>CARI PRODUK REKOMENDASI DAN PILIHAN ANDA DISINI</h2>
                  <Link href="/umkm" className={`${buttonVariants({ variant: "navy", size: "sm" })} card-link-main`}>
                    <IconMapPin /> Cek UMKM Disini!
                  </Link>
                </div>
              </Card>
            )}
          </>
        }
      />

      {failed && (
        <div className={styles.container}>
          <Alert variant="warning">Produk belum dapat dimuat saat ini. Silakan muat ulang halaman beberapa saat lagi.</Alert>
        </div>
      )}

      <section className={`${styles.container} ${styles.reasons}`}>
        <h2>KENAPA HARUS DI UMKM TRANS NIAGA ?</h2>
        <div className={styles.reasonGrid}>
          {REASONS.map(({ icon: Icon, title, text, tone }) => (
            <div key={title} className={`${styles.reason} ${tone === "navy" ? styles.reasonNavy : ""}`}>
              <span className={styles.reasonIcon}>
                <Icon />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.container} ${styles.more}`}>
        <h2>PRODUK REKOMENDASI LAINNYA</h2>
        {others.length > 0 ? (
          <ProductStrip products={others} />
        ) : (
          <p className={styles.emptyText}>
            Belum ada produk yang tayang. Pelaku UMKM?{" "}
            <Link href="/register">Daftarkan usaha Anda</Link> dan ajukan produk pertama.
          </p>
        )}
        <div className={styles.moreLink}>
          <Link href="/produk" className={buttonVariants({ variant: "orange" })}>
            Lihat Semua Produk
          </Link>
        </div>
      </section>
    </>
  );
}
