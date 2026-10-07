"use client";

import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { RoleProfile } from "@/components/dashboard/RoleProfile";
import { IconBell, IconBox, IconHome, IconSettings, IconStore, IconTag, IconUser, IconUsers } from "@/components/Icons";

const NAV: NavItem[] = [
  { href: "/superadmin", label: "Dashboard", icon: IconHome, exact: true },
  { href: "/superadmin/disnakertrans", label: "Akun Disnakertrans", icon: IconUser },
  { href: "/superadmin/pengguna", label: "Semua Pengguna", icon: IconUsers },
  { href: "/superadmin/produk", label: "Data Produk", icon: IconBox },
  { href: "/superadmin/umkm", label: "Data UMKM", icon: IconStore },
  { href: "/superadmin/kategori", label: "Kategori UMKM", icon: IconTag },
  { href: "/superadmin/notifikasi", label: "Notifikasi", icon: IconBell, badge: true },
  { href: "/superadmin/pengaturan", label: "Pengaturan Akun", icon: IconSettings },
];

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell role="superadmin" items={NAV} profile={<RoleProfile label="Super Admin" />}>
      {children}
    </DashboardShell>
  );
}
