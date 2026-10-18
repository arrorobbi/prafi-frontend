import type { Metadata } from "next";
import { GuideList } from "@/components/GuideList";
import { PageHeader } from "@/components/ui";
import { getGuides } from "@/lib/server-api";
import { pageMeta } from "@/lib/seo";
import { Alert } from "@/components/shadcn/alert";
import styles from "./panduan.module.css";

export const metadata: Metadata = pageMeta({
  title: "Panduan & Bantuan",
  description:
    "Panduan Trans Niaga: cara mencari produk, mendaftar sebagai penjual UMKM, membuat profil toko, menambahkan produk, serta ketentuan dan kontak administrator.",
  path: "/panduan",
});

/** The topics are content edited in "Kelola Panduan" (GET /api/landing/guides, landing cache). */
export default async function GuidePage() {
  const guides = await getGuides("public");
  return (
    <div className={styles.page}>
      <PageHeader title="PANDUAN & BANTUAN" backHref="/" />
      <p className={styles.intro}>
        Panduan penggunaan Trans Niaga untuk penjual (UMKM) dan administrator. Klik salah satu topik untuk melihat langkah-langkahnya.
      </p>
      {guides ? <GuideList guides={guides} /> : <Alert variant="destructive">Panduan sedang tidak dapat dimuat. Silakan coba lagi sebentar lagi.</Alert>}
    </div>
  );
}
