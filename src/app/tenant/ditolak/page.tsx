"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "@/components/dashboard/dashboard.module.css";
import { IconPencil, IconTrash, IconWarning } from "@/components/Icons";
import { ConfirmDialog } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { EmptyState, Loading, PageHeader, Pagination, Thumb } from "@/components/ui";
import { api, errorMessage, fetchAll } from "@/lib/api";
import { approvalReason, formatDate, imageSrc, productStatus } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";

const PER_PAGE = 10;

/** Products the admin rejected or deactivated, with the reason. */
export default function RejectedProductsPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useAsync(
    () => fetchAll((p) => api.products.list({ page: p, limit: 100, isActive: false })),
    [],
  );
  const list = (data ?? []).filter((p) => ["rejected", "inactive"].includes(productStatus(p)));
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
      <PageHeader title="PRODUK DITOLAK" />
      <div className="alert alert-warning" style={{ maxWidth: 560, marginBottom: 20 }}>
        <IconWarning />
        <span>Perbaiki sesuai alasan penolakan, lalu ajukan kembali produk anda agar dapat diverifikasi.</span>
      </div>

      <div className={styles.panel}>
        {loading && !data ? (
          <Loading />
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : list.length === 0 ? (
          <EmptyState title="Tidak ada produk yang ditolak">Produk yang ditolak administrator akan muncul di sini.</EmptyState>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Nama Produk</th>
                    <th>Tanggal Ditolak</th>
                    <th>Alasan Penolakan</th>
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
                      <td data-label="Tanggal">{formatDate(p.approval?.updatedAt)}</td>
                      <td data-label="Alasan">
                        {approvalReason(p) || (productStatus(p) === "inactive" ? "Dinonaktifkan administrator" : "-")}
                      </td>
                      <td data-label="">
                        <span className="actions">
                          <Link href={`/tenant/produk/${p.id}/edit`} className="icon-btn icon-btn-yellow" aria-label={`Perbaiki ${p.name}`}>
                            <IconPencil />
                          </Link>
                          <button type="button" className="icon-btn icon-btn-red" aria-label={`Hapus ${p.name}`} onClick={() => setDeleting(p)}>
                            <IconTrash />
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={current} totalPages={totalPages} total={list.length} shown={shown.length} noun="produk yang ditolak" onChange={setPage} />
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
