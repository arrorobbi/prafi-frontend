"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import styles from "@/components/auth/auth.module.css";
import { IconEye, IconEyeOff } from "@/components/Icons";
import { Loading } from "@/components/ui";
import { api, ApiError, errorMessage } from "@/lib/api";
import { roleHome, SESSION_MESSAGE_KEY, useAuth } from "@/lib/auth";
import { Button } from "@/components/shadcn/button";
import { Alert } from "@/components/shadcn/alert";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { status, user, login } = useAuth();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendUserId, setResendUserId] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  /**
   * Enter logs in (also explicit, so it works the same with every browser and password manager).
   * In the email field it first moves on to the password when that is still empty.
   */
  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (busy) return;
    if (e.currentTarget.type === "email" && !password) passwordRef.current?.focus();
    else e.currentTarget.form?.requestSubmit();
  };

  // Message left by an ended session (expired token, logout, password reset)
  useEffect(() => {
    try {
      const msg = sessionStorage.getItem(SESSION_MESSAGE_KEY);
      if (msg) {
        setNotice(msg);
        sessionStorage.removeItem(SESSION_MESSAGE_KEY);
      }
    } catch {
      // ignore
    }
    if (params.get("verified")) setNotice("Email berhasil diverifikasi, silakan login.");
    if (params.get("reset")) setNotice("Kata sandi berhasil diubah, silakan login dengan kata sandi baru.");
  }, [params]);

  // Already logged in: go to the dashboard
  useEffect(() => {
    if (status === "authenticated" && user && !busy) router.replace(params.get("next") || roleHome(user.role));
  }, [status, user, busy, router, params]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    setResendUserId(null);
    try {
      const u = await login(email, password);
      const next = params.get("next");
      router.replace(next && next.startsWith("/") ? next : roleHome(u.role));
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") {
        const d = err.details as { userId?: string; method?: "otp" | "link" } | undefined;
        if (d?.userId && d.method === "otp") {
          router.push(`/verifikasi?userId=${d.userId}&email=${encodeURIComponent(email.trim())}`);
          return;
        }
        if (d?.userId) setResendUserId(d.userId);
        setError("Email belum diaktifkan. Buka tautan aktivasi yang dikirim ke email Anda.");
        return;
      }
      if (err instanceof ApiError && err.code === "USER_NOT_ACTIVATED") {
        setError("Akun Anda belum diaktifkan. Akun admin diaktifkan oleh Disnakertrans; akun penjual oleh administrator.");
        return;
      }
      setError(errorMessage(err));
    }
  };

  return (
    <div className={styles.orangeCard}>
      <h2>MASUK AKUN</h2>
      {notice && <Alert variant="info" className={styles.cardAlert}>{notice}</Alert>}
      {error && (
        <Alert variant="destructive" className={styles.cardAlert}>
          <div>
            {error}
            {resendUserId && (
              <Button
                type="button"
                variant="navy" size="sm"
                style={{ marginTop: 8 }}
                onClick={() =>
                  api.auth
                    .resendVerification(resendUserId)
                    .then(({ data }) => setNotice(data.message))
                    .catch((e) => setError(errorMessage(e)))
                }
              >
                Kirim ulang tautan aktivasi
              </Button>
            )}
          </div>
        </Alert>
      )}
      <form onSubmit={submit}>
        <label className={styles.pillInput}>
          <span className="sr-only">Email</span>
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onEnter}
            enterKeyHint="next"
          />
        </label>
        <label className={`${styles.pillInput} ${styles.pwInput}`}>
          <span className="sr-only">Password</span>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            autoComplete="current-password"
            required
            ref={passwordRef}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onEnter}
            enterKeyHint="go"
          />
          <button
            type="button"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            onClick={() => setShowPassword((s) => !s)}
            className={styles.eye}
          >
            {showPassword ? <IconEyeOff width={20} height={20} /> : <IconEye width={20} height={20} />}
          </button>
          <Link href="/lupa-password" className={styles.inline}>
            Lupa Password
          </Link>
        </label>
        <Button type="submit" variant="navy" size="lg" className={styles.loginBtn} disabled={busy}>
          {busy ? "Memproses..." : "Login"}
        </Button>
      </form>
      <div className={styles.divider}>ATAU</div>
      <p className={styles.signup}>
        Baru di Trans Niaga? <Link href="/register">DAFTAR</Link>
      </p>
      <p className={styles.terms}>
        Dengan login, kamu menyetujui <Link href="/panduan#ketentuan">Syarat, Ketentuan dan Kebijakan dari Trans Niaga</Link> &amp;{" "}
        <Link href="/panduan#privasi">Kebijakan Privasi</Link> Trans Niaga
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    // The back arrow always leads to Beranda (e.g. after a logout, "back" would return to the dashboard)
    <AuthFrame title="LOGIN/SIGN UP" backHref="/" backAlways>
      <Suspense fallback={<Loading />}>
        <LoginForm />
      </Suspense>
    </AuthFrame>
  );
}
