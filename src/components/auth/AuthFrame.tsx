import { PageHeader } from "../ui";
import styles from "./auth.module.css";

/** Page frame for login / registration / password pages: back arrow + title, optional step pill, brand. */
export function AuthFrame({
  title,
  step,
  backHref = "/",
  children,
}: {
  title: string;
  step?: string;
  backHref?: string;
  children: React.ReactNode;
}) {
  return (
    <main className={styles.frame}>
      <PageHeader title={title} backHref={backHref}>
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
      <p>Jika ada kendala dalam pendaftaran, hubungi administrator Prafi Hub.</p>
      <a href="/panduan#hubungi-admin">HUBUNGI ADMIN</a>
    </div>
  );
}
