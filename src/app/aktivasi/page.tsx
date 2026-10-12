"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import styles from "@/components/auth/auth.module.css";
import { Loading, PasswordInput } from "@/components/ui";
import { api, ApiError, errorMessage } from "@/lib/api";
import { Button, buttonVariants } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Alert } from "@/components/shadcn/alert";

/**
 * Opened from the email a new Disnakertrans account gets: <FRONTEND_URL>/aktivasi?userId=…&token=…
 * (this path is fixed by the backend). The person types the temporary password from that email and chooses their
 * own; only then the account can log in.
 */
function ActivationForm() {
  const router = useRouter();
  const params = useSearchParams();
  const userId = params.get("userId") ?? "";
  const token = params.get("token") ?? "";
  const [check, setCheck] = useState<{ email: string } | null>(null);
  const [linkError, setLinkError] = useState<{ message: string; done?: boolean } | null>(null);
  const [temporary, setTemporary] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !token) {
      setLinkError({ message: "Tautan aktivasi tidak lengkap. Salin seluruh tautan dari email." });
      return;
    }
    api.auth
      .checkActivation(userId, token)
      .then(({ data }) => setCheck(data))
      .catch((err) => setLinkError({ message: errorMessage(err), done: err instanceof ApiError && err.code === "EMAIL_ALREADY_VERIFIED" }));
  }, [userId, token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!temporary.trim()) return setError("Masukkan kata sandi sementara dari email");
    if (password.length < 8) return setError("Password baru minimal 8 karakter");
    if (password === temporary.trim()) return setError("Password baru harus berbeda dari kata sandi sementara");
    if (password !== confirm) return setError("Konfirmasi password tidak sama");
    setBusy(true);
    setError(null);
    try {
      await api.auth.activate(userId, token, temporary.trim(), password);
      router.replace("/login?aktif=1");
    } catch (err) {
      const left = err instanceof ApiError ? (err.details as { attemptsLeft?: number } | undefined)?.attemptsLeft : undefined;
      setError(
        err instanceof ApiError && err.fieldErrors.password
          ? err.fieldErrors.password
          : `${errorMessage(err)}${left ? ` (sisa ${left} percobaan)` : ""}`,
      );
      setBusy(false);
    }
  };

  /** A new email: new link and new temporary password (this page's link stops working) */
  const resend = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.auth.resendVerification(userId);
      setResent("Email aktivasi baru telah dikirim. Buka tautan pada email terbaru; tautan dan kata sandi sementara yang lama tidak berlaku lagi.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (resent) {
    return (
      <div className={`${styles.narrow} ${styles.center}`}>
        <Alert variant="success">{resent}</Alert>
      </div>
    );
  }
  if (linkError) {
    return (
      <div className={`${styles.narrow} ${styles.center}`}>
        <Alert variant={linkError.done ? "info" : "destructive"}>{linkError.done ? "Akun ini sudah aktif. Silakan masuk." : linkError.message}</Alert>
        {error && <Alert variant="destructive">{error}</Alert>}
        {linkError.done || !userId ? (
          <Link href="/login" className={buttonVariants({ variant: "orange" })}>
            Masuk
          </Link>
        ) : (
          <Button type="button" variant="orange" onClick={resend} disabled={busy}>
            {busy ? "Mengirim..." : "Kirim Email Aktivasi Baru"}
          </Button>
        )}
      </div>
    );
  }
  if (!check) return <Loading label="Memeriksa tautan..." />;

  return (
    <form className={`${styles.narrow} ${styles.col}`} onSubmit={submit}>
      <p>
        Aktifkan akun <strong>{check.email}</strong>: masukkan kata sandi sementara dari email, lalu buat password baru
        Anda sendiri.
      </p>
      <label className="field">
        <span className="label">Kata Sandi Sementara</span>
        <Input
          placeholder="Contoh: Mangga47"
          value={temporary}
          onChange={(e) => setTemporary(e.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
        />
      </label>
      <label className="field">
        <span className="label">Password Baru</span>
        <PasswordInput placeholder="Min. 8 karakter" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </label>
      <label className="field">
        <span className="label">Konfirmasi Password</span>
        <PasswordInput placeholder="Ulangi password baru" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
      </label>
      {error && <Alert variant="destructive">{error}</Alert>}
      <Button type="submit" variant="navy" size="lg" disabled={busy}>
        {busy ? "Menyimpan..." : "Aktifkan Akun"}
      </Button>
      <button type="button" className="hint" style={{ background: "none", border: 0, textDecoration: "underline", cursor: "pointer" }} onClick={resend} disabled={busy}>
        Tidak menemukan kata sandi sementara? Kirim email aktivasi baru
      </button>
    </form>
  );
}

export default function ActivationPage() {
  return (
    <AuthFrame title="AKTIVASI AKUN" backHref="/login">
      <Suspense fallback={<Loading />}>
        <ActivationForm />
      </Suspense>
    </AuthFrame>
  );
}
