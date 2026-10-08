"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import styles from "@/components/auth/auth.module.css";
import { api, errorMessage } from "@/lib/api";
import { buttonVariants, Button } from "@/components/shadcn/button";
import { Alert } from "@/components/shadcn/alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.auth.forgotPassword(email.trim());
      setSent(data.message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame title="LUPA PASSWORD" backHref="/login">
      <div className={styles.orangeCard}>
        <h2>ATUR ULANG PASSWORD</h2>
        {sent ? (
          <>
            <Alert variant="success" className={styles.cardAlert}>{sent}</Alert>
            <p className={styles.terms} style={{ maxWidth: 460, fontSize: "0.85rem" }}>
              Buka email Anda dan klik tautan atur ulang kata sandi. Tidak menerima email? Periksa folder spam atau coba lagi
              setelah 1 menit.
            </p>
            <Link href="/login" className={buttonVariants({ variant: "navy" })}>
              Kembali ke Login
            </Link>
          </>
        ) : (
          <form onSubmit={submit}>
            <p style={{ textAlign: "center" }}>Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat password baru.</p>
            <label className={styles.pillInput}>
              <span className="sr-only">Email</span>
              <input type="email" required placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            {error && <Alert variant="destructive" className={styles.cardAlert}>{error}</Alert>}
            <Button type="submit" variant="navy" size="lg" className={styles.loginBtn} disabled={busy}>
              {busy ? "Mengirim..." : "Kirim Tautan"}
            </Button>
          </form>
        )}
      </div>
    </AuthFrame>
  );
}
