"use client";

import { useState } from "react";
import { IconPencil, IconPlus, IconTrash } from "@/components/Icons";
import { ConfirmDialog, useConfirm } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { EmptyState, ImagePicker, Loading, PageHeader, Thumb } from "@/components/ui";
import { usePendingImage } from "@/components/UploadDialog";
import { api, ApiError, errorMessage, fetchAll, type CategoryInput } from "@/lib/api";
import { imageSrc } from "@/lib/format";
import type { ProductCategory } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import styles from "./CategoryManager.module.css";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { Alert } from "@/components/shadcn/alert";
import { Card } from "@/components/shadcn/card";

/**
 * Product categories: GET/POST/PATCH/DELETE /api/product-categories. Each must have an image (uploaded first via
 * POST /api/images): the home page carousel shows it, with that category's products next to it. Used by the admin
 * and disnakertrans dashboards (both manage categories).
 */
export function CategoryManager() {
  const toast = useToast();
  const { confirm: ask, dialog: confirmDialog } = useConfirm();
  const photo = usePendingImage();
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<ProductCategory | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const { data, loading, error, reload } = useAsync(
    () => fetchAll((p) => api.productCategories.list({ page: p, limit: 100 })),
    [],
  );

  const startEdit = (c: ProductCategory | null) => {
    if (photo.pending) void photo.discard();
    setEditing(c);
    setName(c?.name ?? "");
    setFormError(null);
  };

  const savedImage = editing?.image ?? null;
  const previewUrl = photo.previewUrl ?? (savedImage ? imageSrc(savedImage) : null);
  const missing = (data ?? []).filter((c) => !c.image);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setFormError("Nama kategori wajib diisi");
    const newPhoto = photo.pending;
    // Every category needs its carousel image (older ones without one get it on their next save)
    if (!newPhoto && !savedImage) return setFormError("Gambar kategori wajib diunggah");
    const input: Partial<CategoryInput> = {};
    if (!editing || name.trim() !== editing.name) input.name = name.trim();
    if (newPhoto) input.imageId = newPhoto.id;
    if (editing && Object.keys(input).length === 0) {
      toast.info("Tidak ada perubahan");
      return;
    }
    if (
      editing &&
      !(await ask({
        title: "Simpan Perubahan Kategori",
        message: (
          <>
            Simpan perubahan kategori <strong>{editing.name}</strong>?{newPhoto && " Gambar lama akan diganti dengan gambar baru."}
          </>
        ),
        confirmLabel: "Ya, simpan",
      }))
    )
      return;

    setSaving(true);
    setFormError(null);
    try {
      const saved = editing
        ? (await api.productCategories.update(editing.id, input)).data
        : (await api.productCategories.create(input as CategoryInput)).data;
      if (newPhoto) photo.saved(saved.imageId === newPhoto.id);
      toast.success(editing ? "Kategori diperbarui" : "Kategori ditambahkan");
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
      await api.productCategories.remove(deleting.id);
      toast.success("Kategori dihapus");
      if (editing?.id === deleting.id) startEdit(null);
      reload();
    } catch (err) {
      toast.error(
        "Gagal menghapus",
        err instanceof ApiError && err.code === "STILL_IN_USE"
          ? "Kategori masih dipakai oleh produk. Minta penjual memindahkan produknya ke kategori lain terlebih dahulu."
          : errorMessage(err),
      );
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  };

  return (
    <>
      {photo.dialog}
      {confirmDialog}
      <PageHeader title="KATEGORI PRODUK" />
      <div className={styles.layout}>
        <div>
          <Button type="button" variant="navy" className={styles.add} onClick={() => startEdit(null)}>
            <IconPlus /> TAMBAH KATEGORI
          </Button>
          {missing.length > 0 && (
            <Alert variant="warning" className="mb-3.5">
              {missing.length} kategori belum memiliki gambar ({missing.map((c) => c.name).join(", ")}). Gambar wajib: klik ikon
              pensil lalu unggah gambarnya.
            </Alert>
          )}
          {loading && !data ? (
            <Loading />
          ) : error ? (
            <Alert variant="destructive">{error}</Alert>
          ) : data!.length === 0 ? (
            <Card>
              <EmptyState title="Belum ada kategori">Tambahkan kategori agar penjual dapat memilihnya saat menambahkan produk.</EmptyState>
            </Card>
          ) : (
            <div className={styles.tableBox}>
              <Table className={styles.grid}>
                <TableHeader>
                  <TableRow>
                    <TableHead>NO</TableHead>
                    <TableHead>GAMBAR</TableHead>
                    <TableHead>NAMA KATEGORI</TableHead>
                    <TableHead>JUMLAH PRODUK</TableHead>
                    <TableHead className="col-actions">AKSI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data!.map((c, i) => (
                    <TableRow key={c.id} className={editing?.id === c.id ? styles.editingRow : ""}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>
                        {c.image ? (
                          <Thumb src={imageSrc(c.image)} alt={c.image.altText || c.name} className={styles.thumb} />
                        ) : (
                          <span className={styles.missing}>Belum ada (wajib)</span>
                        )}
                      </TableCell>
                      <TableCell>{c.name.toUpperCase()}</TableCell>
                      <TableCell>{c.productCount}</TableCell>
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
          <div className="field">
            <span className={styles.formLabel}>Gambar Carousel Beranda</span>
            <ImagePicker
              title="UNGGAH GAMBAR KATEGORI"
              previewUrl={previewUrl}
              pending={!!photo.pending}
              onFile={(f) => void photo.pick(f, name.trim() || "Gambar kategori")}
            />
            {photo.pending && (
              <Button type="button" variant="white" size="sm" className="self-start" onClick={() => void photo.discard()}>
                Batalkan gambar baru
              </Button>
            )}
          </div>
          {formError && <Alert variant="destructive">{formError}</Alert>}
          <p className={styles.note}>
            Penjual memilih kategori untuk setiap produknya (mis. Makanan Berat, Minuman, Kerajinan Tangan). Gambar kategori{" "}
            <strong>wajib</strong> dan tampil di carousel halaman Beranda, bersama produk dari kategori tersebut. Gambar dapat diganti,
            tetapi tidak dapat dihapus.
          </p>
          <div className={styles.formButtons}>
            <Button type="submit" variant="green" disabled={saving || photo.uploading}>
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
            Hapus kategori <strong>{deleting?.name}</strong>? Kategori yang masih dipakai oleh produk tidak dapat dihapus.
          </>
        }
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
