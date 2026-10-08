"use client";

import { RatingSummary } from "@/components/Stars";
import Link from "next/link";
import { useState } from "react";
import styles from "@/components/dashboard/dashboard.module.css";
import { IconPencil, IconPlus, IconSearch, IconTrash } from "@/components/Icons";
import { ConfirmDialog } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { EmptyState, Loading, PageHeader, Pagination, StatusBadge, Thumb } from "@/components/ui";
import { api, errorMessage, fetchAll } from "@/lib/api";
import { formatDate, formatRupiah, imageSrc, productStatus, type ProductStatus } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import local from "./produk.module.css";
import { Button, buttonVariants } from "@/components/shadcn/button";
import { NativeSelect } from "@/components/shadcn/native-select";
import { Badge } from "@/components/shadcn/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { Alert } from "@/components/shadcn/alert";

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
        <NativeSelect wrapperClassName="w-auto max-sm:w-full"
          className={"h-[38px] min-w-[200px] rounded-full border-0 bg-white pr-11 pl-5 text-[0.88rem] text-foreground shadow-[0_14px_30px_rgba(14,60,105,0.12)]"}
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
        </NativeSelect>
      </div>

      <div className={styles.panel}>
        {loading && !data ? (
          <Loading />
        ) : error ? (
          <Alert variant="destructive">{error}</Alert>
        ) : list.length === 0 ? (
          <EmptyState title={data?.length ? "Produk tidak ditemukan" : "Belum ada produk"}>
            {data?.length ? (
              "Ubah kata kunci atau filter status."
            ) : (
              <Link href="/tenant/produk/tambah" className={buttonVariants({ variant: "orange" })}>
                <IconPlus /> Tambah Produk Pertama
              </Link>
            )}
          </EmptyState>
        ) : (
          <>
            <div className="table-wrap">
              <Table className="table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Foto</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Ulasan</TableHead>
                    <TableHead>Diajukan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="col-actions">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell data-label="">
                        <Thumb src={imageSrc(p.image)} alt={p.name} className="thumb" />
                      </TableCell>
                      <TableCell data-label="Nama Produk">
                        {p.name}
                        {p.isRecommended && (
                          <>
                            {" "}
                            <Badge variant="active">Rekomendasi</Badge>
                          </>
                        )}
                      </TableCell>
                      <TableCell data-label="Kategori">{p.category?.name ?? "-"}</TableCell>
                      <TableCell data-label="Harga">{formatRupiah(p.price)}</TableCell>
                      <TableCell data-label="Ulasan">
                        <RatingSummary average={p.ratingAverage} count={p.reviewCount} />
                      </TableCell>
                      <TableCell data-label="Diajukan">{formatDate(p.createdAt)}</TableCell>
                      <TableCell data-label="Status">
                        <StatusBadge status={productStatus(p)} />
                      </TableCell>
                      <TableCell data-label="">
                        <span className="actions">
                          <Link href={`/tenant/produk/${p.id}/edit`} className={buttonVariants({ variant: "icon", size: "icon" })} aria-label={`Ubah ${p.name}`}>
                            <IconPencil />
                          </Link>
                          <Button type="button" variant="icon" size="icon" aria-label={`Hapus ${p.name}`} onClick={() => setDeleting(p)}>
                            <IconTrash />
                          </Button>
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
