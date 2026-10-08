"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError, errorMessage, type ProductInput } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatRupiah, imageSrc, productStatus } from "@/lib/format";
import { useTenantProfile } from "@/lib/tenantProfile";
import type { Product } from "@/lib/types";
import { IconWarning } from "../Icons";
import { useToast } from "../Toast";
import { ImagePicker } from "../ui";
import { usePendingImage } from "../UploadDialog";
import styles from "./ProductForm.module.css";
import { Button, buttonVariants } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { Alert } from "@/components/shadcn/alert";
import { Checkbox } from "../shadcn/checkbox";

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
  logoId: "Logo Toko",
  tenantCategoryId: "Kategori Usaha",
  faceImageId: "Foto Profil Akun",
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
  // The photo uploads when picked; it's only attached to the product with Simpan / Ajukan
  const photo = usePendingImage();
  const { profile, loading: profileLoading } = useTenantProfile();
  const { user } = useAuth();
  const [values, setValues] = useState<Values>({
    name: product?.name ?? "",
    price: product ? String(product.price) : "",
    description: product?.description ?? "",
    details: product?.details ?? "",
    isRecommended: product?.isRecommended ?? false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const resubmit = !!product && productStatus(product) !== "active";

  // Only creating needs a complete profile + an account photo; existing products stay editable.
  // The photo is checked on the live account, so the notice goes away as soon as a photo is saved.
  const missing = [
    ...(profile ? (profile.missingFields ?? []).filter((f) => f !== "faceImageId") : ["profile"]),
    ...(user && !user.faceImageId ? ["faceImageId"] : []),
  ];
  const profileMissing = missing.filter((f) => f !== "faceImageId");
  const blocked = !product && !profileLoading && missing.length > 0;

  const set = (key: "name" | "description" | "details") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!values.name.trim()) e.name = "Nama produk wajib diisi";
    if (!values.price) e.price = "Harga wajib diisi";
    else if (Number(values.price) > MAX_PRICE) e.price = "Harga terlalu besar";
    if (!values.description.trim()) e.description = "Deskripsi produk wajib diisi";
    if (!values.details.trim()) e.details = "Informasi produk wajib diisi";
    if (!product && !photo.pending) e.imageId = "Foto produk wajib diunggah";
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
      if (Object.keys(changes).length === 0 && !photo.pending) {
        toast.info("Tidak ada perubahan");
        return;
      }
    }

    const newPhoto = photo.pending;
    const withPhoto = newPhoto ? { ...changes, imageId: newPhoto.id } : changes;

    setBusy(true);
    try {
      const saved = product
        ? (await api.products.update(product.id, withPhoto)).data
        : (await api.products.create(withPhoto as ProductInput)).data;
      if (newPhoto) {
        // Saved only when the product really points at the new photo
        const ok = saved.imageId === newPhoto.id && !!saved.image;
        photo.saved(ok);
        if (!ok) return;
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
      {photo.dialog}
      {blocked && (
        <Alert variant="warning" className={styles.full}>
          <IconWarning />
          <span>
            <strong>Lengkapi data Anda dulu sebelum menambahkan produk.</strong>{" "}
            {missing.includes("profile")
              ? "Profil UMKM belum dibuat."
              : profileMissing.length > 0 && `Profil UMKM belum lengkap: ${profileMissing.map((f) => PROFILE_FIELD_LABEL[f] ?? f).join(", ")}.`}{" "}
            {missing.includes("faceImageId") && "Foto profil akun belum diunggah."}
            <span className={styles.fixLinks}>
              {profileMissing.length > 0 && (
                <Link href="/tenant/profil" className={buttonVariants({ variant: "navy", size: "sm" })}>
                  Buka Profil UMKM
                </Link>
              )}
              {missing.includes("faceImageId") && (
                <Link href="/tenant/pengaturan" className={buttonVariants({ variant: "orange", size: "sm" })}>
                  Unggah Foto Profil
                </Link>
              )}
            </span>
          </span>
        </Alert>
      )}
      <div className={styles.picker}>
        <ImagePicker
          title="UNGGAH FOTO PRODUK"
          previewUrl={photo.previewUrl ?? (product ? imageSrc(product.image) : null)}
          error={errors.imageId}
          pending={!!photo.pending}
          onFile={(f) => void photo.pick(f, values.name.trim() || "Foto produk")}
        />
      </div>
      <div className={styles.side}>
        <label className="field">
          <span className="label">Nama Produk</span>
          <Input placeholder="Masukan nama produk" value={values.name} onChange={set("name")} maxLength={255} />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>
        <label className="field">
          <span className="label">Harga (Rp)</span>
          <Input
           
            inputMode="numeric"
            placeholder="Contoh: 25000"
            value={values.price ? Number(values.price).toLocaleString("id-ID") : ""}
            onChange={(e) => setValues((v) => ({ ...v, price: e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "") }))}
          />
          {values.price && !errors.price && <span className="hint">{formatRupiah(Number(values.price))}</span>}
          {errors.price && <span className="field-error">{errors.price}</span>}
        </label>
        <label className={styles.check}>
          <Checkbox
            checked={values.isRecommended}
            onCheckedChange={(checked) => setValues((v) => ({ ...v, isRecommended: checked === true }))}
            className="mt-0.5 size-5 border-brand-orange data-[state=checked]:border-brand-orange data-[state=checked]:bg-brand-orange"
          />
          <span>
            <strong>Jadikan produk rekomendasi</strong>
            <small>Produk rekomendasi ditampilkan di halaman utama setelah disetujui.</small>
          </span>
        </label>
      </div>
      <label className={`field ${styles.full}`}>
        <span className="label">Deskripsi Produk</span>
        <Textarea placeholder="Jelaskan produk anda secara singkat....." value={values.description} onChange={set("description")} maxLength={255} />
        {errors.description && <span className="field-error">{errors.description}</span>}
        <span className="hint">{values.description.length}/255 karakter</span>
      </label>
      <label className={`field ${styles.full}`}>
        <span className="label">Informasi Produk</span>
        <Textarea
         
          placeholder="Informasi detail produk (bahan, ukuran, cara penggunaan, keunggulan, dll)"
          value={values.details}
          onChange={set("details")}
          maxLength={255}
        />
        {errors.details && <span className="field-error">{errors.details}</span>}
        <span className="hint">{values.details.length}/255 karakter</span>
      </label>
      <div className={styles.actions}>
        <Button type="submit" variant="orange" size="lg" disabled={busy || blocked || photo.uploading}>
          {busy ? "Menyimpan..." : !product ? "Ajukan Produk" : resubmit ? "Simpan & Ajukan Ulang" : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}
