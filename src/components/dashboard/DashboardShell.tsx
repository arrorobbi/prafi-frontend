"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { roleHome, useAuth } from "@/lib/auth";
import { fullName, imageSrc } from "@/lib/format";
import { NotificationProvider, useNotifications } from "@/lib/notifications";
import { RealtimeProvider } from "@/lib/realtime";
import { cleanupStaleUploads, discardOnUnload } from "@/lib/pendingUploads";
import type { Role } from "@/lib/types";
import { IconClose, IconLogout, IconMenu, IconUser } from "../Icons";
import { LeaveGuardProvider, useLeaveGuard } from "../LeaveGuard";
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

/** Logout asks first while a photo is uploaded but not saved (it's deleted on "Setuju"). */
function LogoutButton() {
  const { logout } = useAuth();
  const { confirmLeave } = useLeaveGuard();
  return (
    <button type="button" className={styles.logout} onClick={() => confirmLeave(() => logout("Anda telah logout"))}>
      <IconLogout />
      <span>Logout</span>
    </button>
  );
}

/** Phones: the sidebar (with the profile) is hidden behind the menu, so the top bar shows who's logged in. */
function TopbarUser({ role }: { role: Role }) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Link href={`/${role}/pengaturan`} className={styles.topUser} aria-label="Pengaturan akun">
      <span className={styles.topName}>{user.firstName}</span>
      <span className={styles.topAvatar}>
        {user.faceImage ? <img src={imageSrc(user.faceImage)} alt={`Foto ${fullName(user)}`} /> : <IconUser />}
      </span>
    </Link>
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
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (status === "guest") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (status === "authenticated" && user && user.role !== role) router.replace(roleHome(user.role));
  }, [status, user, role, router, pathname]);

  // Photos uploaded in an earlier visit but never saved (tab closed, crash): delete them
  useEffect(() => {
    if (status === "authenticated" && user) void cleanupStaleUploads(user.id);
  }, [status, user]);

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
    <LeaveGuardProvider onUnload={discardOnUnload}>
    <RealtimeProvider>
    <NotificationProvider>
      <div className={styles.shell}>
        <div className={styles.topbar}>
          <button type="button" className={styles.menuBtn} aria-label="Buka menu" onClick={() => setOpen(true)}>
            <IconMenu />
          </button>
          <Brand compact href={roleHome(role)} />
          <TopbarUser role={role} />
        </div>

        {open && <div className={styles.scrim} onClick={() => setOpen(false)} aria-hidden />}

        <aside className={`${styles.sidebar} ${open ? styles.open : ""}`}>
          <button type="button" className={styles.closeBtn} aria-label="Tutup menu" onClick={() => setOpen(false)}>
            <IconClose />
          </button>
          <div className={styles.profile}>{profile}</div>
          <Nav items={items} onNavigate={() => setOpen(false)} />
          <LogoutButton />
        </aside>

        <main className={styles.main}>{children}</main>
      </div>
    </NotificationProvider>
    </RealtimeProvider>
    </LeaveGuardProvider>
  );
}
