"use client";

import { useState } from "react";
import { IconPencil, IconPlus, IconTrash } from "@/components/Icons";
import { ConfirmDialog } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { EmptyState, Loading, PageHeader } from "@/components/ui";
import { api, ApiError, errorMessage, fetchAll } from "@/lib/api";
import type { TenantCategory } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import styles from "./kategori.module.css";

/** Tenant (UMKM) categories: GET/POST/PATCH/DELETE /api/tenant-categories. */
export default function CategoriesPage() {
  const toast = useToast();
  const [editing, setEditing] = useState<TenantCategory | null>(null);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<TenantCategory | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const { data, loading, error, reload } = useAsync(async () => {
    const [categories, tenants] = await Promise.all([
      fetchAll((p) => api.tenantCategories.list({ page: p, limit: 100 })),
      fetchAll((p) => api.tenants.list({ page: p, limit: 100 })),
    ]);
    const counts = new Map<number, number>();
    for (const t of tenants) counts.set(t.tenantCategoryId, (counts.get(t.tenantCategoryId) ?? 0) + 1);
    return { categories, counts };
  }, []);

  const startEdit = (c: TenantCategory | null) => {
    setEditing(c);
    setName(c?.name ?? "");
    setFormError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setFormError("Nama kategori wajib diisi");
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await api.tenantCategories.update(editing.id, name.trim());
        toast.success("Kategori diperbarui");
      } else {
        await api.tenantCategories.create(name.trim());
        toast.success("Kategori ditambahkan");
      }
      startEdit(null);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError && err.code === "UNIQUE_CONSTRAINT" ? "Nama kategori sudah digunakan" : errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api.tenantCategories.remove(deleting.id);
      toast.success("Kategori dihapus");
      if (editing?.id === deleting.id) startEdit(null);
      reload();
    } catch (err) {
      toast.error(
        "Gagal menghapus",
        err instanceof ApiError && err.code === "STILL_IN_USE" ? "Kategori masih dipakai oleh profil UMKM." : errorMessage(err),
      );
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  };

  return (
    <>
      <PageHeader title="KATEGORI UMKM" />
      <div className={styles.layout}>
        <div>
          <button type="button" className={`btn btn-navy ${styles.add}`} onClick={() => startEdit(null)}>
            <IconPlus /> TAMBAH KATEGORI
          </button>
          {loading && !data ? (
            <Loading />
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : data!.categories.length === 0 ? (
            <div className="card">
              <EmptyState title="Belum ada kategori">Tambahkan kategori agar penjual dapat membuat profil toko.</EmptyState>
            </div>
          ) : (
            <div className={styles.tableBox}>
              <table className={styles.grid}>
                <thead>
                  <tr>
                    <th>NO</th>
                    <th>NAMA KATEGORI</th>
                    <th>JUMLAH UMKM</th>
                    <th>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.categories.map((c, i) => (
                    <tr key={c.id} className={editing?.id === c.id ? styles.editingRow : ""}>
                      <td>{i + 1}</td>
                      <td>{c.name.toUpperCase()}</td>
                      <td>{data!.counts.get(c.id) ?? 0}</td>
                      <td>
                        <span className="actions">
                          <button type="button" className="icon-btn" aria-label={`Ubah ${c.name}`} onClick={() => startEdit(c)}>
                            <IconPencil />
                          </button>
                          <button type="button" className="icon-btn" aria-label={`Hapus ${c.name}`} onClick={() => setDeleting(c)}>
                            <IconTrash />
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form className={styles.form} onSubmit={save}>
          <h2>{editing ? "EDIT KATEGORI" : "TAMBAH KATEGORI"}</h2>
          <label className="field">
            <span className={styles.formLabel}>Nama Kategori</span>
            <input className="input input-white" placeholder="Masukan nama kategori" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          {formError && <div className="alert alert-error">{formError}</div>}
          <p className={styles.note}>Kategori dipakai penjual saat membuat profil toko (mis. Makanan Berat, Minuman, Kerajinan Tangan).</p>
          <div className={styles.formButtons}>
            <button type="submit" className="btn btn-green" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
            <button type="button" className="btn btn-red" onClick={() => startEdit(null)} disabled={saving}>
              Batal
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={!!deleting}
        title="Hapus Kategori"
        danger
        busy={deleteBusy}
        confirmLabel="Hapus"
        message={
          <>
            Hapus kategori <strong>{deleting?.name}</strong>? Kategori yang masih dipakai oleh profil UMKM tidak dapat dihapus.
          </>
        }
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
