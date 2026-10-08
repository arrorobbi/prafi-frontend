"use client";

import styles from "@/components/dashboard/dashboard.module.css";
import { EmptyState, Loading, PageHeader } from "@/components/ui";
import { api, fetchAll } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { Alert } from "@/components/shadcn/alert";

/** Read-only for the superadmin; admins manage categories. */
export default function CategoriesPage() {
  const { data, loading, error } = useAsync(async () => {
    const [categories, tenants] = await Promise.all([
      fetchAll((p) => api.tenantCategories.list({ page: p, limit: 100 })),
      fetchAll((p) => api.tenants.list({ page: p, limit: 100 })),
    ]);
    const counts = new Map<number, number>();
    for (const t of tenants) counts.set(t.tenantCategoryId, (counts.get(t.tenantCategoryId) ?? 0) + 1);
    return { categories, counts };
  }, []);

  return (
    <>
      <PageHeader title="KATEGORI UMKM" />
      <p className="muted" style={{ marginBottom: 16 }}>
        Kategori dikelola oleh admin. Superadmin hanya dapat melihat.
      </p>
      <div className={styles.panel}>
        {loading ? (
          <Loading />
        ) : error ? (
          <Alert variant="destructive">{error}</Alert>
        ) : data!.categories.length === 0 ? (
          <EmptyState title="Belum ada kategori" />
        ) : (
          <div className="table-wrap">
            <Table className="table">
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama Kategori</TableHead>
                  <TableHead>Jumlah UMKM</TableHead>
                  <TableHead>Dibuat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.categories.map((c, i) => (
                  <TableRow key={c.id}>
                    <TableCell data-label="No">{i + 1}</TableCell>
                    <TableCell data-label="Kategori">{c.name}</TableCell>
                    <TableCell data-label="Jumlah UMKM">{data!.counts.get(c.id) ?? 0}</TableCell>
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
