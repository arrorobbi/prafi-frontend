"use client";

import Link from "next/link";
import styles from "@/components/dashboard/dashboard.module.css";
import { StatCard } from "@/components/dashboard/StatCard";
import { IconBox, IconCheck, IconClock, IconClose, IconPlus, IconPower, IconWarning } from "@/components/Icons";
import { Loading, PageHeader } from "@/components/ui";
import { api, fetchAll } from "@/lib/api";
import { formatNumber, productStatus } from "@/lib/format";
import { useTenantProfile } from "@/lib/tenantProfile";
import { useAsync } from "@/lib/useAsync";
import local from "./dashboard.module.css";
import { buttonVariants } from "@/components/shadcn/button";
import { Alert } from "@/components/shadcn/alert";

export default function TenantDashboardPage() {
  const { profile, loading: profileLoading } = useTenantProfile();
  const { data, loading, error } = useAsync(() => fetchAll((page) => api.products.list({ page, limit: 100 })), []);
  const products = data ?? [];
  const count = (s: ReturnType<typeof productStatus>) => products.filter((p) => productStatus(p) === s).length;

  return (
    <>
      <PageHeader title="DASHBOARD" />

      {!profileLoading && !profile && (
        <Alert variant="warning" className={local.banner}>
          <IconWarning />
          <div>
            <strong>Profil toko belum dibuat.</strong> Lengkapi profil UMKM (logo, kategori, alamat, kontak) agar pembeli
            mengenal toko Anda.{" "}
            <Link href="/tenant/profil" className={local.bannerLink}>
              Lengkapi sekarang
            </Link>
          </div>
        </Alert>
      )}

      <h2 className={styles.sectionTitle}>Ringkasan</h2>
      {loading ? (
        <Loading />
      ) : error ? (
        <Alert variant="destructive">{error}</Alert>
      ) : (
        <div className={styles.stats}>
          <StatCard icon={IconBox} color="#ffffff" bg="#1d5fa3" label="Total Produk" value={formatNumber(products.length)} note="Semua Produk" />
          <StatCard icon={IconCheck} color="#ffffff" bg="#13a10e" label="Produk Aktif" value={formatNumber(count("active"))} note="Tampil di halaman utama" />
          <StatCard icon={IconClose} color="#e53030" bg="#ffe1e1" label="Produk Ditolak" value={formatNumber(count("rejected"))} note="Ditolak Administrator" />
          <StatCard icon={IconClock} color="#ffffff" bg="#f2cf2c" label="Menunggu Konfirmasi" value={formatNumber(count("pending"))} note="Menunggu Verifikasi" />
          <StatCard icon={IconPower} color="#ffffff" bg="#111111" label="Produk Dinonaktifkan" value={formatNumber(count("inactive"))} note="Dinonaktifkan Administrator" />
        </div>
      )}

      <div className={local.actions}>
        <Link href="/tenant/profil" className={buttonVariants({ variant: "orange", size: "lg" })}>
          Edit Profil
        </Link>
        <Link href="/tenant/produk/tambah" className={buttonVariants({ variant: "orange", size: "lg" })}>
          <IconPlus /> Tambah Produk
        </Link>
      </div>
    </>
  );
}
