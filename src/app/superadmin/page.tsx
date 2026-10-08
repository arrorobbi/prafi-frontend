"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import styles from "@/components/dashboard/dashboard.module.css";
import { StatCard } from "@/components/dashboard/StatCard";
import { ROLE_LABEL } from "@/components/dashboard/UserAccounts";
import { IconBox, IconCheck, IconClock, IconStore, IconUser, IconUsers } from "@/components/Icons";
import { Loading, PageHeader } from "@/components/ui";
import { api, fetchAll } from "@/lib/api";
import { formatDate, formatNumber, fullName } from "@/lib/format";
import { countUsers, productAndShopStats } from "@/lib/staffStats";
import { useAsync } from "@/lib/useAsync";
import { buttonVariants } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { Alert } from "@/components/shadcn/alert";

/** The charts (Recharts) load separately, so the page shows right away */
const DashboardStats = dynamic(() => import("@/components/dashboard/StatsCharts").then((m) => m.DashboardStats), {
  ssr: false,
  loading: () => <Loading label="Memuat grafik..." />,
});

export default function SuperadminDashboardPage() {
  const { data, loading, error } = useAsync(async () => {
    const [disnakertrans, tenants, admins, stats, latest] = await Promise.all([
      countUsers("disnakertrans"),
      countUsers("tenant"),
      fetchAll((page) => api.users.list({ page, limit: 100, role: "admin" })),
      productAndShopStats(),
      api.users.list({ limit: 6 }),
    ]);
    return {
      disnakertrans,
      tenants,
      admins: admins.length,
      adminsWaiting: admins.filter((a) => !a.approval?.isActive).length,
      stats,
      latest: latest.data,
    };
  }, []);

  return (
    <>
      <PageHeader title="DASHBOARD SUPERADMIN" />
      {loading ? (
        <Loading />
      ) : error ? (
        <Alert variant="destructive">{error}</Alert>
      ) : (
        <>
          <h2 className={styles.sectionTitle}>Pengguna</h2>
          <div className={styles.stats}>
            <StatCard icon={IconUser} color="#ffffff" bg="#0e3c69" label="Akun Disnakertrans" value={formatNumber(data!.disnakertrans)} note="Dibuat oleh superadmin" />
            <StatCard icon={IconUsers} color="#1d5fa3" bg="#e3effa" label="Akun Admin" value={formatNumber(data!.admins)} note={`${data!.adminsWaiting} belum aktif`} />
            <StatCard icon={IconStore} color="#ffffff" bg="#ea7b25" label="Akun Penjual" value={formatNumber(data!.tenants)} note={`${data!.stats.shops} profil toko`} />
          </div>

          <h2 className={`${styles.sectionTitle} mt`}>Produk</h2>
          <div className={styles.stats}>
            <StatCard icon={IconBox} color="#ffffff" bg="#4fc9de" label="Total Produk" value={formatNumber(data!.stats.products)} note="Semua produk diajukan" />
            <StatCard icon={IconCheck} color="#ffffff" bg="#13a10e" label="Produk Aktif" value={formatNumber(data!.stats.active)} note="Tampil di halaman utama" />
            <StatCard icon={IconClock} color="#ffffff" bg="#f2cf2c" label="Menunggu Verifikasi" value={formatNumber(data!.stats.pending)} note="Menunggu keputusan admin" />
          </div>

          <section className={`${styles.panel} mt`}>
            <h2 className={styles.sectionTitle}>Akun Terbaru</h2>
            <div className="table-wrap">
              <Table className="table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Terdaftar</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data!.latest.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell data-label="Nama">{u.tenantName || fullName(u)}</TableCell>
                      <TableCell data-label="Role">{ROLE_LABEL[u.role]}</TableCell>
                      <TableCell data-label="Email" className={styles.wrap}>
                        {u.email}
                      </TableCell>
                      <TableCell data-label="Terdaftar">{formatDate(u.createdAt)}</TableCell>
                      <TableCell data-label="Status">
                        <Badge variant={u.approval?.isActive ? "active" : "pending"}>
                          {u.approval?.isActive ? "Aktif" : "Belum Aktif"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className={`${styles.formActions} mt`}>
              <Link href="/superadmin/pengguna" className={buttonVariants({ variant: "orange", size: "sm" })}>
                Lihat semua pengguna
              </Link>
            </div>
          </section>
        </>
      )}

      <DashboardStats />
    </>
  );
}
