import Link from "next/link";
import { getSiteTexts } from "@/lib/server-api";
import { DEFAULT_FOOTER_ABOUT, RichText } from "../RichText";
import { Brand } from "../ui";
import styles from "./SiteFooter.module.css";

/** The about text is edited by admins and disnakertrans in "Konten Situs" (GET /api/landing/site, cached). */
export async function SiteFooter() {
  const texts = await getSiteTexts();
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.about}>
        <div className={styles.aboutInner}>
          <Brand light />
          <RichText text={texts?.footerAbout || DEFAULT_FOOTER_ABOUT} className={styles.aboutText} />
        </div>
      </div>
      <div className={styles.bar}>
        <nav aria-label="Tautan footer">
          <Link href="/produk">Produk</Link>
          <Link href="/umkm">UMKM</Link>
          <Link href="/register">Daftar Penjual</Link>
          <Link href="/panduan">Panduan</Link>
        </nav>
        <span>© {year} Trans Niaga · Kawasan Transmigrasi Prafi, Manokwari</span>
      </div>
    </footer>
  );
}
