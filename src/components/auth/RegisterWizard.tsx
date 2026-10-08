"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { roleHome, useAuth } from "@/lib/auth";
import { splitName } from "@/lib/format";
import { IconWarning } from "../Icons";
import { PasswordInput } from "../ui";
import { AuthFrame, HelpBox } from "./AuthFrame";
import { OtpForm } from "./OtpForm";
import styles from "./auth.module.css";
import { Button, buttonVariants } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Alert } from "@/components/shadcn/alert";

type Kind = "tenant" | "admin";

interface FormState {
  fullName: string;
  phone: string;
  email: string;
  tenantName: string;
  password: string;
  confirm: string;
}

const EMPTY: FormState = { fullName: "", phone: "", email: "", tenantName: "", password: "", confirm: "" };

/** "0812-8899-0067" / "62812..." / "812..." → "+62812889900067" */
export function normalizePhone(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("62")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits ? `+62${digits}` : "";
}

function validate(f: FormState, kind: Kind) {
  const e: Partial<Record<keyof FormState, string>> = {};
  if (f.fullName.trim().length < 3) e.fullName = "Nama lengkap wajib diisi";
  const phoneDigits = normalizePhone(f.phone).length - 3;
  if (phoneDigits < 8 || phoneDigits > 13) e.phone = "Nomor telepon tidak valid";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "Masukkan email yang aktif";
  if (kind === "tenant" && !f.tenantName.trim()) e.tenantName = "Nama usaha/toko wajib diisi";
  if (f.password.length < 8) e.password = "Password minimal 8 karakter";
  if (f.confirm !== f.password) e.confirm = "Konfirmasi password tidak sama";
  return e;
}

const STEPS = ["TAHAP 1: INFORMASI AKUN", "TAHAP 2: REVIEW DATA", "TAHAP 3: VERIFIKASI EMAIL", "TAHAP 4: SELESAI"];

/**
 * Self sign-up (POST /api/auth/register/tenant or /admin), then the email OTP.
 * Tenants are logged in right after verifying; admins wait for a disnakertrans to activate them.
 */
export function RegisterWizard({ kind }: { kind: Kind }) {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [loggedIn, setLoggedIn] = useState(false);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const toReview = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(form, kind);
    setErrors(found);
    if (Object.keys(found).length === 0) setStep(1);
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const input = {
        ...splitName(form.fullName),
        phoneNumber: normalizePhone(form.phone),
        email: form.email.trim(),
        password: form.password,
        ...(kind === "tenant" ? { tenantName: form.tenantName.trim() } : {}),
      };
      const { data, meta } = kind === "tenant" ? await api.auth.registerTenant(input) : await api.auth.registerAdmin(input);
      setUserId(data.id);
      setDevCode(meta?.verification?.devCode);
      setStep(2);
    } catch (err) {
      if (err instanceof ApiError) {
        const fields = err.fieldErrors;
        const mapped: Record<string, string> = {};
        if (fields.email) mapped.email = fields.email;
        if (fields.phoneNumber) mapped.phone = fields.phoneNumber;
        if (fields.tenantName) mapped.tenantName = fields.tenantName;
        if (fields.password) mapped.password = fields.password;
        if (fields.firstName || fields.lastName) mapped.fullName = fields.firstName || fields.lastName;
        if (Object.keys(mapped).length) {
          setErrors(mapped);
          setStep(0);
        }
      }
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onVerified = async () => {
    if (kind === "tenant") {
      try {
        await login(form.email, form.password);
        setLoggedIn(true);
      } catch {
        setLoggedIn(false);
      }
    }
    setForm((f) => ({ ...f, password: "", confirm: "" }));
    setStep(3);
  };

  const title = kind === "tenant" ? "PENDAFTARAN AKUN" : "PENDAFTARAN ADMIN";

  return (
    <AuthFrame title={title} step={STEPS[step]} backHref="/login">
      {step === 0 && (
        <form className={styles.whiteCard} onSubmit={toReview} noValidate>
          <div className={styles.col}>
            <label className="field">
              <span className="label">Nama Lengkap</span>
              <Input placeholder="Masukan nama lengkap" value={form.fullName} onChange={set("fullName")} autoComplete="name" />
              {errors.fullName && <span className="field-error">{errors.fullName}</span>}
            </label>
            <label className="field">
              <span className="label">Nomor Telfon/Whatsapp</span>
              <div className={styles.phone}>
                <span>+62</span>
                <Input placeholder="812-8899-0067" inputMode="tel" value={form.phone} onChange={set("phone")} autoComplete="tel-national" />
              </div>
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </label>
            <label className="field">
              <span className="label">Email</span>
              <Input type="email" placeholder="Masukan email aktif" value={form.email} onChange={set("email")} autoComplete="email" />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </label>
            <div className={styles.row2}>
              <label className="field">
                <span className="label">Password</span>
                <PasswordInput placeholder="Min. 8 karakter" value={form.password} onChange={set("password")} autoComplete="new-password" />
                {errors.password && <span className="field-error">{errors.password}</span>}
              </label>
              <label className="field">
                <span className="label">Konfirmasi Password</span>
                <PasswordInput placeholder="Min. 8 karakter" value={form.confirm} onChange={set("confirm")} autoComplete="new-password" />
                {errors.confirm && <span className="field-error">{errors.confirm}</span>}
              </label>
            </div>
          </div>
          <div className={styles.side}>
            {kind === "tenant" ? (
              <label className="field">
                <span className="label">Nama Usaha/Toko</span>
                <Input placeholder="Masukan nama usaha/toko" value={form.tenantName} onChange={set("tenantName")} />
                {errors.tenantName && <span className="field-error">{errors.tenantName}</span>}
                <span className="hint">Profil toko lengkap (logo, alamat, kategori) diisi setelah akun terverifikasi.</span>
              </label>
            ) : (
              <Alert variant="info">
                Akun admin perlu diaktifkan oleh Disnakertrans setelah email diverifikasi. Anda akan bisa login setelah
                akun diaktifkan.
              </Alert>
            )}
            {error && <Alert variant="destructive">{error}</Alert>}
            <HelpBox />
            <p className="hint">
              {kind === "tenant" ? (
                <>Petugas admin? <Link href="/register/admin">Daftar sebagai admin</Link></>
              ) : (
                <>Pelaku UMKM? <Link href="/register">Daftar sebagai penjual</Link></>
              )}
              {" · "}Sudah punya akun? <Link href="/login">Login</Link>
            </p>
            <div className={styles.actionsRight}>
              <Button type="submit" variant="orange">
                SELANJUTNYA
              </Button>
            </div>
          </div>
        </form>
      )}

      {step === 1 && (
        <div className={styles.whiteCard}>
          <div className={styles.col}>
            <div>
              <strong>REVIEW DATA PENDAFTARAN</strong>
              <p className="muted">Periksa kembali semua data sebelum dikirim</p>
            </div>
            <span className="label">Informasi Akun</span>
            <dl className={styles.reviewList}>
              <div>
                <dt>Nama</dt>
                <dd>{form.fullName}</dd>
              </div>
              <div>
                <dt>Telepon/WA</dt>
                <dd>{normalizePhone(form.phone)}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{form.email}</dd>
              </div>
            </dl>
            {kind === "tenant" && (
              <>
                <span className="label">Profil Usaha/Toko</span>
                <div className={styles.reviewRow}>
                  <span>Nama Toko: {form.tenantName}</span>
                </div>
              </>
            )}
            <Button type="button" variant="light" className={styles.editBtn} onClick={() => setStep(0)}>
              EDIT DATA
            </Button>
            <Alert variant="warning">
              <IconWarning />
              <span>
                Pastikan semua data telah benar dan sesuai. Kode verifikasi akan dikirim ke email Anda
                {kind === "tenant" ? ", dan produk yang Anda ajukan akan diverifikasi oleh tim administrator." : "."}
              </span>
            </Alert>
          </div>
          <div className={styles.side}>
            <HelpBox />
            {error && <Alert variant="destructive">{error}</Alert>}
            <div className={styles.actionsRight}>
              <Button type="button" variant="navy" onClick={submit} disabled={busy}>
                {busy ? "MENGIRIM..." : "KIRIM PENDAFTARAN"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && userId && (
        <div className={styles.narrow}>
          <OtpForm userId={userId} email={form.email} devCode={devCode} onVerified={onVerified} />
        </div>
      )}

      {step === 3 && (
        <div className={styles.thanks}>
          <h2>TERIMA KASIH!</h2>
          <h3>{kind === "tenant" ? "TELAH MENDAFTAR SEBAGAI PENJUAL DI UMKM TRANS NIAGA" : "TELAH MENDAFTAR SEBAGAI ADMIN TRANS NIAGA"}</h3>
          <p>{kind === "tenant" ? "Data pendaftaran anda telah diterima!" : "Akun menunggu aktivasi Disnakertrans"}</p>
          <div className={styles.buttons}>
            {kind === "tenant" && loggedIn ? (
              <>
                <Button type="button" variant="orange" size="lg" onClick={() => router.push("/tenant/profil")}>
                  LENGKAPI PROFIL TOKO
                </Button>
                <Button type="button" variant="navy" size="lg" onClick={() => router.push(roleHome("tenant"))}>
                  KE DASHBOARD
                </Button>
              </>
            ) : (
              <Link href={`/login?verified=1&email=${encodeURIComponent(form.email)}`} className={buttonVariants({ variant: "orange", size: "lg" })}>
                KE HALAMAN LOGIN
              </Link>
            )}
          </div>
        </div>
      )}
    </AuthFrame>
  );
}
