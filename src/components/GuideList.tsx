import type { Guide } from "@/lib/guides";
import styles from "./GuideList.module.css";

/** Expandable help topics (the "Bantuan & Ketentuan" design). Uses <details>, so it works without JS. */
export function GuideList({ guides }: { guides: Guide[] }) {
  return (
    <div className={styles.list}>
      {guides.map(({ id, title, summary, icon: Icon, color, body }) => (
        <details key={id} id={id} className={styles.item}>
          <summary>
            <span className={styles.icon} style={{ color }}>
              <Icon />
            </span>
            <span className={styles.text}>
              <strong>{title}</strong>
              <span>{summary}</span>
            </span>
            <span className={styles.arrow} aria-hidden>
              ▶
            </span>
          </summary>
          <div className={styles.body}>{body}</div>
        </details>
      ))}
    </div>
  );
}
