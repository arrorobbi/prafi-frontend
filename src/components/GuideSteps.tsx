import styles from "./GuideSteps.module.css";
import { Thumb } from "./ui";

/** Numbered step-by-step list for the guides; each step can show a screenshot. */
export function Steps({ children }: { children: React.ReactNode }) {
  return <ol className={styles.steps}>{children}</ol>;
}

/**
 * One step. `image` is a file in public/panduan (without extension); the highlighted part of the
 * screenshot is what the step talks about. Clicking the picture opens it larger in the popup (Lightbox).
 */
export function Step({ image, alt, children }: { image?: string; alt?: string; children: React.ReactNode }) {
  return (
    <li className={styles.step}>
      <div className={styles.text}>{children}</div>
      {image && (
        <div className={styles.figure}>
          <Thumb zoom src={`/panduan/${image}.jpg`} alt={alt ?? "Contoh tampilan"} width={1024} height={640} />
        </div>
      )}
    </li>
  );
}
