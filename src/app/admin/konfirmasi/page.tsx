"use client";

import Link from "next/link";
import { useState } from "react";
import { ReasonDialog, useProductReview } from "@/components/dashboard/ProductReview";
import { inRange, RangeSelect, type Range } from "@/components/dashboard/RangeSelect";
import styles from "@/components/dashboard/dashboard.module.css";
import { IconCheck, IconClose } from "@/components/Icons";
import { ConfirmDialog } from "@/components/Modal";
import { EmptyState, Loading, PageHeader, Pagination, Thumb } from "@/components/ui";
import { api, fetchAll } from "@/lib/api";
import { formatDate, imageSrc, productStatus, sellerName } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";

const PER_PAGE = 10;

/** Products waiting for an admin decision (new, or edited after a rejection). */
export default function ConfirmProductsPage() {
  const [range, setRange] = useState<Range>("all");
  const [page, setPage] = useState(1);
  const [approveTarget, setApproveTarget] = useState<Product | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Product | null>(null);

  const { data, loading, error, reload } = useAsync(async () => {
    const [products, tenants] = await Promise.all([
      fetchAll((p) => api.products.list({ page: p, limit: 100, isActive: false })),
      fetchAll((p) => api.tenants.list({ page: p, limit: 100 })),
    ]);
    const categoryByOwner = new Map(tenants.map((t) => [t.userId, t.category?.name ?? "-"]));
    return { products: products.filter((p) => productStatus(p) === "pending"), categoryByOwner };
  }, []);

  const review = useProductReview(() => {
    setApproveTarget(null);
    setRejectTarget(null);
    reload();
  });

  const list = (data?.products ?? []).filter((p) => inRange(p.createdAt, range));
  const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const shown = list.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  return (
    <>
      <PageHeader title="KONFIRMASI PRODUK" />
      <div className={styles.toolbar}>
        <RangeSelect
          value={range}
          onChange={(r) => {
            setRange(r);
            setPage(1);
          }}
        />
      </div>

      <div className={styles.panel}>
        {loading && !data ? (
          <Loading />
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : list.length === 0 ? (
          <EmptyState title="Tidak ada produk yang menunggu konfirmasi">Produk baru dari penjual akan muncul di sini.</EmptyState>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Nama Produk</th>
                    <th>Nama Penjual</th>
                    <th>Kategori</th>
                    <th>Tanggal Pengajuan</th>
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
                      <td data-label="Nama Penjual">{sellerName(p)}</td>
                      <td data-label="Kategori">{data?.categoryByOwner.get(p.tenantId) ?? "-"}</td>
                      <td data-label="Tanggal Pengajuan">{formatDate(p.updatedAt)}</td>
                      <td data-label="">
                        <span className="actions">
                          <Link href={`/admin/konfirmasi/${p.id}`} className="btn btn-blue btn-sm">
                            Lihat Detail
                          </Link>
                          <button
                            type="button"
                            className="icon-btn icon-btn-green"
                            aria-label={`Terima ${p.name}`}
                            title="Terima"
                            onClick={() => setApproveTarget(p)}
                          >
                            <IconCheck />
                          </button>
                          <button
                            type="button"
                            className="icon-btn icon-btn-red"
                            aria-label={`Tolak ${p.name}`}
                            title="Tolak"
                            onClick={() => setRejectTarget(p)}
                          >
                            <IconClose />
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={current} totalPages={totalPages} total={list.length} shown={shown.length} onChange={setPage} />
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!approveTarget}
        title="Terima Produk"
        message={
          <>
            Setujui <strong>{approveTarget?.name}</strong>? Produk akan langsung tampil di halaman utama Trans Niaga.
          </>
        }
        confirmLabel="Terima Produk"
        busy={review.busyId === approveTarget?.id}
        onConfirm={() => approveTarget && review.approve(approveTarget.id)}
        onClose={() => setApproveTarget(null)}
      />
      <ReasonDialog
        key={rejectTarget?.id ?? "none"}
        open={!!rejectTarget}
        mode="reject"
        productName={rejectTarget?.name}
        busy={review.busyId === rejectTarget?.id}
        onSubmit={(reason) => rejectTarget && review.reject(rejectTarget.id, reason)}
        onClose={() => setRejectTarget(null)}
      />
    </>
  );
}
