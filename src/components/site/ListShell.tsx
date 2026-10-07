import Link from "next/link";
import { PageHeader } from "../ui";
import styles from "./ListShell.module.css";

export interface SideLink {
  href: string;
  label: string;
  active?: boolean;
}

/** Navy side list + content panel (the "Kategori" / "UMKM" pages in the landing design). */
export function ListShell({
  sideTitle,
  sideLinks,
  title,
  backHref = "/",
  toolbar,
  children,
}: {
  sideTitle: string;
  sideLinks: SideLink[];
  title: string;
  backHref?: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <aside className={styles.side}>
        <h2>{sideTitle}</h2>
        <nav>
          {sideLinks.length === 0 && <span className={styles.none}>Belum ada data</span>}
          {sideLinks.map((l) => (
            <Link key={l.href} href={l.href} className={l.active ? styles.active : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className={styles.content}>
        <PageHeader title={title} backHref={backHref} />
        {toolbar && <div className={styles.toolbar}>{toolbar}</div>}
        <div className={styles.panel}>{children}</div>
      </section>
    </div>
  );
}
