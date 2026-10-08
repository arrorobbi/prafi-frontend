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
import { Button, buttonVariants } from "@/components/shadcn/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { Alert } from "@/components/shadcn/alert";

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
      <Alert variant="warning" style={{ maxWidth: 560, marginBottom: 20 }}>
        <IconWarning />
        <span>Perbaiki sesuai alasan penolakan, lalu ajukan kembali produk anda agar dapat diverifikasi.</span>
      </Alert>

      <div className={styles.panel}>
        {loading && !data ? (
          <Loading />
        ) : error ? (
          <Alert variant="destructive">{error}</Alert>
        ) : list.length === 0 ? (
          <EmptyState title="Tidak ada produk yang ditolak">Produk yang ditolak administrator akan muncul di sini.</EmptyState>
        ) : (
          <>
            <div className="table-wrap">
              <Table className="table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Foto</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Tanggal Ditolak</TableHead>
                    <TableHead>Alasan Penolakan</TableHead>
                    <TableHead className="col-actions">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell data-label="">
                        <Thumb src={imageSrc(p.image)} alt={p.name} className="thumb" />
                      </TableCell>
                      <TableCell data-label="Nama Produk">{p.name}</TableCell>
                      <TableCell data-label="Tanggal">{formatDate(p.approval?.updatedAt)}</TableCell>
                      <TableCell data-label="Alasan">
                        {approvalReason(p) || (productStatus(p) === "inactive" ? "Dinonaktifkan administrator" : "-")}
                      </TableCell>
                      <TableCell data-label="">
                        <span className="actions">
                          <Link href={`/tenant/produk/${p.id}/edit`} className={buttonVariants({ variant: "icon-yellow", size: "icon" })} aria-label={`Perbaiki ${p.name}`}>
                            <IconPencil />
                          </Link>
                          <Button type="button" variant="icon-red" size="icon" aria-label={`Hapus ${p.name}`} onClick={() => setDeleting(p)}>
                            <IconTrash />
                          </Button>
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
