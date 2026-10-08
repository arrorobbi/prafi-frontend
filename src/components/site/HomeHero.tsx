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
 * show the current category's products; changing the slide changes them. `side` is the map card above them.
 * Without category slides, `fallback` (the newest / recommended products) is shown instead.
 */
export function HomeHero({ slides, fallback, side }: { slides: CategorySlide[]; fallback: Product[]; side: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  const current = slides[index] as CategorySlide | undefined;
  const picks = current ? current.products : fallback;

  return (
    <section className={styles.hero}>
      <HeroCarousel slides={slides} index={index} onIndexChange={setIndex} />

      <div className={styles.heroRight}>
        {side}

        {current && (
          <div className={styles.picksHead}>
            <h2>
              Kategori <span>{current.caption}</span>
            </h2>
            <Link href={current.href}>Lihat semua</Link>
          </div>
        )}
        {picks.length > 0 && (
          <div className={styles.picks} aria-live="polite">
            {picks.map((p) => (
              <ProductCard key={p.id} product={p} recommended={!current} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
