"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "@/components/dashboard/dashboard.module.css";
import { IconPencil, IconPlus, IconSearch, IconTrash } from "@/components/Icons";
import { ConfirmDialog } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { EmptyState, Loading, PageHeader, Pagination, StatusBadge, Thumb } from "@/components/ui";
import { api, errorMessage, fetchAll } from "@/lib/api";
import { formatDate, formatNumber, imageSrc, productStatus, type ProductStatus } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import local from "./produk.module.css";

const PER_PAGE = 10;

export default function MyProductsPage() {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useAsync(() => fetchAll((p) => api.products.list({ page: p, limit: 100 })), []);

  const q = query.trim().toLowerCase();
  const list = (data ?? []).filter((p) => (!q || p.name.toLowerCase().includes(q)) && (!status || productStatus(p) === status));
  const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const shown = list.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.products.remove(deleting.id);
      toast.success("Produk dihapus");
      reload();
    } catch (err) {
      toast.error("Gagal menghapus", errorMessage(err));
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  };

  return (
    <>
      <PageHeader title="PRODUK SAYA" />
      <div className={local.toolbar}>
        <label className={local.search}>
          <span className="sr-only">Cari produk</span>
          <input
            placeholder="Cari produk"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
          <IconSearch />
        </label>
        <Link href="/tenant/produk/tambah" className={local.add} aria-label="Tambah produk" title="Tambah produk">
          <IconPlus />
        </Link>
        <select
          className={`${styles.filter} ${styles.filterWhite}`}
          value={status}
          aria-label="Status"
          onChange={(e) => {
            setStatus(e.target.value as ProductStatus | "");
            setPage(1);
          }}
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="pending">Menunggu Konfirmasi</option>
          <option value="rejected">Ditolak</option>
          <option value="inactive">Dinonaktifkan</option>
        </select>
      </div>

      <div className={styles.panel}>
        {loading && !data ? (
          <Loading />
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : list.length === 0 ? (
          <EmptyState title={data?.length ? "Produk tidak ditemukan" : "Belum ada produk"}>
            {data?.length ? (
              "Ubah kata kunci atau filter status."
            ) : (
              <Link href="/tenant/produk/tambah" className="btn btn-orange">
                <IconPlus /> Tambah Produk Pertama
              </Link>
            )}
          </EmptyState>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Nama Produk</th>
                    <th>Stok</th>
                    <th>Diajukan</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((p) => (
                    <tr key={p.id}>
                      <td data-label="">
                        <Thumb src={imageSrc(p.image)} alt={p.name} className="thumb" />
                      </td>
                      <td data-label="Nama Produk">{p.name}</td>
                      <td data-label="Stok">{formatNumber(p.qty)}</td>
                      <td data-label="Diajukan">{formatDate(p.createdAt)}</td>
                      <td data-label="Status">
                        <StatusBadge status={productStatus(p)} />
                      </td>
                      <td data-label="">
                        <span className="actions">
                          <Link href={`/tenant/produk/${p.id}/edit`} className="icon-btn" aria-label={`Ubah ${p.name}`}>
                            <IconPencil />
                          </Link>
                          <button type="button" className="icon-btn" aria-label={`Hapus ${p.name}`} onClick={() => setDeleting(p)}>
                            <IconTrash />
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={current} totalPages={totalPages} total={list.length} shown={shown.length} noun="produk" onChange={setPage} />
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        title="Hapus Produk"
        danger
        busy={busy}
        confirmLabel="Hapus"
        message={
          <>
            Hapus <strong>{deleting?.name}</strong>? Produk dan fotonya akan dihapus permanen.
          </>
        }
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
