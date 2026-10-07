"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { imageSrc, productStatus } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useToast } from "../Toast";
import { ImagePicker } from "../ui";
import styles from "./ProductForm.module.css";

interface Values {
  name: string;
  qty: string;
  description: string;
  details: string;
}

/**
 * Create (POST /api/products) or edit (PATCH /api/products/:id) a product. The photo is uploaded
 * first (POST /api/images) and its id is sent as imageId.
 */
export function ProductForm({ product, onSaved }: { product?: Product; onSaved?: (p: Product) => void }) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<Values>({
    name: product?.name ?? "",
    qty: product ? String(product.qty) : "",
    description: product?.description ?? "",
    details: product?.details ?? "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(product ? imageSrc(product.image) : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const resubmit = !!product && productStatus(product) !== "active";

  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!values.name.trim()) e.name = "Nama produk wajib diisi";
    if (!/^\d+$/.test(values.qty.trim())) e.qty = "Stok harus berupa angka bulat, minimal 0";
    if (!values.description.trim()) e.description = "Deskripsi produk wajib diisi";
    if (!values.details.trim()) e.details = "Informasi produk wajib diisi";
    if (!product && !file) e.imageId = "Foto produk wajib diunggah";
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    let uploadedId: number | null = null;
    try {
      if (file) {
        const { data: image } = await api.images.upload(file, values.name.trim());
        uploadedId = image.id;
      }
      const body = {
        name: values.name.trim(),
        qty: Number(values.qty),
        description: values.description.trim(),
        details: values.details.trim(),
        ...(uploadedId !== null ? { imageId: uploadedId } : {}),
      };

      let saved: Product;
      if (product) {
        const changes: Partial<typeof body> = {};
        (Object.keys(body) as (keyof typeof body)[]).forEach((k) => {
          if (k === "imageId" || body[k] !== product[k]) (changes as Record<string, unknown>)[k] = body[k];
        });
        if (Object.keys(changes).length === 0) {
          toast.info("Tidak ada perubahan");
          setBusy(false);
          return;
        }
        saved = (await api.products.update(product.id, changes)).data;
        toast.success("Produk diperbarui", resubmit ? "Produk diajukan ulang dan menunggu konfirmasi administrator." : undefined);
      } else {
        saved = (await api.products.create(body as Required<typeof body>)).data;
        toast.success("Produk berhasil diajukan", "Produk menunggu konfirmasi administrator.");
      }
      uploadedId = null;
      if (onSaved) onSaved(saved);
      else router.push("/tenant/produk");
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      toast.error("Gagal menyimpan produk", errorMessage(err));
      // Don't leave an unused upload behind
      if (uploadedId !== null) api.images.remove(uploadedId).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.picker}>
        <ImagePicker
          title="UNGGAH FOTO PRODUK"
          previewUrl={preview}
          error={errors.imageId}
          onFile={(f, url) => {
            setFile(f);
            setPreview(url);
          }}
        />
      </div>
      <div className={styles.side}>
        <label className="field">
          <span className="label">Nama Produk</span>
          <input className="input" placeholder="Masukan nama produk" value={values.name} onChange={set("name")} maxLength={255} />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>
        <label className="field">
          <span className="label">Stok</span>
          <input className="input" inputMode="numeric" placeholder="Jumlah stok tersedia" value={values.qty} onChange={set("qty")} />
          {errors.qty && <span className="field-error">{errors.qty}</span>}
        </label>
      </div>
      <label className={`field ${styles.full}`}>
        <span className="label">Deskripsi Produk</span>
        <textarea className="textarea" placeholder="Jelaskan produk anda secara singkat....." value={values.description} onChange={set("description")} maxLength={255} />
        {errors.description && <span className="field-error">{errors.description}</span>}
        <span className="hint">{values.description.length}/255 karakter</span>
      </label>
      <label className={`field ${styles.full}`}>
        <span className="label">Informasi Produk</span>
        <textarea
          className="textarea"
          placeholder="Informasi detail produk (bahan, ukuran, harga, cara penggunaan, keunggulan, dll)"
          value={values.details}
          onChange={set("details")}
          maxLength={255}
        />
        {errors.details && <span className="field-error">{errors.details}</span>}
        <span className="hint">{values.details.length}/255 karakter</span>
      </label>
      <div className={styles.actions}>
        <button type="submit" className="btn btn-orange btn-lg" disabled={busy}>
          {busy ? "Menyimpan..." : !product ? "Ajukan Produk" : resubmit ? "Simpan & Ajukan Ulang" : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
