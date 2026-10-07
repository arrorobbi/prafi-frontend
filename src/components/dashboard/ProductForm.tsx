"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError, errorMessage, type ProductInput } from "@/lib/api";
import { formatRupiah, imageSrc, productStatus } from "@/lib/format";
import { useTenantProfile } from "@/lib/tenantProfile";
import type { Product } from "@/lib/types";
import { IconWarning } from "../Icons";
import { useToast } from "../Toast";
import { ImagePicker } from "../ui";
import { useImageUpload } from "../UploadDialog";
import styles from "./ProductForm.module.css";

interface Values {
  name: string;
  /** Digits only, rupiah */
  price: string;
  description: string;
  details: string;
  isRecommended: boolean;
}

/** Profile fields the API reports as missing (GET /api/tenants/me → missingFields), as the tenant knows them. */
const PROFILE_FIELD_LABEL: Record<string, string> = {
  name: "Nama Toko",
  description: "Deskripsi",
  address: "Alamat",
  area: "Wilayah",
  operationalHours: "Jam Operasional",
  whatsappLink: "Nomor WhatsApp",
  fbLink: "Tautan Facebook",
  gmapsLink: "Tautan Google Maps",
  instagramLink: "Tautan Instagram",
  logoId: "Logo Toko",
  tenantCategoryId: "Kategori Usaha",
};

const MAX_PRICE = 2_000_000_000;

/**
 * Create (POST /api/products) or edit (PATCH /api/products/:id) a product. A new photo is uploaded first
 * (POST /api/images, with the upload popup) and its id is sent as imageId. New products need a complete
 * UMKM profile ("Profil UMKM"), which the API enforces too.
 */
export function ProductForm({ product, onSaved }: { product?: Product; onSaved?: (p: Product) => void }) {
  const router = useRouter();
  const toast = useToast();
  const uploader = useImageUpload();
  const { profile, loading: profileLoading } = useTenantProfile();
  const [values, setValues] = useState<Values>({
    name: product?.name ?? "",
    price: product ? String(product.price) : "",
    description: product?.description ?? "",
    details: product?.details ?? "",
    isRecommended: product?.isRecommended ?? false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(product ? imageSrc(product.image) : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const resubmit = !!product && productStatus(product) !== "active";

  // Only creating needs the complete profile; existing products stay editable
  const missing = profile ? (profile.missingFields ?? []) : ["profile"];
  const blocked = !product && !profileLoading && (!profile || profile.isComplete === false);

  const set = (key: "name" | "description" | "details") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!values.name.trim()) e.name = "Nama produk wajib diisi";
    if (!values.price) e.price = "Harga wajib diisi";
    else if (Number(values.price) > MAX_PRICE) e.price = "Harga terlalu besar";
    if (!values.description.trim()) e.description = "Deskripsi produk wajib diisi";
    if (!values.details.trim()) e.details = "Informasi produk wajib diisi";
    if (!product && !file) e.imageId = "Foto produk wajib diunggah";
    return e;
  };

  const finish = (saved: Product) => {
    if (onSaved) onSaved(saved);
    else router.push("/tenant/produk");
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (blocked) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    const body: Omit<ProductInput, "imageId"> = {
      name: values.name.trim(),
      price: Number(values.price),
      description: values.description.trim(),
      details: values.details.trim(),
      isRecommended: values.isRecommended,
    };

    // Editing: only what changed (a new photo always counts as a change)
    let changes: Partial<ProductInput> = body;
    if (product) {
      changes = {};
      (Object.keys(body) as (keyof typeof body)[]).forEach((k) => {
        if (body[k] !== product[k]) (changes as Record<string, unknown>)[k] = body[k];
      });
      if (Object.keys(changes).length === 0 && !file) {
        toast.info("Tidak ada perubahan");
        return;
      }
    }

    const saveWith = async (imageId?: number) => {
      const withImage = imageId !== undefined ? { ...changes, imageId } : changes;
      return product
        ? (await api.products.update(product.id, withImage)).data
        : (await api.products.create(withImage as ProductInput)).data;
    };

    setBusy(true);
    try {
      let saved: Product | null;
      if (file) {
        // Upload popup: progress → saved, or the real error; the product must point at the new image
        saved = await uploader.run({
          file,
          altText: body.name,
          save: saveWith,
          isSaved: (p, imageId) => p.imageId === imageId && !!p.image,
        });
        if (!saved) return;
      } else {
        saved = await saveWith();
      }
      if (product) toast.success("Produk diperbarui", resubmit ? "Produk diajukan ulang dan menunggu konfirmasi administrator." : undefined);
      else toast.success("Produk berhasil diajukan", "Produk menunggu konfirmasi administrator.");
      finish(saved);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      toast.error("Gagal menyimpan produk", errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      {uploader.dialog}
      {blocked && (
        <div className={`alert alert-warning ${styles.full}`}>
          <IconWarning />
          <span>
            {missing.includes("profile")
              ? "Buat profil UMKM terlebih dahulu sebelum menambahkan produk."
              : `Lengkapi profil UMKM terlebih dahulu sebelum menambahkan produk. Belum diisi: ${missing
                  .map((f) => PROFILE_FIELD_LABEL[f] ?? f)
                  .join(", ")}.`}{" "}
            <Link href="/tenant/profil">
              <strong>Buka Profil UMKM</strong>
            </Link>
          </span>
        </div>
      )}
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
          <span className="label">Harga (Rp)</span>
          <input
            className="input"
            inputMode="numeric"
            placeholder="Contoh: 25000"
            value={values.price ? Number(values.price).toLocaleString("id-ID") : ""}
            onChange={(e) => setValues((v) => ({ ...v, price: e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "") }))}
          />
          {values.price && !errors.price && <span className="hint">{formatRupiah(Number(values.price))}</span>}
          {errors.price && <span className="field-error">{errors.price}</span>}
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={values.isRecommended}
            onChange={(e) => setValues((v) => ({ ...v, isRecommended: e.target.checked }))}
          />
          <span>
            <strong>Jadikan produk rekomendasi</strong>
            <small>Produk rekomendasi ditampilkan di halaman utama setelah disetujui.</small>
          </span>
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
          placeholder="Informasi detail produk (bahan, ukuran, cara penggunaan, keunggulan, dll)"
          value={values.details}
          onChange={set("details")}
          maxLength={255}
        />
        {errors.details && <span className="field-error">{errors.details}</span>}
        <span className="hint">{values.details.length}/255 karakter</span>
      </label>
      <div className={styles.actions}>
        <button type="submit" className="btn btn-orange btn-lg" disabled={busy || blocked}>
          {busy ? "Menyimpan..." : !product ? "Ajukan Produk" : resubmit ? "Simpan & Ajukan Ulang" : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
