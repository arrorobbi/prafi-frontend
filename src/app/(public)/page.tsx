import Link from "next/link";
import { IconDocs, IconHeart, IconMapPin, IconThumb } from "@/components/Icons";
import { HeroCarousel } from "@/components/site/HeroCarousel";
import { MapArt } from "@/components/site/MapArt";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductStrip } from "@/components/site/ProductStrip";
import { getLandingProducts } from "@/lib/server-api";
import styles from "./home.module.css";

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
    text: "Seluruh produk telah diverifikasi administrator sebelum tampil di Transniaga",
    tone: "orange",
  },
] as const;

export default async function HomePage() {
  const { products, failed } = await getLandingProducts(1, 20);
  const featured = products.slice(0, 5);
  const picks = products.slice(0, 3);
  const others = products.length > 3 ? products.slice(3) : products;

  return (
    <>
      <section className={styles.hero}>
        <HeroCarousel products={featured} />

        <div className={styles.heroRight}>
          <div className={`card ${styles.mapCard}`}>
            <MapArt className={styles.map} />
            <div className={styles.mapText}>
              <h1>CARI PRODUK REKOMENDASI DAN PILIHAN ANDA DISINI</h1>
              <Link href="/umkm" className="btn btn-navy btn-sm">
                <IconMapPin /> Cek UMKM Disini!
              </Link>
            </div>
          </div>

          {picks.length > 0 && (
            <div className={styles.picks}>
              {picks.map((p) => (
                <ProductCard key={p.id} product={p} recommended />
              ))}
            </div>
          )}
        </div>
      </section>

      {failed && (
        <div className={styles.container}>
          <div className="alert alert-warning">Produk belum dapat dimuat saat ini. Silakan muat ulang halaman beberapa saat lagi.</div>
        </div>
      )}

      <section className={`${styles.container} ${styles.reasons}`}>
        <h2>KENAPA HARUS DI UMKM TRANSNIAGA ?</h2>
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
          <Link href="/produk" className="btn btn-orange">
            Lihat Semua Produk
          </Link>
        </div>
      </section>
    </>
  );
}
