"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import styles from "@/components/auth/auth.module.css";
import { Loading } from "@/components/ui";
import { api, ApiError, errorMessage } from "@/lib/api";
import { Button, buttonVariants } from "@/components/shadcn/button";
import { Alert } from "@/components/shadcn/alert";

type Result = { kind: "done"; email: string } | { kind: "already" } | { kind: "error"; message: string };

/**
 * Opened from the email a seller gets after an admin changed their email: <FRONTEND_URL>/konfirmasi-email?userId=…&token=…
 * (this path is fixed by the backend). Opening it confirms the new address; then the seller logs in with it.
 */
function ConfirmEmail() {
  const params = useSearchParams();
  const userId = params.get("userId") ?? "";
  const token = params.get("token") ?? "";
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState<string | null>(null);
  // The link works once: don't send it twice (React runs effects twice in development)
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    if (!userId || !token) {
      setResult({ kind: "error", message: "Tautan konfirmasi tidak lengkap. Salin seluruh tautan dari email." });
      return;
    }
    api.auth
      .confirmEmail(userId, token)
      .then(({ data }) => setResult({ kind: "done", email: data.email }))
      .catch((err) =>
        setResult(err instanceof ApiError && err.code === "EMAIL_ALREADY_VERIFIED" ? { kind: "already" } : { kind: "error", message: errorMessage(err) }),
      );
  }, [userId, token]);

  const resend = async () => {
    setBusy(true);
    try {
      const { data } = await api.auth.resendVerification(userId);
      setResent(`${data.message}. Buka tautan pada email terbaru; tautan yang lama tidak berlaku lagi.`);
    } catch (err) {
      setResult({ kind: "error", message: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  if (!result) return <Loading label="Mengonfirmasi email..." />;
  return (
    <div className={`${styles.narrow} ${styles.center}`}>
      {resent ? (
        <Alert variant="success">{resent}</Alert>
      ) : result.kind === "done" ? (
        <Alert variant="success">
          <div>
            Email <strong className="break-all">{result.email}</strong> berhasil dikonfirmasi. Silakan masuk dengan email baru dan password Anda.
          </div>
        </Alert>
      ) : result.kind === "already" ? (
        <Alert variant="info">Email ini sudah dikonfirmasi. Silakan masuk.</Alert>
      ) : (
        <Alert variant="destructive">{result.message}</Alert>
      )}
      {result.kind === "error" && userId && !resent ? (
        <Button type="button" variant="orange" onClick={resend} disabled={busy}>
          {busy ? "Mengirim..." : "Kirim Tautan Konfirmasi Baru"}
        </Button>
      ) : (
        <Link href={result.kind === "done" ? "/login?dikonfirmasi=1" : "/login"} className={buttonVariants({ variant: "orange" })}>
          Masuk
        </Link>
      )}
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <AuthFrame title="KONFIRMASI EMAIL" backHref="/login">
      <Suspense fallback={<Loading />}>
        <ConfirmEmail />
      </Suspense>
    </AuthFrame>
  );
}
