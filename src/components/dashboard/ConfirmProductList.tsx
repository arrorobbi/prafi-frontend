"use client";

import Link from "next/link";
import { useState } from "react";
import { ReasonDialog, useProductReview } from "./ProductReview";
import { inRange, RangeSelect, type Range } from "./RangeSelect";
import styles from "./dashboard.module.css";
import { IconCheck, IconClose } from "@/components/Icons";
import { ConfirmDialog } from "@/components/Modal";
import { EmptyState, Loading, PageHeader, Pagination, Thumb } from "@/components/ui";
import { api, fetchAll } from "@/lib/api";
import { formatDate, imageSrc, productStatus, sellerName } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { Button, buttonVariants } from "@/components/shadcn/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { Alert } from "@/components/shadcn/alert";

const PER_PAGE = 10;

/**
 * Products waiting for a decision by an admin or disnakertrans (new, or edited after a rejection).
 * `base` is this page's path, e.g. /admin/konfirmasi; each product opens at `${base}/:id`.
 */
export function ConfirmProductList({ base }: { base: string }) {
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
          <Alert variant="destructive">{error}</Alert>
        ) : list.length === 0 ? (
          <EmptyState title="Tidak ada produk yang menunggu konfirmasi">Produk baru dari penjual akan muncul di sini.</EmptyState>
        ) : (
          <>
            <div className="table-wrap">
              <Table className="table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Foto</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Nama Penjual</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tanggal Pengajuan</TableHead>
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
                      <TableCell data-label="Nama Penjual">{sellerName(p)}</TableCell>
                      <TableCell data-label="Kategori">{data?.categoryByOwner.get(p.tenantId) ?? "-"}</TableCell>
                      <TableCell data-label="Tanggal Pengajuan">{formatDate(p.updatedAt)}</TableCell>
                      <TableCell data-label="">
                        <span className="actions">
                          <Link href={`${base}/${p.id}`} className={buttonVariants({ variant: "blue", size: "sm" })}>
                            Lihat Detail
                          </Link>
                          <Button
                            type="button"
                            variant="icon-green" size="icon"
                            aria-label={`Terima ${p.name}`}
                            title="Terima"
                            onClick={() => setApproveTarget(p)}
                          >
                            <IconCheck />
                          </Button>
                          <Button
                            type="button"
                            variant="icon-red" size="icon"
                            aria-label={`Tolak ${p.name}`}
                            title="Tolak"
                            onClick={() => setRejectTarget(p)}
                          >
                            <IconClose />
                          </Button>
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
