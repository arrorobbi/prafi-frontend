"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "@/components/dashboard/dashboard.module.css";
import { inRange, RangeSelect, type Range } from "@/components/dashboard/RangeSelect";
import { StatCard } from "@/components/dashboard/StatCard";
import { IconBox, IconCheck, IconClock, IconClose, IconPower, IconStore } from "@/components/Icons";
import { Loading, PageHeader, Thumb } from "@/components/ui";
import { api, fetchAll } from "@/lib/api";
import { formatDate, formatNumber, imageSrc, productStatus, sellerName } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";

export default function AdminDashboardPage() {
  const [range, setRange] = useState<Range>("all");
  const { data, loading, error } = useAsync(
    async () => {
      const [products, tenants] = await Promise.all([
        fetchAll((page) => api.products.list({ page, limit: 100 })),
        fetchAll((page) => api.tenants.list({ page, limit: 100 })),
      ]);
      return { products, tenants };
    },
    [],
  );

  const products = (data?.products ?? []).filter((p) => inRange(p.createdAt, range));
  const tenants = (data?.tenants ?? []).filter((t) => inRange(t.createdAt, range));
  const count = (s: ReturnType<typeof productStatus>) => products.filter((p) => productStatus(p) === s).length;
  const pending = products.filter((p) => productStatus(p) === "pending").slice(0, 5);

  return (
    <>
      <PageHeader title="DASHBOARD" />
      <div className={styles.toolbar}>
        <RangeSelect value={range} onChange={setRange} />
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <>
          <div className={styles.stats}>
            <StatCard icon={IconStore} color="#1d5fa3" bg="#e3effa" label="Total UMKM/Penjual" value={formatNumber(tenants.length)} note="Profil toko terdaftar" />
            <StatCard icon={IconBox} color="#ffffff" bg="#4fc9de" label="Total Produk" value={formatNumber(products.length)} note="Semua produk diajukan" />
            <StatCard icon={IconClock} color="#ffffff" bg="#f2cf2c" label="Menunggu Verifikasi" value={formatNumber(count("pending"))} note="Perlu dikonfirmasi" />
            <StatCard icon={IconCheck} color="#ffffff" bg="#13a10e" label="Produk Aktif" value={formatNumber(count("active"))} note="Tampil di halaman utama" />
            <StatCard icon={IconClose} color="#e53030" bg="#ffe1e1" label="Produk Ditolak" value={formatNumber(count("rejected"))} note="Menunggu perbaikan penjual" />
            <StatCard icon={IconPower} color="#ffffff" bg="#111111" label="Produk Dinonaktifkan" value={formatNumber(count("inactive"))} note="Diturunkan administrator" />
          </div>

          <section className={`${styles.panel} mt`}>
            <h2 className={styles.sectionTitle}>Produk Menunggu Konfirmasi</h2>
            {pending.length === 0 ? (
              <p className="muted">Tidak ada produk yang menunggu konfirmasi.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Foto</th>
                      <th>Nama Produk</th>
                      <th>Nama Penjual</th>
                      <th>Tanggal Pengajuan</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((p) => (
                      <tr key={p.id}>
                        <td data-label="">
                          <Thumb src={imageSrc(p.image)} alt={p.name} className="thumb" />
                        </td>
                        <td data-label="Nama Produk">{p.name}</td>
                        <td data-label="Nama Penjual">{sellerName(p)}</td>
                        <td data-label="Tanggal">{formatDate(p.createdAt)}</td>
                        <td data-label="">
                          <Link href={`/admin/konfirmasi/${p.id}`} className="btn btn-blue btn-sm">
                            Lihat Detail
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className={`${styles.formActions} mt`}>
              <Link href="/admin/konfirmasi" className="btn btn-orange btn-sm">
                Lihat semua
              </Link>
            </div>
          </section>
        </>
      )}
    </>
  );
}
