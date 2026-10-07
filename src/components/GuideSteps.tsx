import styles from "./GuideSteps.module.css";

/** Numbered step-by-step list for the guides; each step can show a screenshot. */
export function Steps({ children }: { children: React.ReactNode }) {
  return <ol className={styles.steps}>{children}</ol>;
}

/**
 * One step. `image` is a file in public/panduan (without extension); the highlighted part of the
 * screenshot is what the step talks about. Clicking the picture opens it full size.
 */
export function Step({ image, alt, children }: { image?: string; alt?: string; children: React.ReactNode }) {
  return (
    <li className={styles.step}>
      <div className={styles.text}>{children}</div>
      {image && (
        <a href={`/panduan/${image}.jpg`} target="_blank" rel="noreferrer" className={styles.figure} title="Lihat gambar penuh">
          <img src={`/panduan/${image}.jpg`} alt={alt ?? "Contoh tampilan"} loading="lazy" width={1024} height={640} />
        </a>
      )}
    </li>
  );
}
