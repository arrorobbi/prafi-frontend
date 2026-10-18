"use client";

import { useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { RichText } from "../RichText";
import { ConfirmDialog } from "../Modal";
import { useToast } from "../Toast";
import { Loading } from "../ui";
import { ROLE_LABEL } from "./UserAccounts";
import styles from "./dashboard.module.css";
import local from "./SiteContentEditor.module.css";
import { Button } from "@/components/shadcn/button";
import { Textarea } from "@/components/shadcn/textarea";
import { Alert } from "@/components/shadcn/alert";

/**
 * "Konten Situs" (admin, disnakertrans): the footer's about text on every public page (GET/PATCH /api/site-content).
 * The public pages show the change right away.
 */
export function SiteContentEditor() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => api.siteContent.get(), []);
  const field = data?.data.footerAbout;
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [askReset, setAskReset] = useState(false);

  useEffect(() => {
    if (field) setText(field.value);
  }, [field]);

  if (loading && !data) return <Loading />;
  if (error || !field) return <Alert variant="destructive">{error ?? "Gagal memuat konten"}</Alert>;

  const changed = text.trim() !== field.value.trim();
  const tooLong = text.length > field.maxLength;

  const save = async (value: string) => {
    setBusy(true);
    try {
      await api.siteContent.update({ footerAbout: value });
      toast.success(value ? "Teks footer disimpan" : "Teks footer dikembalikan ke teks bawaan", "Halaman publik langsung menampilkan perubahan.");
      setAskReset(false);
      reload();
    } catch (err) {
      toast.error("Gagal menyimpan", errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.sectionTitle}>Teks Tentang Kami (Footer)</h2>
      <p className="muted">
        Tampil di bagian bawah setiap halaman publik, di samping logo Trans Niaga. Baris kosong memulai paragraf baru, dan teks di antara
        dua bintang seperti <code>**UMKM TRANS NIAGA**</code> ditampilkan tebal.
      </p>

      <label className="field mt">
        <span className="label">Isi teks</span>
        <Textarea
          className={local.textarea}
          value={text}
          rows={8}
          onChange={(e) => setText(e.target.value)}
          aria-invalid={tooLong || undefined}
        />
        <span className={`hint ${tooLong ? local.over : ""}`}>
          {text.length} / {field.maxLength} karakter
        </span>
      </label>

      <div className={local.previewLabel}>Pratinjau</div>
      <div className={local.preview}>
        <img src="/logo.png" alt="" width={56} height={56} />
        <RichText text={text.trim() || field.default} className={local.previewText} />
      </div>

      <p className={`muted ${local.meta}`}>
        {field.isDefault
          ? "Saat ini memakai teks bawaan."
          : `Terakhir diubah ${field.updatedAt ? `${formatDate(field.updatedAt)} ${formatTime(field.updatedAt)}` : ""}${
              field.updatedBy ? ` oleh ${field.updatedBy.name} (${ROLE_LABEL[field.updatedBy.role]})` : ""
            }.`}
      </p>

      <div className={styles.formActions}>
        {!field.isDefault && (
          <Button type="button" variant="light" disabled={busy} onClick={() => setAskReset(true)}>
            Kembalikan Teks Bawaan
          </Button>
        )}
        <Button type="button" variant="light" disabled={busy || !changed} onClick={() => setText(field.value)}>
          Batalkan Perubahan
        </Button>
        <Button type="button" disabled={busy || !changed || tooLong || !text.trim()} onClick={() => save(text)}>
          {busy ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>

      <ConfirmDialog
        open={askReset}
        title="Kembalikan Teks Bawaan"
        busy={busy}
        confirmLabel="Kembalikan"
        message="Teks footer akan diganti dengan teks bawaan Trans Niaga."
        onConfirm={() => save("")}
        onClose={() => setAskReset(false)}
      />
    </div>
  );
}
