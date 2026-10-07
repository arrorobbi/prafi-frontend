"use client";

import { useEffect, useState } from "react";
import styles from "@/components/dashboard/dashboard.module.css";
import { IconWarning } from "@/components/Icons";
import { useToast } from "@/components/Toast";
import { ImagePicker } from "@/components/ui";
import { api, ApiError, errorMessage, fetchAll, type TenantInput } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { imageSrc, whatsappUrl } from "@/lib/format";
import type { TenantCategory, TenantProfile } from "@/lib/types";
import local from "./profil.module.css";

/** Areas of the Prafi transmigration zone (from the design); anything else goes in "Lainnya". */
const AREAS = ["Wilayah SP 1", "Wilayah SP 2", "Wilayah SP 3", "Wilayah SP 4"];
const OTHER = "__other";
const EMPTY_LINK = "-";

function parseHours(value?: string) {
  const m = value?.match(/(\d{1,2})[:.](\d{2})\s*-\s*(\d{1,2})[:.](\d{2})/);
  const days = value && m ? value.slice(0, m.index).replace(/[,\s]+$/, "") : "";
  return {
    days,
    open: m ? `${m[1].padStart(2, "0")}:${m[2]}` : "08:00",
    close: m ? `${m[3].padStart(2, "0")}:${m[4]}` : "17:00",
  };
}

/** "https://wa.me/62812..." → "0812..." for editing */
function phoneFromWhatsapp(link?: string) {
  const digits = link?.match(/wa\.me\/(\d+)/)?.[1];
  return digits ? `0${digits.replace(/^62/, "")}` : "";
}

/** Create (POST /api/tenants/me) or update (PATCH /api/tenants/me) the shop profile. */
export function ProfileForm({
  profile,
  onSaved,
  onCancel,
}: {
  profile: TenantProfile | null;
  onSaved: (p: TenantProfile) => void;
  onCancel?: () => void;
}) {
  const toast = useToast();
  const { user } = useAuth();
  const hours = parseHours(profile?.operationalHours);
  const knownArea = !profile || AREAS.includes(profile.area);

  const [name, setName] = useState(profile?.name ?? user?.tenantName ?? "");
  const [categoryId, setCategoryId] = useState(profile ? String(profile.tenantCategoryId) : "");
  const [area, setArea] = useState(profile ? (knownArea ? profile.area : OTHER) : "");
  const [otherArea, setOtherArea] = useState(knownArea ? "" : (profile?.area ?? ""));
  const [description, setDescription] = useState(profile?.description ?? "");
  const [address, setAddress] = useState(profile?.address ?? "");
  const [days, setDays] = useState(hours.days);
  const [open, setOpen] = useState(hours.open);
  const [close, setClose] = useState(hours.close);
  const [whatsapp, setWhatsapp] = useState(phoneFromWhatsapp(profile?.whatsappLink) || user?.phoneNumber || "");
  const [fbLink, setFbLink] = useState(profile?.fbLink && profile.fbLink !== EMPTY_LINK ? profile.fbLink : "");
  const [gmapsLink, setGmapsLink] = useState(profile?.gmapsLink && profile.gmapsLink !== EMPTY_LINK ? profile.gmapsLink : "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(profile?.logo ? imageSrc(profile.logo) : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const [categories, setCategories] = useState<TenantCategory[] | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  useEffect(() => {
    fetchAll((p) => api.tenantCategories.list({ page: p, limit: 100 }))
      .then(setCategories)
      .catch((err) => {
        // Kategori Usaha = the Kategori UMKM the admin manages; if they can't load, keep the current one selectable
        setCategoryError(`Daftar kategori UMKM gagal dimuat: ${errorMessage(err)}`);
        setCategories(profile?.category ? [profile.category] : []);
      });
  }, [profile?.category]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Nama usaha/toko wajib diisi";
    if (!categoryId) e.tenantCategoryId = "Pilih kategori usaha";
    if (!area || (area === OTHER && !otherArea.trim())) e.area = "Pilih wilayah usaha";
    if (!description.trim()) e.description = "Deskripsi wajib diisi";
    if (!address.trim()) e.address = "Alamat wajib diisi";
    if (!open || !close) e.operationalHours = "Isi jam buka dan tutup";
    if (whatsapp.replace(/\D/g, "").length < 9) e.whatsappLink = "Nomor WhatsApp tidak valid";
    if (fbLink && !/^https?:\/\//i.test(fbLink)) e.fbLink = "Tautan harus diawali https://";
    if (gmapsLink && !/^https?:\/\//i.test(gmapsLink)) e.gmapsLink = "Tautan harus diawali https://";
    if (!profile && !file) e.logoId = "Logo/foto toko wajib diunggah";
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
      if (file) uploadedId = (await api.images.upload(file, `Logo ${name.trim()}`)).data.id;
      const body: TenantInput = {
        name: name.trim(),
        tenantCategoryId: Number(categoryId),
        area: area === OTHER ? otherArea.trim() : area,
        description: description.trim(),
        address: address.trim(),
        operationalHours: `${days.trim() ? `${days.trim()}, ` : ""}${open} - ${close} WIT`,
        whatsappLink: whatsappUrl(whatsapp),
        fbLink: fbLink.trim() || EMPTY_LINK,
        gmapsLink: gmapsLink.trim() || EMPTY_LINK,
        logoId: uploadedId ?? profile!.logoId,
      };

      let saved: TenantProfile;
      if (profile) {
        const changes: Partial<TenantInput> = {};
        (Object.keys(body) as (keyof TenantInput)[]).forEach((k) => {
          if (body[k] !== (profile as unknown as Record<string, unknown>)[k]) (changes as Record<string, unknown>)[k] = body[k];
        });
        if (Object.keys(changes).length === 0) {
          toast.info("Tidak ada perubahan");
          onSaved(profile);
          return;
        }
        saved = (await api.tenants.updateMine(changes)).data;
      } else {
        saved = (await api.tenants.createMine(body)).data;
      }
      uploadedId = null;
      toast.success(profile ? "Profil toko diperbarui" : "Profil toko dibuat");
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      toast.error("Gagal menyimpan profil", errorMessage(err));
      if (uploadedId !== null) api.images.remove(uploadedId).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={local.form} onSubmit={submit} noValidate>
      <div className={local.left}>
        <label className="field">
          <span className="label">Nama Usaha/Toko</span>
          <input className="input" placeholder="Masukan nama usaha/toko" value={name} onChange={(e) => setName(e.target.value)} maxLength={255} />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>
        <div className={styles.formGrid}>
          <label className="field">
            <span className="label">Wilayah Usaha/Toko</span>
            <select className="select" value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="" disabled>
                Pilih wilayah
              </option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
              <option value={OTHER}>Lainnya</option>
            </select>
            {area === OTHER && (
              <input className="input" placeholder="Nama wilayah" value={otherArea} onChange={(e) => setOtherArea(e.target.value)} />
            )}
            {errors.area && <span className="field-error">{errors.area}</span>}
          </label>
          <label className="field">
            <span className="label">Kategori Usaha/Toko</span>
            <select className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={!categories}>
              <option value="" disabled>
                {categories ? "Pilih kategori" : "Memuat..."}
              </option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.tenantCategoryId && <span className="field-error">{errors.tenantCategoryId}</span>}
          </label>
        </div>
        {categoryError && (
          <div className="alert alert-warning">
            <IconWarning />
            <span>{categoryError}</span>
          </div>
        )}
        <label className="field">
          <span className="label">Deskripsi Usaha/Toko</span>
          <textarea
            className="textarea"
            placeholder="Ceritakan tentang usaha/toko anda (maks. 255 karakter)"
            value={description}
            maxLength={255}
            onChange={(e) => setDescription(e.target.value)}
          />
          {errors.description && <span className="field-error">{errors.description}</span>}
        </label>
        <label className="field">
          <span className="label">Alamat Usaha/Toko</span>
          <input className="input" placeholder="Contoh: Jalur 6 Bawah, SP 2, Distrik Prafi, Kab. Manokwari" value={address} maxLength={255} onChange={(e) => setAddress(e.target.value)} />
          {errors.address && <span className="field-error">{errors.address}</span>}
        </label>
        <div className="field">
          <span className="label">Jam Operasional</span>
          <div className={local.hours}>
            <input className="input" placeholder="Hari (mis. Senin - Jumat)" value={days} onChange={(e) => setDays(e.target.value)} aria-label="Hari operasional" />
            <input className="input" type="time" value={open} onChange={(e) => setOpen(e.target.value)} aria-label="Jam buka" />
            <input className="input" type="time" value={close} onChange={(e) => setClose(e.target.value)} aria-label="Jam tutup" />
          </div>
          {errors.operationalHours && <span className="field-error">{errors.operationalHours}</span>}
        </div>
      </div>

      <div className={local.right}>
        <ImagePicker
          title="UNGGAH FOTO ATAU LOGO"
          previewUrl={preview}
          round
          error={errors.logoId}
          onFile={(f, url) => {
            setFile(f);
            setPreview(url);
          }}
        />
        <label className="field">
          <span className="label">Nomor WhatsApp</span>
          <input className="input" inputMode="tel" placeholder="0812-8899-0067" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          {errors.whatsappLink && <span className="field-error">{errors.whatsappLink}</span>}
        </label>
        <label className="field">
          <span className="label">Tautan Google Maps (opsional)</span>
          <input className="input" placeholder="https://maps.app.goo.gl/..." value={gmapsLink} onChange={(e) => setGmapsLink(e.target.value)} />
          {errors.gmapsLink && <span className="field-error">{errors.gmapsLink}</span>}
        </label>
        <label className="field">
          <span className="label">Tautan Facebook / Toko Online (opsional)</span>
          <input className="input" placeholder="https://facebook.com/..." value={fbLink} onChange={(e) => setFbLink(e.target.value)} />
          {errors.fbLink && <span className="field-error">{errors.fbLink}</span>}
        </label>
        <div className={styles.formActions}>
          {onCancel && (
            <button type="button" className="btn btn-light" onClick={onCancel} disabled={busy}>
              Batal
            </button>
          )}
          <button type="submit" className="btn btn-navy btn-lg" disabled={busy || (!profile && !!categoryError && !categories?.length)}>
            {busy ? "MENYIMPAN..." : "SIMPAN PROFIL"}
          </button>
        </div>
      </div>
    </form>
  );
}
