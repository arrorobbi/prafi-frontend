import type { Metadata } from "next";
import { GuideList } from "@/components/GuideList";
import { PageHeader } from "@/components/ui";
import { GUIDES } from "@/lib/guides";
import { pageMeta } from "@/lib/seo";
import styles from "./panduan.module.css";

export const metadata: Metadata = pageMeta({
  title: "Panduan & Bantuan",
  description:
    "Panduan Trans Niaga: cara mencari produk, mendaftar sebagai penjual UMKM, membuat profil toko, menambahkan produk, serta ketentuan dan kontak administrator.",
  path: "/panduan",
});

export default function GuidePage() {
  return (
    <div className={styles.page}>
      <PageHeader title="PANDUAN & BANTUAN" backHref="/" />
      <p className={styles.intro}>
        Panduan penggunaan Trans Niaga untuk penjual (UMKM) dan administrator. Klik salah satu topik untuk melihat langkah-langkahnya.
      </p>
      <GuideList guides={GUIDES.filter((g) => g.audience.includes("public"))} />
    </div>
  );
}
