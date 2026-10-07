import type { Metadata } from "next";
import Link from "next/link";
import { IconBox, IconMapPin } from "@/components/Icons";
import { ListShell } from "@/components/site/ListShell";
import { SearchForm } from "@/components/site/SearchForm";
import { RatingSummary } from "@/components/Stars";
import { EmptyState, Thumb } from "@/components/ui";
import { imageSrc } from "@/lib/format";
import { getLandingTenants } from "@/lib/server-api";
import styles from "./umkm.module.css";

export const metadata: Metadata = { title: "UMKM" };

/** Public UMKM directory (GET /api/landing/tenants): profile summary, product count and rating per UMKM. */
export default async function SellersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const [all, found] = await Promise.all([getLandingTenants(), query ? getLandingTenants({ q: query }) : null]);
  const list = found ? found.tenants : all.tenants;
  const failed = all.failed || !!found?.failed;

  return (
    <ListShell
      sideTitle="UMKM"
      sideLinks={all.tenants.map((t) => ({ href: `/umkm/${t.id}`, label: t.name }))}
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
            <Link key={t.id} href={`/umkm/${t.id}`} className={styles.card}>
              <Thumb src={imageSrc(t.logo)} alt="" className={styles.logo} />
              <div className={styles.cardBody}>
                <h3>{t.name}</h3>
                {t.category && <span className={styles.category}>{t.category.name}</span>}
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
  );
}
