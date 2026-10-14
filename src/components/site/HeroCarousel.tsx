"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { IconChevronLeft, IconChevronRight } from "../Icons";
import { Thumb } from "../ui";
import styles from "./HeroCarousel.module.css";
import { buttonVariants } from "@/components/shadcn/button";

export interface HeroSlide {
  key: string | number;
  image: string;
  alt: string;
  caption: string;
  href: string;
}

/** Time each slide stays before the next one (the progress line under the dots shows it running) */
const AUTOPLAY_MS = 6000;

/**
 * Big centre slide with the neighbours peeking on each side, as in the landing design. Controlled: the parent
 * keeps `index` (the home page shows the current slide's products next to it).
 */
export function HeroCarousel({
  slides,
  index,
  direction = 1,
  onIndexChange,
  label = "Kategori produk",
}: {
  slides: HeroSlide[];
  index: number;
  /** 1 = the slide came from the right (next), -1 = from the left: decides which way the motion goes */
  direction?: 1 | -1;
  onIndexChange: (index: number) => void;
  label?: string;
}) {
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const go = useCallback((delta: number) => onIndexChange((index + delta + count) % count), [index, count, onIndexChange]);

  useEffect(() => {
    if (count < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => go(1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [count, paused, go]);

  if (count === 0) {
    return (
      <div className={styles.placeholder}>
        <img src="/logo.png" alt="" />
        <p>Produk UMKM Prafi akan segera tampil di sini.</p>
        <Link href="/register" className={buttonVariants({ variant: "orange" })}>
          Daftar sebagai Penjual
        </Link>
      </div>
    );
  }

  const at = (offset: number) => slides[(index + offset + count) % count];
  const current = at(0);

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label={label}
    >
      {/* --dir: which side the new slide comes from (the keyframes in HeroCarousel.module.css use it) */}
      <div className={styles.stage} style={{ "--dir": direction } as React.CSSProperties}>
        {count > 1 && (
          <div key={`l-${at(-1).key}`} className={`${styles.side} ${styles.left}`} aria-hidden>
            <Thumb src={at(-1).image} alt="" />
          </div>
        )}
        <Link key={current.key} href={current.href} className={styles.main} aria-live="polite">
          <Thumb src={current.image} alt={current.alt} />
          <span className={styles.shine} aria-hidden />
          <span className={styles.caption}>{current.caption}</span>
        </Link>
        {count > 1 && (
          <div key={`r-${at(1).key}`} className={`${styles.side} ${styles.right}`} aria-hidden>
            <Thumb src={at(1).image} alt="" />
          </div>
        )}
        {count > 1 && (
          <>
            <button type="button" className={`${styles.arrow} ${styles.prev}`} aria-label="Sebelumnya" onClick={() => go(-1)}>
              <IconChevronLeft />
            </button>
            <button type="button" className={`${styles.arrow} ${styles.next}`} aria-label="Berikutnya" onClick={() => go(1)}>
              <IconChevronRight />
            </button>
          </>
        )}
      </div>
      {count > 1 && (
        // Restarts with each slide; stands still while the visitor points at or focuses the carousel
        <span key={`p-${current.key}`} className={`${styles.progress} ${paused ? styles.progressPaused : ""}`} style={{ animationDuration: `${AUTOPLAY_MS}ms` }} aria-hidden />
      )}
      {count > 1 && (
        <div className={styles.dots}>
          {slides.map((s, i) => (
            <button
              key={s.key}
              type="button"
              aria-label={`${s.caption} (slide ${i + 1})`}
              aria-current={i === index}
              className={i === index ? styles.dotActive : ""}
              onClick={() => onIndexChange(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
