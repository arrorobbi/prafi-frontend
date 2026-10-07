"use client";

import { useState } from "react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { formatDate, formatRating } from "@/lib/format";
import type { RatingSummary, Review } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { Stars } from "../Stars";
import { useToast } from "../Toast";
import styles from "./ProductReviews.module.css";

const PER_PAGE = 5;
const LABELS = ["", "Sangat buruk", "Buruk", "Cukup", "Baik", "Sangat baik"];

/** Reviews of one approved product: anyone can read them and write one, no login (GET/POST /api/landing/products/:id/reviews). */
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
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const { meta } = await api.landing.addReview(productId, { name: name.trim(), stars, review: text.trim() });
      if (meta) setSummary(meta);
      setName("");
      setStars(0);
      setText("");
      toast.success("Terima kasih!", "Ulasan Anda telah ditambahkan.");
      reload();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      toast.error("Ulasan gagal dikirim", errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const reviews: Review[] = data?.data ?? [];
  const total = data?.meta?.total ?? summary.reviewCount;
  const shown = hover || stars;

  return (
    <section className={styles.section} id="ulasan">
      <h2>ULASAN PEMBELI</h2>
      <div className={styles.layout}>
        <div className={`card ${styles.summary}`}>
          {summary.reviewCount && summary.ratingAverage != null ? (
            <>
              <strong className={styles.big}>{formatRating(summary.ratingAverage)}</strong>
              <Stars value={summary.ratingAverage} size="lg" />
              <span className="muted">dari {summary.reviewCount} ulasan</span>
            </>
          ) : (
            <span className="muted">Belum ada ulasan. Jadilah yang pertama!</span>
          )}
        </div>

        <form className={`card ${styles.form}`} onSubmit={submit} noValidate>
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
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Nama Anda" />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>
          <label className="field">
            <span className="label">Ulasan</span>
            <textarea
              className="textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              placeholder="Bagaimana pengalaman Anda dengan produk ini?"
            />
            {errors.review && <span className="field-error">{errors.review}</span>}
          </label>
          <button type="submit" className="btn btn-orange" disabled={busy}>
            {busy ? "Mengirim..." : "Kirim Ulasan"}
          </button>
        </form>
      </div>

      <div className={styles.list}>
        {loading && !data ? (
          <p className="muted">Memuat ulasan...</p>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : (
          reviews.map((r) => (
            <article key={r.id} className={`card ${styles.item}`}>
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
          <button type="button" className="btn btn-light" onClick={() => setLimit((l) => l + PER_PAGE)} disabled={loading}>
            {loading ? "Memuat..." : "Lihat ulasan lainnya"}
          </button>
        )}
      </div>
    </section>
  );
}
