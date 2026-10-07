import type { Metadata } from "next";
import { GuideList } from "@/components/GuideList";
import { PageHeader } from "@/components/ui";
import { GUIDES } from "@/lib/guides";
import styles from "./panduan.module.css";

export const metadata: Metadata = {
  title: "Panduan",
  description: "Panduan mendaftar sebagai penjual, membuat profil toko, dan menambahkan produk di Prafi Hub.",
};

export default function GuidePage() {
  return (
    <div className={styles.page}>
      <PageHeader title="PANDUAN & BANTUAN" backHref="/" />
      <p className={styles.intro}>
        Panduan penggunaan Prafi Hub untuk penjual (UMKM) dan administrator. Klik salah satu topik untuk melihat langkah-langkahnya.
      </p>
      <GuideList guides={GUIDES.filter((g) => g.audience.includes("public"))} />
    </div>
  );
}
