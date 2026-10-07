"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { OtpForm } from "@/components/auth/OtpForm";
import styles from "@/components/auth/auth.module.css";
import { Loading } from "@/components/ui";

/** Email verification for an account that tried to log in before verifying (403 EMAIL_NOT_VERIFIED). */
function Verify() {
  const params = useSearchParams();
  const router = useRouter();
  const userId = params.get("userId");
  const email = params.get("email") ?? undefined;

  if (!userId) {
    return (
      <div className={`${styles.narrow} ${styles.center}`}>
        <p>Tautan verifikasi tidak lengkap.</p>
        <Link href="/login" className="btn btn-orange">
          Kembali ke Login
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.narrow}>
      <OtpForm
        userId={userId}
        email={email}
        onVerified={() => router.replace(`/login?verified=1${email ? `&email=${encodeURIComponent(email)}` : ""}`)}
      />
    </div>
  );
}

export default function VerifyPage() {
  return (
    <AuthFrame title="VERIFIKASI EMAIL" backHref="/login">
      <Suspense fallback={<Loading />}>
        <Verify />
      </Suspense>
    </AuthFrame>
  );
}
