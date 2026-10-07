"use client";

import styles from "@/components/dashboard/dashboard.module.css";
import { EmptyState, Loading, PageHeader } from "@/components/ui";
import { api, fetchAll } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";

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
          <div className="alert alert-error">{error}</div>
        ) : data!.categories.length === 0 ? (
          <EmptyState title="Belum ada kategori" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Kategori</th>
                  <th>Jumlah UMKM</th>
                  <th>Dibuat</th>
                </tr>
              </thead>
              <tbody>
                {data!.categories.map((c, i) => (
                  <tr key={c.id}>
                    <td data-label="No">{i + 1}</td>
                    <td data-label="Kategori">{c.name}</td>
                    <td data-label="Jumlah UMKM">{data!.counts.get(c.id) ?? 0}</td>
                    <td data-label="Dibuat">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
