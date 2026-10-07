"use client";

import { useState } from "react";
import { normalizePhone } from "@/components/auth/RegisterWizard";
import styles from "@/components/dashboard/dashboard.module.css";
import { UserAccounts } from "@/components/dashboard/UserAccounts";
import { IconPlus } from "@/components/Icons";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { PageHeader, PasswordInput } from "@/components/ui";
import { api, ApiError, errorMessage } from "@/lib/api";
import { formatDate, formatTime, splitName } from "@/lib/format";
import type { Verification } from "@/lib/types";

const EMPTY = { fullName: "", phone: "", email: "", password: "", confirm: "" };

/** Disnakertrans accounts: only the superadmin creates them (POST /api/auth/register/disnakertrans). */
export default function DisnakertransAccountsPage() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ email: string; verification?: Verification } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const close = () => {
    setOpen(false);
    setForm(EMPTY);
    setErrors({});
    setCreated(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (form.fullName.trim().length < 3) found.fullName = "Nama lengkap wajib diisi";
    if (normalizePhone(form.phone).length < 11) found.phone = "Nomor telepon tidak valid";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) found.email = "Email tidak valid";
    if (form.password.length < 8) found.password = "Password minimal 8 karakter";
    if (form.confirm !== form.password) found.confirm = "Konfirmasi password tidak sama";
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const { data, meta } = await api.auth.registerDisnakertrans({
        ...splitName(form.fullName),
        phoneNumber: normalizePhone(form.phone),
        email: form.email.trim(),
        password: form.password,
      });
      setCreated({ email: data.email, verification: meta?.verification });
      setReloadKey((k) => k + 1);
      toast.success("Akun Disnakertrans dibuat");
    } catch (err) {
      if (err instanceof ApiError) {
        const f = err.fieldErrors;
        setErrors({ email: f.email, phone: f.phoneNumber, password: f.password, fullName: f.firstName || f.lastName });
      }
      toast.error("Gagal membuat akun", errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="AKUN DISNAKERTRANS" />
      <div className={styles.toolbar}>
        <p className="muted" style={{ flex: "1 1 320px" }}>
          Disnakertrans memeriksa dan mengaktifkan akun admin. Akun yang dibuat di sini langsung aktif, tetapi pemiliknya
          harus membuka tautan aktivasi di email (berlaku 24 jam) sebelum bisa login.
        </p>
        <button type="button" className="btn btn-navy" onClick={() => setOpen(true)}>
          <IconPlus /> TAMBAH AKUN
        </button>
      </div>

      <UserAccounts role="disnakertrans" canResend noun="akun disnakertrans" reloadKey={reloadKey} />

      <Modal open={open} title="Tambah Akun Disnakertrans" onClose={close} wide>
        {created ? (
          <div className="stack">
            <div className="alert alert-success">
              Akun <strong>{created.email}</strong> berhasil dibuat.
            </div>
            {created.verification && (
              <p>
                {created.verification.emailSent
                  ? `Tautan aktivasi telah dikirim ke ${created.verification.sentTo}`
                  : "Email aktivasi belum terkirim (server email belum diatur)"}
                , berlaku sampai {formatDate(created.verification.expiresAt)} {formatTime(created.verification.expiresAt)}.
              </p>
            )}
            {created.verification?.devLink && (
              <p className="hint">
                Mode pengembangan — tautan aktivasi:{" "}
                <a href={created.verification.devLink} target="_blank" rel="noreferrer">
                  {created.verification.devLink}
                </a>
              </p>
            )}
            <p>Berikan password akun secara langsung kepada pemiliknya. Password tidak dikirim lewat email.</p>
            <div className={styles.formActions}>
              <button type="button" className="btn btn-light" onClick={() => setCreated(null)}>
                Tambah Lagi
              </button>
              <button type="button" className="btn btn-navy" onClick={close}>
                Selesai
              </button>
            </div>
          </div>
        ) : (
          <form className={styles.formGrid} onSubmit={submit} noValidate>
            <label className="field">
              <span className="label">Nama Lengkap</span>
              <input className="input" value={form.fullName} onChange={set("fullName")} placeholder="Masukan nama lengkap" />
              {errors.fullName && <span className="field-error">{errors.fullName}</span>}
            </label>
            <label className="field">
              <span className="label">Nomor Telepon</span>
              <input className="input" inputMode="tel" value={form.phone} onChange={set("phone")} placeholder="0812-xxxx-xxxx" />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </label>
            <label className={`field ${styles.full}`}>
              <span className="label">Email</span>
              <input className="input" type="email" value={form.email} onChange={set("email")} placeholder="Email aktif petugas" />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </label>
            <label className="field">
              <span className="label">Password</span>
              <PasswordInput value={form.password} onChange={set("password")} placeholder="Min. 8 karakter" autoComplete="new-password" />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </label>
            <label className="field">
              <span className="label">Konfirmasi Password</span>
              <PasswordInput value={form.confirm} onChange={set("confirm")} placeholder="Ulangi password" autoComplete="new-password" />
              {errors.confirm && <span className="field-error">{errors.confirm}</span>}
            </label>
            <div className={`${styles.formActions} ${styles.full}`}>
              <button type="button" className="btn btn-light" onClick={close} disabled={busy}>
                Batal
              </button>
              <button type="submit" className="btn btn-navy" disabled={busy}>
                {busy ? "Menyimpan..." : "Buat Akun"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
