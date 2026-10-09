"use client";

import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { IconBell, IconBox, IconHelp, IconHome, IconMessage, IconPlus, IconSettings, IconUser, IconXCircle } from "@/components/Icons";
import { useAuth } from "@/lib/auth";
import { imageSrc } from "@/lib/format";
import { TenantProfileProvider, useTenantProfile } from "@/lib/tenantProfile";
import styles from "./tenant.module.css";

const NAV: NavItem[] = [
  { href: "/tenant", label: "Dashboard", icon: IconHome, exact: true },
  { href: "/tenant/produk", label: "Produk Saya", icon: IconBox, exact: true },
  { href: "/tenant/produk/tambah", label: "Tambah Produk", icon: IconPlus },
  { href: "/tenant/ditolak", label: "Produk Ditolak", icon: IconXCircle },
  { href: "/tenant/ulasan", label: "Ulasan Produk", icon: IconMessage },
  { href: "/tenant/profil", label: "Profil UMKM", icon: IconUser },
  { href: "/tenant/notifikasi", label: "Notifikasi", icon: IconBell, badge: true },
  { href: "/tenant/bantuan", label: "Bantuan & Ketentuan", icon: IconHelp },
  { href: "/tenant/pengaturan", label: "Pengaturan Akun", icon: IconSettings },
];

function ShopBadge() {
  const { user } = useAuth();
  const { profile } = useTenantProfile();
  const name = profile?.name || user?.tenantName || "Toko Saya";
  return (
    <div className={styles.shop}>
      <img src={profile?.logo ? imageSrc(profile.logo) : "/logo.png"} alt="" />
      <strong>{name}</strong>
    </div>
  );
}

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <TenantProfileProvider>
      <DashboardShell role="tenant" items={NAV} profile={<ShopBadge />}>
        {children}
      </DashboardShell>
    </TenantProfileProvider>
  );
}
