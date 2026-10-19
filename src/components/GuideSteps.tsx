import { imageSrc } from "@/lib/format";
import type { GuideStep } from "@/lib/types";
import { GuideContact } from "./GuideContact";
import { GuideImage } from "./GuideImage";
import { RichText } from "./RichText";
import styles from "./GuideSteps.module.css";

/** {{kontak-admin}} works in steps too, as in the topic texts */
const TOKENS = { "kontak-admin": <GuideContact /> };

/** Numbered step-by-step list of a Panduan topic; each step can show a screenshot (desktop and/or HP). */
export function GuideSteps({ steps }: { steps: GuideStep[] }) {
  if (!steps.length) return null;
  return (
    <ol className={styles.steps}>
      {steps.map((s) => (
        <li key={s.id} className={styles.step}>
          <RichText text={s.body} className={styles.text} tokens={TOKENS} />
          <GuideImage
            desktop={s.desktopImage ? imageSrc(s.desktopImage) : null}
            mobile={s.mobileImage ? imageSrc(s.mobileImage) : null}
            alt={s.imageAlt || "Contoh tampilan"}
          />
        </li>
      ))}
    </ol>
  );
}
