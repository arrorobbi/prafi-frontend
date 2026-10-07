"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import styles from "@/components/auth/auth.module.css";
import { api, errorMessage } from "@/lib/api";

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
            <div className={`alert alert-success ${styles.cardAlert}`}>{sent}</div>
            <p className={styles.terms} style={{ maxWidth: 460, fontSize: "0.85rem" }}>
              Buka email Anda dan klik tautan atur ulang kata sandi. Tidak menerima email? Periksa folder spam atau coba lagi
              setelah 1 menit.
            </p>
            <Link href="/login" className="btn btn-navy">
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
            {error && <div className={`alert alert-error ${styles.cardAlert}`}>{error}</div>}
            <button type="submit" className={`btn btn-navy btn-lg ${styles.loginBtn}`} disabled={busy}>
              {busy ? "Mengirim..." : "Kirim Tautan"}
            </button>
          </form>
        )}
      </div>
    </AuthFrame>
  );
}
