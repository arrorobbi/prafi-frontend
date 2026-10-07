import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, Thumb } from "@/components/ui";
import { ListShell } from "@/components/site/ListShell";
import { SearchForm } from "@/components/site/SearchForm";
import { imageSrc } from "@/lib/format";
import { getAllLandingProducts } from "@/lib/server-api";
import { groupSellers, matches } from "@/lib/sellers";
import styles from "./umkm.module.css";

export const metadata: Metadata = { title: "UMKM" };

export default async function SellersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const { products, failed } = await getAllLandingProducts();
  const sellers = groupSellers(products);
  const list = query ? sellers.filter((s) => matches(s.name, query) || matches(s.owner, query)) : sellers;

  return (
    <ListShell
      sideTitle="UMKM"
      sideLinks={sellers.map((s) => ({ href: `/umkm/${s.id}`, label: s.name }))}
      title={query ? "HASIL PENCARIAN UMKM" : "DAFTAR UMKM"}
      toolbar={<SearchForm action="/umkm" defaultValue={query} placeholder="Cari toko / UMKM..." />}
    >
      {failed ? (
        <EmptyState title="Data UMKM belum dapat dimuat">Silakan muat ulang halaman beberapa saat lagi.</EmptyState>
      ) : list.length === 0 ? (
        <EmptyState title={query ? "UMKM tidak ditemukan" : "Belum ada UMKM"}>
          {query ? "Coba kata kunci lain." : "UMKM tampil di sini setelah produk pertamanya disetujui."}
        </EmptyState>
      ) : (
        <div className={styles.grid}>
          {list.map((s) => (
            <Link key={s.id} href={`/umkm/${s.id}`} className={styles.card}>
              <Thumb src={imageSrc(s.image)} alt="" className={styles.logo} />
              <div>
                <h3>{s.name}</h3>
                <p>{s.productCount} produk</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </ListShell>
  );
}
