"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { User } from "@/lib/types";
import styles from "./auth.module.css";

const LENGTH = 6;
const RESEND_SECONDS = 60;

/** 6-digit email OTP (admin and tenant accounts), with "send a new code" after 60 seconds. */
export function OtpForm({
  userId,
  email,
  devCode,
  onVerified,
}: {
  userId: string;
  email?: string;
  devCode?: string;
  onVerified: (user: User) => void | Promise<void>;
}) {
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [hint, setHint] = useState(devCode);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => refs.current[0]?.focus(), []);

  const setFrom = (start: number, value: string) => {
    const chars = value.replace(/\D/g, "").slice(0, LENGTH - start).split("");
    if (!chars.length) return;
    setDigits((d) => {
      const next = [...d];
      chars.forEach((c, i) => (next[start + i] = c));
      return next;
    });
    refs.current[Math.min(start + chars.length, LENGTH - 1)]?.focus();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length !== LENGTH) {
      setError("Masukkan 6 digit kode OTP dari email Anda");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.auth.verifyOtp(userId, otp);
      await onVerified(data.user);
    } catch (err) {
      if (err instanceof ApiError && err.code === "OTP_INVALID") {
        const left = (err.details as { attemptsLeft?: number } | undefined)?.attemptsLeft;
        setError(left !== undefined ? `${err.message}. Sisa percobaan: ${left}` : err.message);
      } else {
        setError(errorMessage(err));
      }
      setDigits(Array(LENGTH).fill(""));
      refs.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    setInfo(null);
    try {
      const { data, meta } = await api.auth.resendVerification(userId);
      setInfo(data.message);
      setHint(meta?.verification?.devCode);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      if (err instanceof ApiError && err.code === "TOO_MANY_REQUESTS") {
        setCooldown((err.details as { retryAfterSeconds?: number })?.retryAfterSeconds ?? RESEND_SECONDS);
      }
      setError(errorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} className={styles.center}>
      <p>
        Kami telah mengirim kode 6 digit ke <strong>{email || "email Anda"}</strong>. Kode berlaku 15 menit.
      </p>
      <div className={styles.otp}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${i + 1}`}
            maxLength={LENGTH}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) {
                setDigits((cur) => cur.map((c, j) => (j === i ? "" : c)));
                return;
              }
              setFrom(i, v.length > 1 ? v : v.slice(-1));
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
            }}
            onPaste={(e) => {
              e.preventDefault();
              setFrom(0, e.clipboardData.getData("text"));
            }}
          />
        ))}
      </div>
      {hint && <p className="hint">Mode pengembangan: kode OTP = {hint}</p>}
      {error && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-success">{info}</div>}
      <button type="submit" className="btn btn-navy btn-lg" disabled={busy}>
        {busy ? "Memverifikasi..." : "VERIFIKASI"}
      </button>
      <button type="button" className="btn btn-light btn-sm" onClick={resend} disabled={cooldown > 0}>
        {cooldown > 0 ? `Kirim ulang kode (${cooldown} dtk)` : "Kirim ulang kode"}
      </button>
    </form>
  );
}
