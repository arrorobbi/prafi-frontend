"use client";

import { useRef, useState } from "react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { getClientId } from "@/lib/clientId";
import { formatDate, formatRating } from "@/lib/format";
import type { RatingSummary, Review } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { Stars } from "../Stars";
import { useToast } from "../Toast";
import { Turnstile, TURNSTILE_SITE_KEY, type TurnstileHandle } from "./Turnstile";
import styles from "./ProductReviews.module.css";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { Alert } from "@/components/shadcn/alert";
import { Card, cardClassName } from "@/components/shadcn/card";
import { cn } from "@/lib/utils";

const PER_PAGE = 5;
const LABELS = ["", "Sangat buruk", "Buruk", "Cukup", "Baik", "Sangat baik"];

/**
 * Reviews of one approved product: anyone can read them and write one, no login (GET/POST /api/landing/products/:id/reviews).
 * Writing needs the "not a robot" check (Turnstile); the same browser on the same network can review a product once a day.
 */
export function ProductReviews({ productId, initial }: { productId: string; initial: RatingSummary }) {
  const toast = useToast();
  const [limit, setLimit] = useState(PER_PAGE);
  const [summary, setSummary] = useState<RatingSummary>(initial);
  const [name, setName] = useState("");
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [checkFailed, setCheckFailed] = useState(false);
  const turnstile = useRef<TurnstileHandle>(null);
  const needsCheck = !!TURNSTILE_SITE_KEY;

  const { data, loading, error, reload } = useAsync(async () => {
    const res = await api.landing.reviews(productId, { page: 1, limit });
    if (res.meta) setSummary({ ratingAverage: res.meta.ratingAverage, reviewCount: res.meta.reviewCount });
    return res;
  }, [productId, limit]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (!name.trim()) found.name = "Nama wajib diisi";
    if (!stars) found.stars = "Pilih jumlah bintang";
    if (!text.trim()) found.review = "Ulasan wajib diisi";
    if (needsCheck && !token) found.turnstile = "Tunggu verifikasi \"Saya bukan robot\" selesai";
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const { meta } = await api.landing.addReview(productId, {
        name: name.trim(),
        stars,
        review: text.trim(),
        clientId: getClientId(),
        ...(token ? { turnstileToken: token } : {}),
      });
      if (meta) setSummary(meta);
      setName("");
      setStars(0);
      setText("");
      toast.success("Terima kasih!", "Ulasan Anda telah ditambahkan.");
      reload();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      const already = err instanceof ApiError && err.code === "ALREADY_REVIEWED";
      toast.error(already ? "Anda sudah mengulas produk ini" : "Ulasan gagal dikirim", errorMessage(err));
    } finally {
      setBusy(false);
      // A Turnstile token works once: get a fresh one for the next try
      turnstile.current?.reset();
    }
  };

  const reviews: Review[] = data?.data ?? [];
  const total = data?.meta?.total ?? summary.reviewCount;
  const shown = hover || stars;

  return (
    <section className={styles.section} id="ulasan">
      <h2>ULASAN PEMBELI</h2>
      <div className={styles.layout}>
        <Card className={styles.summary}>
          {summary.reviewCount && summary.ratingAverage != null ? (
            <>
              <strong className={styles.big}>{formatRating(summary.ratingAverage)}</strong>
              <Stars value={summary.ratingAverage} size="lg" />
              <span className="muted">dari {summary.reviewCount} ulasan</span>
            </>
          ) : (
            <span className="muted">Belum ada ulasan. Jadilah yang pertama!</span>
          )}
        </Card>

        <form className={cn(cardClassName, styles.form)} onSubmit={submit} noValidate>
          <h3>Tulis Ulasan</h3>
          <div className="field">
            <span className="label">Penilaian</span>
            <div className={styles.picker} onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Jumlah bintang">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={stars === i}
                  aria-label={`${i} bintang`}
                  className={i <= shown ? styles.on : ""}
                  onMouseEnter={() => setHover(i)}
                  onClick={() => setStars(i)}
                >
                  ★
                </button>
              ))}
              <span className={styles.pickerLabel}>{LABELS[shown]}</span>
            </div>
            {errors.stars && <span className="field-error">{errors.stars}</span>}
          </div>
          <label className="field">
            <span className="label">Nama</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Nama Anda" />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>
          <label className="field">
            <span className="label">Ulasan</span>
            <Textarea
             
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              placeholder="Bagaimana pengalaman Anda dengan produk ini?"
            />
            {errors.review && <span className="field-error">{errors.review}</span>}
          </label>
          {needsCheck && (
            <div className="field">
              <Turnstile ref={turnstile} onToken={(t) => { setToken(t); if (t) setCheckFailed(false); }} onError={() => setCheckFailed(true)} />
              {checkFailed && (
                <span className="field-error">
                  Verifikasi &quot;Saya bukan robot&quot; gagal dimuat. Periksa koneksi Anda lalu muat ulang halaman.
                </span>
              )}
              {errors.turnstile && !checkFailed && <span className="field-error">{errors.turnstile}</span>}
            </div>
          )}
          <Button type="submit" variant="orange" disabled={busy || (needsCheck && !token)}>
            {busy ? "Mengirim..." : needsCheck && !token ? "Menunggu verifikasi..." : "Kirim Ulasan"}
          </Button>
          <p className="hint">Satu ulasan per produk per hari dari perangkat dan jaringan yang sama.</p>
        </form>
      </div>

      <div className={styles.list}>
        {loading && !data ? (
          <p className="muted">Memuat ulasan...</p>
        ) : error ? (
          <Alert variant="destructive">{error}</Alert>
        ) : (
          reviews.map((r) => (
            <article key={r.id} className={cn(cardClassName, styles.item)}>
              <div className={styles.itemHead}>
                <strong>{r.name}</strong>
                <Stars value={r.stars} size="sm" />
                <span className="muted">{formatDate(r.createdAt)}</span>
              </div>
              <p>{r.review}</p>
            </article>
          ))
        )}
        {reviews.length < total && (
          <Button type="button" variant="light" onClick={() => setLimit((l) => l + PER_PAGE)} disabled={loading}>
            {loading ? "Memuat..." : "Lihat ulasan lainnya"}
          </Button>
        )}
      </div>
    </section>
  );
}
