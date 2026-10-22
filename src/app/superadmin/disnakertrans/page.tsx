"use client";

import { useState } from "react";
import { normalizePhone } from "@/components/auth/RegisterWizard";
import styles from "@/components/dashboard/dashboard.module.css";
import { UserAccounts } from "@/components/dashboard/UserAccounts";
import { IconPlus } from "@/components/Icons";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { PageHeader } from "@/components/ui";
import { api, ApiError, errorMessage } from "@/lib/api";
import { formatDate, formatTime, splitName } from "@/lib/format";
import type { Verification } from "@/lib/types";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Alert } from "@/components/shadcn/alert";

const EMPTY = { fullName: "", phone: "", email: "" };

/**
 * Disnakertrans accounts: only the superadmin creates them (POST /api/auth/register/disnakertrans). No password is
 * typed here: the backend emails a temporary one, which the owner replaces when activating the account. The superadmin
 * can also deactivate an account (the officer is logged out and emailed) and activate it again.
 */
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
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const { data, meta } = await api.auth.registerDisnakertrans({
        ...splitName(form.fullName),
        phoneNumber: normalizePhone(form.phone),
        email: form.email.trim(),
      });
      setCreated({ email: data.email, verification: meta?.verification });
      setReloadKey((k) => k + 1);
      toast.success("Akun Disnakertrans dibuat");
    } catch (err) {
      if (err instanceof ApiError) {
        const f = err.fieldErrors;
        setErrors({ email: f.email, phone: f.phoneNumber, fullName: f.firstName || f.lastName });
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
          Disnakertrans memeriksa dan mengaktifkan akun admin. Pemilik akun menerima email berisi kata sandi sementara
          dan tautan aktivasi (berlaku 24 jam): ia harus mengganti kata sandi sementara itu sebelum bisa login.
        </p>
        <Button type="button" variant="navy" onClick={() => setOpen(true)}>
          <IconPlus /> TAMBAH AKUN
        </Button>
      </div>

      <UserAccounts role="disnakertrans" approvable canResend noun="akun disnakertrans" reloadKey={reloadKey} />

      <Modal open={open} title="Tambah Akun Disnakertrans" onClose={close} wide>
        {created ? (
          <div className="stack">
            <Alert variant="success">
              Akun <strong>{created.email}</strong> berhasil dibuat.
            </Alert>
            {created.verification && (
              <p>
                {created.verification.emailSent
                  ? `Email berisi kata sandi sementara dan tautan aktivasi telah dikirim ke ${created.verification.sentTo}`
                  : "Email aktivasi belum terkirim (server email belum diatur atau gagal mengirim)"}
                , berlaku sampai {formatDate(created.verification.expiresAt)} {formatTime(created.verification.expiresAt)}.
              </p>
            )}
            {created.verification?.devLink && (
              <p className="hint">
                Mode pengembangan — kata sandi sementara: <strong>{created.verification.devTemporaryPassword}</strong>, tautan aktivasi:{" "}
                <a href={created.verification.devLink} target="_blank" rel="noreferrer">
                  {created.verification.devLink}
                </a>
              </p>
            )}
            <p>
              Anda tidak perlu memberikan password: pemilik akun membuat password sendiri saat aktivasi. Minta ia memeriksa
              folder Spam bila email tidak terlihat di kotak masuk; jika memang tidak sampai, gunakan tombol <strong>Kirim Ulang Verifikasi</strong> pada daftar akun.
            </p>
            <div className={styles.formActions}>
              <Button type="button" variant="light" onClick={() => setCreated(null)}>
                Tambah Lagi
              </Button>
              <Button type="button" variant="navy" onClick={close}>
                Selesai
              </Button>
            </div>
          </div>
        ) : (
          <form className={styles.formGrid} onSubmit={submit} noValidate>
            <label className="field">
              <span className="label">Nama Lengkap</span>
              <Input value={form.fullName} onChange={set("fullName")} placeholder="Masukan nama lengkap" />
              {errors.fullName && <span className="field-error">{errors.fullName}</span>}
            </label>
            <label className="field">
              <span className="label">Nomor Telepon</span>
              <Input inputMode="tel" value={form.phone} onChange={set("phone")} placeholder="0812-xxxx-xxxx" />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </label>
            <label className={`field ${styles.full}`}>
              <span className="label">Email</span>
              <Input type="email" value={form.email} onChange={set("email")} placeholder="Email aktif petugas" />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </label>
            <p className={`hint ${styles.full}`}>
              Password tidak perlu diisi: kata sandi sementara dibuat otomatis dan dikirim ke email di atas bersama tautan
              aktivasi.
            </p>
            <div className={`${styles.formActions} ${styles.full}`}>
              <Button type="button" variant="light" onClick={close} disabled={busy}>
                Batal
              </Button>
              <Button type="submit" variant="navy" disabled={busy}>
                {busy ? "Menyimpan..." : "Buat Akun"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
