"use client";

import Link from "next/link";
import styles from "@/components/dashboard/dashboard.module.css";
import { StatCard } from "@/components/dashboard/StatCard";
import { IconBox, IconCheck, IconClock, IconStore, IconUsers } from "@/components/Icons";
import { EmptyState, Loading, PageHeader } from "@/components/ui";
import { api, fetchAll } from "@/lib/api";
import { formatDate, formatNumber, fullName } from "@/lib/format";
import { productAndShopStats } from "@/lib/staffStats";
import { useAsync } from "@/lib/useAsync";

export default function DisnakertransDashboardPage() {
  const { data, loading, error } = useAsync(async () => {
    const [admins, stats] = await Promise.all([
      fetchAll((page) => api.users.list({ page, limit: 100, role: "admin" })),
      productAndShopStats(),
    ]);
    const waiting = admins.filter((a) => !a.approval?.isActive);
    return { admins, waiting, stats };
  }, []);

  return (
    <>
      <PageHeader title="DASHBOARD DISNAKERTRANS" />
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <>
          <div className={styles.stats}>
            <StatCard icon={IconUsers} color="#1d5fa3" bg="#e3effa" label="Total Admin" value={formatNumber(data!.admins.length)} note="Akun admin terdaftar" />
            <StatCard icon={IconClock} color="#ffffff" bg="#f2cf2c" label="Admin Belum Aktif" value={formatNumber(data!.waiting.length)} note="Perlu diaktifkan" />
            <StatCard icon={IconStore} color="#ffffff" bg="#ea7b25" label="Total UMKM" value={formatNumber(data!.stats.shops)} note="Profil toko terdaftar" />
            <StatCard icon={IconBox} color="#ffffff" bg="#4fc9de" label="Total Produk" value={formatNumber(data!.stats.products)} note="Semua produk diajukan" />
            <StatCard icon={IconCheck} color="#ffffff" bg="#13a10e" label="Produk Aktif" value={formatNumber(data!.stats.active)} note="Tampil di halaman utama" />
            <StatCard icon={IconClock} color="#ffffff" bg="#c9a300" label="Produk Menunggu" value={formatNumber(data!.stats.pending)} note="Menunggu keputusan admin" />
          </div>

          <section className={`${styles.panel} mt`}>
            <h2 className={styles.sectionTitle}>Admin Menunggu Aktivasi</h2>
            {data!.waiting.length === 0 ? (
              <EmptyState title="Tidak ada admin yang menunggu aktivasi" />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Email</th>
                      <th>Telepon</th>
                      <th>Terdaftar</th>
                      <th>Verifikasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data!.waiting.slice(0, 5).map((u) => (
                      <tr key={u.id}>
                        <td data-label="Nama">{fullName(u)}</td>
                        <td data-label="Email" className={styles.wrap}>
                          {u.email}
                        </td>
                        <td data-label="Telepon">{u.phoneNumber}</td>
                        <td data-label="Terdaftar">{formatDate(u.createdAt)}</td>
                        <td data-label="Verifikasi">
                          <span className={`badge ${u.mailActive ? "badge-active" : "badge-pending"}`}>
                            {u.mailActive ? "Terverifikasi" : "Belum verifikasi"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className={`${styles.formActions} mt`}>
              <Link href="/disnakertrans/admin" className="btn btn-orange btn-sm">
                Kelola aktivasi admin
              </Link>
            </div>
          </section>
        </>
      )}
    </>
  );
}
