import Link from "next/link";
import { IconDocs, IconHeart, IconMapPin, IconThumb } from "@/components/Icons";
import { MapArt } from "@/components/site/MapArt";
import { HomeHero, type CategorySlide } from "@/components/site/HomeHero";
import { ProductStrip } from "@/components/site/ProductStrip";
import { imageSrc } from "@/lib/format";
import { getLandingCategories, getLandingProducts } from "@/lib/server-api";
import styles from "./home.module.css";
import { buttonVariants } from "@/components/shadcn/button";
import { Alert } from "@/components/shadcn/alert";
import { Card } from "@/components/shadcn/card";

export const revalidate = 60;

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

/**
 * The carousel: one slide per category that has approved products, showing the category's image (or, without
 * one, its best product's photo). Next to it, that category's 3 best rated products.
 */
async function categorySlides(): Promise<CategorySlide[]> {
  const { categories } = await getLandingCategories();
  const withProducts = categories.filter((c) => c.productCount > 0);
  const lists = await Promise.all(withProducts.map((c) => getLandingProducts(1, 3, { categoryId: c.id, sort: "rating" })));
  return withProducts
    .map((c, i) => ({ category: c, products: lists[i].products }))
    .filter(({ products }) => products.length > 0)
    // Categories with their own image first, so the carousel opens on one
    .sort((a, b) => Number(!!b.category.image) - Number(!!a.category.image))
    .map(({ category: c, products }) => ({
      key: c.id,
      image: c.image ? imageSrc(c.image) : imageSrc(products[0].image),
      alt: c.image?.altText || c.name,
      caption: c.name,
      href: `/produk?kategori=${c.id}`,
      products,
    }));
}

export default async function HomePage() {
  const [{ products, failed }, recommended, slides] = await Promise.all([
    getLandingProducts(1, 20),
    getLandingProducts(1, 12, { recommended: true }),
    categorySlides(),
  ]);
  // Without category slides, the hero shows recommended products (reviews average 4.8+), or the newest ones
  const fallback = recommended.products.length ? recommended.products.slice(0, 3) : products.slice(0, 3);
  // "Produk rekomendasi lainnya": recommended first, then the newest
  const recIds = new Set(recommended.products.map((p) => p.id));
  const others = [...recommended.products, ...products.filter((p) => !recIds.has(p.id))];

  return (
    <>
      <HomeHero
        slides={slides}
        fallback={fallback}
        side={
          <Card className={styles.mapCard}>
            <MapArt className={styles.map} />
            <div className={styles.mapText}>
              <h1>CARI PRODUK REKOMENDASI DAN PILIHAN ANDA DISINI</h1>
              <Link href="/umkm" className={buttonVariants({ variant: "navy", size: "sm" })}>
                <IconMapPin /> Cek UMKM Disini!
              </Link>
            </div>
          </Card>
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
