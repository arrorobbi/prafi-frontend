"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";
import styles from "@/app/(public)/home.module.css";
import { HeroCarousel, type HeroSlide } from "./HeroCarousel";
import { ProductCard } from "./ProductCard";

export interface CategorySlide extends HeroSlide {
  /** Up to 3 approved products of this category, best rated first */
  products: Product[];
}

/**
 * The home page hero: the carousel shows one slide per product category (its image), and the cards on the right
 * show the current category's products; changing the slide changes them. `side` is the BUMDES / map card above
 * them (on phones it comes after them, so the products stay right under the carousel they belong to).
 * Without category slides, `fallback` (the newest / recommended products) is shown instead.
 */
export function HomeHero({ slides, fallback, side }: { slides: CategorySlide[]; fallback: Product[]; side: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  /** 1 = moved forward (next, autoplay), -1 = back: the slide and the cards come in from that side */
  const [direction, setDirection] = useState<1 | -1>(1);
  const current = slides[index] as CategorySlide | undefined;
  const changeSlide = (next: number) => {
    const count = slides.length;
    // The shorter way round decides the side (a dot far ahead counts as forward)
    setDirection((next - index + count) % count <= count / 2 ? 1 : -1);
    setIndex(next);
  };
  const picks = current ? current.products : fallback;

  return (
    <section className={styles.hero}>
      <HeroCarousel slides={slides} index={index} direction={direction} onIndexChange={changeSlide} />

      <div className={styles.heroRight}>
        {/* Beside the carousel on wide screens; below the category's products when everything is stacked (phones) */}
        <div className={styles.heroSide}>{side}</div>

        {current && (
          <div className={styles.picksHead}>
            <h2>
              Kategori <span key={current.key}>{current.caption}</span>
            </h2>
            <Link href={current.href}>Lihat semua</Link>
          </div>
        )}
        {picks.length > 0 && (
          // New key per slide: the cards are drawn again and slide in one after another (home.module.css)
          <div
            key={current?.key ?? "fallback"}
            className={styles.picks}
            aria-live="polite"
            style={{ "--dir": direction } as React.CSSProperties}
          >
            {picks.map((p) => (
              <ProductCard key={p.id} product={p} recommended={!current} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
