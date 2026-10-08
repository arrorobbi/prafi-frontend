"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import styles from "@/components/auth/auth.module.css";
import { Loading, PasswordInput } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { Button, buttonVariants } from "@/components/shadcn/button";
import { Alert } from "@/components/shadcn/alert";

/**
 * Opened from the forgot-password email: <FRONTEND_URL>/reset-password?userId=…&token=…
 * (this path is fixed by the backend).
 */
function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const userId = params.get("userId") ?? "";
  const token = params.get("token") ?? "";
  const [check, setCheck] = useState<{ email: string } | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!userId || !token) {
      setLinkError("Tautan atur ulang kata sandi tidak lengkap. Salin seluruh tautan dari email.");
      return;
    }
    api.auth
      .checkResetLink(userId, token)
      .then(({ data }) => setCheck(data))
      .catch((err) => setLinkError(errorMessage(err)));
  }, [userId, token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("Password minimal 8 karakter");
    if (password !== confirm) return setError("Konfirmasi password tidak sama");
    setBusy(true);
    setError(null);
    try {
      await api.auth.resetPassword(userId, token, password);
      router.replace("/login?reset=1");
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  if (linkError) {
    return (
      <div className={`${styles.narrow} ${styles.center}`}>
        <Alert variant="destructive">{linkError}</Alert>
        <Link href="/lupa-password" className={buttonVariants({ variant: "orange" })}>
          Minta Tautan Baru
        </Link>
      </div>
    );
  }
  if (!check) return <Loading label="Memeriksa tautan..." />;

  return (
    <form className={`${styles.narrow} ${styles.col}`} onSubmit={submit}>
      <p>
        Buat password baru untuk akun <strong>{check.email}</strong>. Setelah diubah, semua sesi login lain akan
        berakhir.
      </p>
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
        {busy ? "Menyimpan..." : "Simpan Password Baru"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthFrame title="ATUR ULANG PASSWORD" backHref="/login">
      <Suspense fallback={<Loading />}>
        <ResetForm />
      </Suspense>
    </AuthFrame>
  );
}
