import Link from "next/link";
import { Brand } from "../ui";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.about}>
        <div className={styles.aboutInner}>
          <Brand light />
          <p>
            <strong>UMKM PRAFI HUB</strong> dibangun dari semangat gotong royong untuk memajukan perekonomian lokal.
            Sebagai direktori dan marketplace UMKM di Prafi, Manokwari, platform ini dirancang untuk membina serta
            memperluas jangkauan pasar para pelaku usaha daerah. Melalui Prafi Hub, beli produk lokal kini jadi lebih
            praktis, sekaligus menjadi bentuk nyata dukungan kita terhadap kemajuan UMKM Prafi.
          </p>
        </div>
      </div>
      <div className={styles.bar}>
        <nav aria-label="Tautan footer">
          <Link href="/produk">Produk</Link>
          <Link href="/umkm">UMKM</Link>
          <Link href="/register">Daftar Penjual</Link>
          <Link href="/panduan">Panduan</Link>
        </nav>
        <span>© {year} Prafi Hub · Kawasan Transmigrasi Prafi, Manokwari</span>
      </div>
    </footer>
  );
}
