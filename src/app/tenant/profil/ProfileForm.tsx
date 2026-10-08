"use client";

import { useState } from "react";
import styles from "@/components/dashboard/dashboard.module.css";
import { useToast } from "@/components/Toast";
import { ImagePicker } from "@/components/ui";
import { useLeaveGuard } from "@/components/LeaveGuard";
import { usePendingImage } from "@/components/UploadDialog";
import { api, ApiError, errorMessage, type TenantInput } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { imageSrc, whatsappUrl } from "@/lib/format";
import type { TenantProfile } from "@/lib/types";
import local from "./profil.module.css";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { NativeSelect } from "@/components/shadcn/native-select";

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
  // Optional links: left empty = no link (null)
  const [instagramLink, setInstagramLink] = useState(profile?.instagramLink ?? "");
  const [googleBusinessLink, setGoogleBusinessLink] = useState(profile?.googleBusinessLink ?? "");
  const [shopeeLink, setShopeeLink] = useState(profile?.shopeeLink ?? "");
  // The logo uploads when picked; it's only attached to the profile with Simpan
  const logo = usePendingImage();
  const { confirmLeave } = useLeaveGuard();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Nama usaha/toko wajib diisi";
    if (!area || (area === OTHER && !otherArea.trim())) e.area = "Pilih wilayah usaha";
    if (!description.trim()) e.description = "Deskripsi wajib diisi";
    if (!address.trim()) e.address = "Alamat wajib diisi";
    if (!open || !close) e.operationalHours = "Isi jam buka dan tutup";
    if (whatsapp.replace(/\D/g, "").length < 9) e.whatsappLink = "Nomor WhatsApp tidak valid";
    if (!fbLink.trim()) e.fbLink = "Tautan Facebook / toko online wajib diisi";
    else if (!/^https?:\/\/\S+$/i.test(fbLink.trim())) e.fbLink = "Tautan harus diawali https://";
    if (gmapsLink && !/^https?:\/\//i.test(gmapsLink)) e.gmapsLink = "Tautan harus diawali https://";
    const optionalLinks = { instagramLink, googleBusinessLink, shopeeLink };
    for (const [key, value] of Object.entries(optionalLinks)) {
      if (value.trim() && !/^https?:\/\/\S+$/i.test(value.trim())) e[key] = "Tautan harus diawali https:// (atau kosongkan)";
    }
    if (!profile && !logo.pending) e.logoId = "Logo/foto toko wajib diunggah";
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    const body: Omit<TenantInput, "logoId"> = {
      name: name.trim(),
      area: area === OTHER ? otherArea.trim() : area,
      description: description.trim(),
      address: address.trim(),
      operationalHours: `${days.trim() ? `${days.trim()}, ` : ""}${open} - ${close} WIT`,
      whatsappLink: whatsappUrl(whatsapp),
      fbLink: fbLink.trim(),
      gmapsLink: gmapsLink.trim() || EMPTY_LINK,
      instagramLink: instagramLink.trim() || null,
      googleBusinessLink: googleBusinessLink.trim() || null,
      shopeeLink: shopeeLink.trim() || null,
    };

    // Editing: only what changed (a new logo always counts as a change)
    let changes: Partial<TenantInput> = body;
    if (profile) {
      changes = {};
      (Object.keys(body) as (keyof typeof body)[]).forEach((k) => {
        if (body[k] !== (profile as unknown as Record<string, unknown>)[k]) (changes as Record<string, unknown>)[k] = body[k];
      });
      if (Object.keys(changes).length === 0 && !logo.pending) {
        toast.info("Tidak ada perubahan");
        onSaved(profile);
        return;
      }
    }

    const newLogo = logo.pending;
    const withLogo = newLogo ? { ...changes, logoId: newLogo.id } : changes;

    setBusy(true);
    try {
      const saved = profile ? (await api.tenants.updateMine(withLogo)).data : (await api.tenants.createMine(withLogo as TenantInput)).data;
      if (newLogo) {
        // Saved only when the profile really points at the new logo
        const ok = saved.logoId === newLogo.id && !!saved.logo;
        logo.saved(ok);
        if (!ok) return;
      }
      toast.success(profile ? "Profil toko diperbarui" : "Profil toko dibuat");
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      toast.error("Gagal menyimpan profil", errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={local.form} onSubmit={submit} noValidate>
      {logo.dialog}
      <div className={local.left}>
        <label className="field">
          <span className="label">Nama Usaha/Toko (wajib diisi)</span>
          <Input placeholder="Masukan nama usaha/toko" value={name} onChange={(e) => setName(e.target.value)} maxLength={255} />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>
        <label className="field">
          <span className="label">Wilayah Usaha/Toko (wajib diisi)</span>
          <NativeSelect value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="" disabled>
              Pilih wilayah
            </option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
            <option value={OTHER}>Lainnya</option>
          </NativeSelect>
          {area === OTHER && (
            <Input placeholder="Nama wilayah" value={otherArea} onChange={(e) => setOtherArea(e.target.value)} />
          )}
          {errors.area && <span className="field-error">{errors.area}</span>}
        </label>
        <label className="field">
          <span className="label">Deskripsi Usaha/Toko (wajib diisi)</span>
          <Textarea
           
            placeholder="Ceritakan tentang usaha/toko anda (maks. 255 karakter)"
            value={description}
            maxLength={255}
            onChange={(e) => setDescription(e.target.value)}
          />
          {errors.description && <span className="field-error">{errors.description}</span>}
        </label>
        <label className="field">
          <span className="label">Alamat Usaha/Toko (wajib diisi)</span>
          <Input placeholder="Contoh: Jalur 6 Bawah, SP 2, Distrik Prafi, Kab. Manokwari" value={address} maxLength={255} onChange={(e) => setAddress(e.target.value)} />
          {errors.address && <span className="field-error">{errors.address}</span>}
        </label>
        <div className="field">
          <span className="label">Jam Operasional (wajib diisi)</span>
          <div className={local.hours}>
            <Input placeholder="Hari (mis. Senin - Jumat)" value={days} onChange={(e) => setDays(e.target.value)} aria-label="Hari operasional" />
            <Input type="time" value={open} onChange={(e) => setOpen(e.target.value)} aria-label="Jam buka" />
            <Input type="time" value={close} onChange={(e) => setClose(e.target.value)} aria-label="Jam tutup" />
          </div>
          {errors.operationalHours && <span className="field-error">{errors.operationalHours}</span>}
        </div>
      </div>

      <div className={local.right}>
        <ImagePicker
          title="UNGGAH FOTO ATAU LOGO"
          previewUrl={logo.previewUrl ?? (profile?.logo ? imageSrc(profile.logo) : null)}
          round
          error={errors.logoId}
          pending={!!logo.pending}
          onFile={(f) => void logo.pick(f, `Logo ${name.trim() || "toko"}`)}
        />
        <label className="field">
          <span className="label">Nomor WhatsApp (wajib diisi)</span>
          <Input inputMode="tel" placeholder="0812-8899-0067" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          {errors.whatsappLink && <span className="field-error">{errors.whatsappLink}</span>}
        </label>
        <label className="field">
          <span className="label">Tautan Google Maps (opsional)</span>
          <Input placeholder="https://maps.app.goo.gl/..." value={gmapsLink} onChange={(e) => setGmapsLink(e.target.value)} />
          {errors.gmapsLink && <span className="field-error">{errors.gmapsLink}</span>}
        </label>
        <label className="field">
          <span className="label">Tautan Instagram (opsional)</span>
          <Input placeholder="https://instagram.com/namatoko" value={instagramLink} onChange={(e) => setInstagramLink(e.target.value)} />
          {errors.instagramLink && <span className="field-error">{errors.instagramLink}</span>}
        </label>
        <label className="field">
          <span className="label">Tautan Google Bisnis (opsional)</span>
          <Input placeholder="https://g.page/namatoko" value={googleBusinessLink} onChange={(e) => setGoogleBusinessLink(e.target.value)} />
          {errors.googleBusinessLink && <span className="field-error">{errors.googleBusinessLink}</span>}
        </label>
        <label className="field">
          <span className="label">Tautan Toko Shopee (opsional)</span>
          <Input placeholder="https://shopee.co.id/namatoko" value={shopeeLink} onChange={(e) => setShopeeLink(e.target.value)} />
          {errors.shopeeLink && <span className="field-error">{errors.shopeeLink}</span>}
        </label>
        <label className="field">
          <span className="label">Tautan Facebook / Toko Online (wajib diisi)</span>
          <Input placeholder="https://facebook.com/..." value={fbLink} onChange={(e) => setFbLink(e.target.value)} />
          {errors.fbLink && <span className="field-error">{errors.fbLink}</span>}
        </label>
        <div className={styles.formActions}>
          {onCancel && (
            <Button type="button" variant="light" onClick={() => confirmLeave(onCancel, "Batalkan perubahan?")} disabled={busy}>
              Batal
            </Button>
          )}
          <Button type="submit" variant="navy" size="lg" disabled={busy}>
            {busy ? "MENYIMPAN..." : "SIMPAN PROFIL"}
          </Button>
        </div>
      </div>
    </form>
  );
}
