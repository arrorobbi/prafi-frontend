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
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { Alert } from "@/components/shadcn/alert";
import { Card } from "@/components/shadcn/card";

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
          <Button type="button" variant="navy" className={styles.add} onClick={() => startEdit(null)}>
            <IconPlus /> TAMBAH KATEGORI
          </Button>
          {loading && !data ? (
            <Loading />
          ) : error ? (
            <Alert variant="destructive">{error}</Alert>
          ) : data!.categories.length === 0 ? (
            <Card>
              <EmptyState title="Belum ada kategori">Tambahkan kategori agar penjual dapat membuat profil toko.</EmptyState>
            </Card>
          ) : (
            <div className={styles.tableBox}>
              <Table className={styles.grid}>
                <TableHeader>
                  <TableRow>
                    <TableHead>NO</TableHead>
                    <TableHead>NAMA KATEGORI</TableHead>
                    <TableHead>JUMLAH UMKM</TableHead>
                    <TableHead>AKSI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data!.categories.map((c, i) => (
                    <TableRow key={c.id} className={editing?.id === c.id ? styles.editingRow : ""}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{c.name.toUpperCase()}</TableCell>
                      <TableCell>{data!.counts.get(c.id) ?? 0}</TableCell>
                      <TableCell>
                        <span className="actions">
                          <Button type="button" variant="icon" size="icon" aria-label={`Ubah ${c.name}`} onClick={() => startEdit(c)}>
                            <IconPencil />
                          </Button>
                          <Button type="button" variant="icon" size="icon" aria-label={`Hapus ${c.name}`} onClick={() => setDeleting(c)}>
                            <IconTrash />
                          </Button>
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <form className={styles.form} onSubmit={save}>
          <h2>{editing ? "EDIT KATEGORI" : "TAMBAH KATEGORI"}</h2>
          <label className="field">
            <span className={styles.formLabel}>Nama Kategori</span>
            <Input placeholder="Masukan nama kategori" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          {formError && <Alert variant="destructive">{formError}</Alert>}
          <p className={styles.note}>Kategori dipakai penjual saat membuat profil toko (mis. Makanan Berat, Minuman, Kerajinan Tangan).</p>
          <div className={styles.formButtons}>
            <Button type="submit" variant="green" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
            <Button type="button" variant="red" onClick={() => startEdit(null)} disabled={saving}>
              Batal
            </Button>
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
