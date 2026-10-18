"use client";

import { useRef, useState } from "react";
import { useLightbox } from "./Lightbox";
import styles from "./GuideSteps.module.css";

/** Phones (and narrow windows) get the HP picture; wider screens the desktop one */
export const MOBILE_MEDIA = "(max-width: 640px)";

/**
 * A step's screenshot: the desktop picture on wide screens and the HP picture on phones (either one alone is shown
 * everywhere). Clicking it opens the picture that is shown larger (Lightbox).
 */
export function GuideImage({ desktop, mobile, alt }: { desktop: string | null; mobile: string | null; alt: string }) {
  const openLightbox = useLightbox();
  const img = useRef<HTMLImageElement>(null);
  const [broken, setBroken] = useState(false);
  const main = desktop ?? mobile;
  if (!main || broken) return null;
  const portraitOnly = !desktop;
  return (
    <button
      type="button"
      className={`${styles.figure} ${portraitOnly ? styles.portrait : ""} ${mobile ? styles.hasMobile : ""}`}
      title="Klik untuk memperbesar"
      aria-label={`Perbesar gambar: ${alt}`}
      onClick={() => openLightbox(img.current?.currentSrc || main, alt)}
    >
      <picture>
        {desktop && mobile && <source media={MOBILE_MEDIA} srcSet={mobile} width={720} height={1280} />}
        <img ref={img} src={main} alt={alt} loading="lazy" width={desktop ? 1280 : 720} height={desktop ? 800 : 1280} onError={() => setBroken(true)} />
      </picture>
    </button>
  );
}
