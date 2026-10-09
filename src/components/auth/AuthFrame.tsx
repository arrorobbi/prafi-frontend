import { PageHeader } from "../ui";
import styles from "./auth.module.css";

/** Page frame for login / registration / password pages: back arrow + title, optional step pill, brand. */
export function AuthFrame({
  title,
  step,
  backHref = "/",
  backAlways,
  children,
}: {
  title: string;
  step?: string;
  backHref?: string;
  /** The back arrow always goes to backHref, not to the previous page */
  backAlways?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className={styles.frame}>
      <PageHeader title={title} backHref={backHref} backAlways={backAlways}>
        {step && <span className={styles.step}>{step}</span>}
      </PageHeader>
      {children}
    </main>
  );
}

export function HelpBox() {
  return (
    <div className={styles.help}>
      <strong>BUTUH BANTUAN?</strong>
      <p>Jika ada kendala dalam pendaftaran, hubungi administrator Trans Niaga.</p>
      <a href="/panduan#hubungi-admin">HUBUNGI ADMIN</a>
    </div>
  );
}
