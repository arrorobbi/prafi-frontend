"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { roleHome, useAuth } from "@/lib/auth";
import { NotificationProvider, useNotifications } from "@/lib/notifications";
import type { Role } from "@/lib/types";
import { IconClose, IconLogout, IconMenu } from "../Icons";
import { Brand, Loading } from "../ui";
import styles from "./DashboardShell.module.css";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** Show the unread-notification badge on this item. */
  badge?: boolean;
  /** Match only this exact path (for the dashboard home). */
  exact?: boolean;
}

function Nav({ items, onNavigate }: { items: NavItem[]; onNavigate: () => void }) {
  const pathname = usePathname();
  const { unread } = useNotifications();
  return (
    <nav className={styles.nav} aria-label="Menu dashboard">
      {items.map(({ href, label, icon: Icon, badge, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} className={active ? styles.active : ""} aria-current={active ? "page" : undefined} onClick={onNavigate}>
            <Icon />
            <span>{label}</span>
            {badge && unread > 0 && <b className={styles.badge}>{unread > 99 ? "99+" : unread}</b>}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Sidebar layout for the admin and tenant dashboards. Also guards the route:
 * guests go to /login, other roles go to their own dashboard.
 */
export function DashboardShell({
  role,
  items,
  profile,
  children,
}: {
  role: Role;
  items: NavItem[];
  profile: React.ReactNode;
  children: React.ReactNode;
}) {
  const { status, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (status === "guest") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (status === "authenticated" && user && user.role !== role) router.replace(roleHome(user.role));
  }, [status, user, role, router, pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (status !== "authenticated" || !user || user.role !== role) {
    return (
      <div className={styles.gate}>
        <Loading label="Memeriksa sesi..." />
      </div>
    );
  }

  return (
    <NotificationProvider>
      <div className={styles.shell}>
        <div className={styles.topbar}>
          <button type="button" className={styles.menuBtn} aria-label="Buka menu" onClick={() => setOpen(true)}>
            <IconMenu />
          </button>
          <Brand compact href={roleHome(role)} />
        </div>

        {open && <div className={styles.scrim} onClick={() => setOpen(false)} aria-hidden />}

        <aside className={`${styles.sidebar} ${open ? styles.open : ""}`}>
          <button type="button" className={styles.closeBtn} aria-label="Tutup menu" onClick={() => setOpen(false)}>
            <IconClose />
          </button>
          <div className={styles.profile}>{profile}</div>
          <Nav items={items} onNavigate={() => setOpen(false)} />
          <button type="button" className={styles.logout} onClick={() => logout("Anda telah logout")}>
            <IconLogout />
            <span>Logout</span>
          </button>
        </aside>

        <main className={styles.main}>{children}</main>
      </div>
    </NotificationProvider>
  );
}
