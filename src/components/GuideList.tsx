import { GUIDE_ICONS } from "@/lib/guides";
import type { GuideSection } from "@/lib/types";
import { GuideContact } from "./GuideContact";
import { GuideSteps } from "./GuideSteps";
import { RichText } from "./RichText";
import styles from "./GuideList.module.css";

const TOKENS = { "kontak-admin": <GuideContact /> };

/** Expandable help topics (the "Bantuan & Ketentuan" design). Uses <details>, so it works without JS. */
export function GuideList({ guides }: { guides: GuideSection[] }) {
  return (
    <div className={styles.list}>
      {guides.map((g) => {
        const Icon = (GUIDE_ICONS[g.icon] ?? GUIDE_ICONS.docs).Icon;
        return (
          <details key={g.id} id={g.slug} className={styles.item}>
            <summary>
              <span className={styles.icon} style={{ color: g.color }}>
                <Icon />
              </span>
              <span className={styles.text}>
                <strong>{g.title}</strong>
                {g.summary && <span>{g.summary}</span>}
              </span>
              <span className={styles.arrow} aria-hidden>
                ▶
              </span>
            </summary>
            <div className={styles.body}>
              {g.intro && <RichText text={g.intro} tokens={TOKENS} />}
              <GuideSteps steps={g.steps} />
              {g.outro && <RichText text={g.outro} tokens={TOKENS} />}
            </div>
          </details>
        );
      })}
    </div>
  );
}
