"use client";

import { useRef } from "react";
import type { Product } from "@/lib/types";
import { IconChevronLeft, IconChevronRight } from "../Icons";
import { ProductCard } from "./ProductCard";
import styles from "./ProductStrip.module.css";

/** Horizontally scrolling row of small product cards with arrow buttons. */
export function ProductStrip({ products }: { products: Product[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className={styles.wrap}>
      <button type="button" className={`${styles.arrow} ${styles.prev}`} aria-label="Geser ke kiri" onClick={() => scroll(-1)}>
        <IconChevronLeft />
      </button>
      <div className={styles.track} ref={ref}>
        {products.map((p) => (
          <div key={p.id} className={styles.item}>
            <ProductCard product={p} small />
          </div>
        ))}
      </div>
      <button type="button" className={`${styles.arrow} ${styles.next}`} aria-label="Geser ke kanan" onClick={() => scroll(1)}>
        <IconChevronRight />
      </button>
    </div>
  );
}
