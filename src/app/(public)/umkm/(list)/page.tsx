import type { Metadata } from "next";
import Link from "next/link";
import { IconBox, IconMapPin } from "@/components/Icons";
import { ListShell } from "@/components/site/ListShell";
import { SearchForm } from "@/components/site/SearchForm";
import { RatingSummary } from "@/components/Stars";
import { EmptyState, Thumb } from "@/components/ui";
import { imageSrc, tenantPath } from "@/lib/format";
import { breadcrumbLd, JsonLd, pageMeta } from "@/lib/seo";
import { getLandingTenants } from "@/lib/server-api";
import styles from "../umkm.module.css";

type Props = { searchParams: Promise<{ q?: string }> };

/** Search results (?q=) are not indexed and count as /umkm */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q = "" } = await searchParams;
  return pageMeta({
    title: "Daftar UMKM",
    description:
      "Daftar UMKM Kawasan Transmigrasi Prafi, Manokwari: profil toko, alamat, jam buka, kontak WhatsApp, jumlah produk, dan rating pembeli di Trans Niaga.",
    path: "/umkm",
    index: !q.trim(),
  });
}

/** Public UMKM directory (GET /api/landing/tenants): profile summary, product count and rating per UMKM. */
export default async function SellersPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const [all, found] = await Promise.all([getLandingTenants(), query ? getLandingTenants({ q: query }) : null]);
  const list = found ? found.tenants : all.tenants;
  const failed = all.failed || !!found?.failed;

  return (
    <>
    <JsonLd data={breadcrumbLd([{ name: "Beranda", path: "/" }, { name: "UMKM", path: "/umkm" }])} />
    <ListShell
      sideTitle="UMKM"
      sideLinks={all.tenants.map((t) => ({ href: tenantPath(t), label: t.name }))}
      title={query ? "HASIL PENCARIAN UMKM" : "DAFTAR UMKM"}
      toolbar={<SearchForm action="/umkm" defaultValue={query} placeholder="Cari toko / UMKM..." />}
    >
      {failed ? (
        <EmptyState title="Data UMKM belum dapat dimuat">Silakan muat ulang halaman beberapa saat lagi.</EmptyState>
      ) : list.length === 0 ? (
        <EmptyState title={query ? "UMKM tidak ditemukan" : "Belum ada UMKM"}>
          {query ? "Coba kata kunci lain." : "UMKM tampil di sini setelah pemiliknya membuat profil toko."}
        </EmptyState>
      ) : (
        <div className={styles.grid}>
          {list.map((t) => (
            <Link key={t.id} href={tenantPath(t)} className={styles.card}>
              <Thumb src={imageSrc(t.logo)} alt="" className={styles.logo} />
              <div className={styles.cardBody}>
                <h3>{t.name}</h3>
                <p className={styles.desc}>{t.description}</p>
                <p className={styles.meta}>
                  <span>
                    <IconMapPin /> {t.area}
                  </span>
                  <span>
                    <IconBox /> {t.productCount} produk
                  </span>
                </p>
                <RatingSummary average={t.ratingAverage} count={t.reviewCount} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </ListShell>
    </>
  );
}
