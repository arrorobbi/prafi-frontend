import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: { absolute: "Under Construction" },
  description: "This site is under construction. We'll be live soon.",
  robots: { index: false },
};

export default function Maintenance() {
  const year = new Date().getFullYear();

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>

        <p className={styles.badge}>Coming Soon</p>

        <h1 className={styles.title}>
          We&apos;re <span>under construction</span>
        </h1>

        <p className={styles.text}>
          Our website is currently being built. We&apos;re working hard to bring
          you something great — please check back soon.
        </p>

        <div className={styles.progress} role="progressbar" aria-label="Work in progress">
          <div className={styles.bar} />
        </div>
      </div>

      <footer className={styles.footer}>© {year} Prafi. All rights reserved.</footer>
    </main>
  );
}
