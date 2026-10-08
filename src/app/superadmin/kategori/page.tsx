"use client";

import styles from "@/components/dashboard/dashboard.module.css";
import { EmptyState, Loading, PageHeader, Thumb } from "@/components/ui";
import { api, fetchAll } from "@/lib/api";
import { formatDate, imageSrc } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { Alert } from "@/components/shadcn/alert";

/** Product categories, read-only for the superadmin; admins manage them. */
export default function CategoriesPage() {
  const { data: categories, loading, error } = useAsync(() => fetchAll((p) => api.productCategories.list({ page: p, limit: 100 })), []);

  return (
    <>
      <PageHeader title="KATEGORI PRODUK" />
      <p className="muted" style={{ marginBottom: 16 }}>
        Kategori produk dikelola oleh admin dan Disnakertrans. Superadmin hanya dapat melihat. Gambarnya tampil di carousel halaman Beranda.
      </p>
      <div className={styles.panel}>
        {loading ? (
          <Loading />
        ) : error ? (
          <Alert variant="destructive">{error}</Alert>
        ) : categories!.length === 0 ? (
          <EmptyState title="Belum ada kategori" />
        ) : (
          <div className="table-wrap">
            <Table className="table">
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Gambar</TableHead>
                  <TableHead>Nama Kategori</TableHead>
                  <TableHead>Jumlah Produk</TableHead>
                  <TableHead>Dibuat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories!.map((c, i) => (
                  <TableRow key={c.id}>
                    <TableCell data-label="No">{i + 1}</TableCell>
                    <TableCell data-label="Gambar">
                      {c.image ? <Thumb src={imageSrc(c.image)} alt={c.image.altText || c.name} className="thumb" /> : <span className="muted">Belum ada (wajib)</span>}
                    </TableCell>
                    <TableCell data-label="Kategori">{c.name}</TableCell>
                    <TableCell data-label="Jumlah Produk">{c.productCount}</TableCell>
                    <TableCell data-label="Dibuat">{formatDate(c.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
