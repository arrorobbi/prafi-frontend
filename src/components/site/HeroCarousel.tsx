"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { imageSrc } from "@/lib/format";
import type { Product } from "@/lib/types";
import { IconChevronLeft, IconChevronRight } from "../Icons";
import { Thumb } from "../ui";
import styles from "./HeroCarousel.module.css";
import { buttonVariants } from "@/components/shadcn/button";

/** Big centre slide with the neighbours peeking on each side, as in the landing design. */
export function HeroCarousel({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = products.length;

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => go(1), 5000);
    return () => clearInterval(t);
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

  const at = (offset: number) => products[(index + offset + count) % count];
  const current = at(0);

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Produk unggulan"
    >
      <div className={styles.stage}>
        {count > 1 && (
          <div className={`${styles.side} ${styles.left}`} aria-hidden>
            <Thumb src={imageSrc(at(-1).image)} alt="" />
          </div>
        )}
        <Link href={`/produk/${current.id}`} className={styles.main} aria-live="polite">
          <Thumb src={imageSrc(current.image)} alt={current.image?.altText || current.name} />
          <span className={styles.caption}>{current.name}</span>
        </Link>
        {count > 1 && (
          <div className={`${styles.side} ${styles.right}`} aria-hidden>
            <Thumb src={imageSrc(at(1).image)} alt="" />
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
        <div className={styles.dots}>
          {products.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={`Slide ${i + 1}`}
              aria-current={i === index}
              className={i === index ? styles.dotActive : ""}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
