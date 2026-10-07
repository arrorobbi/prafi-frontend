"use client";

import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { RoleProfile } from "@/components/dashboard/RoleProfile";
import { IconBell, IconBox, IconCheckCircle, IconHome, IconSettings, IconStore } from "@/components/Icons";

const NAV: NavItem[] = [
  { href: "/disnakertrans", label: "Dashboard", icon: IconHome, exact: true },
  { href: "/disnakertrans/admin", label: "Aktivasi Admin", icon: IconCheckCircle },
  { href: "/disnakertrans/produk", label: "Data Produk", icon: IconBox },
  { href: "/disnakertrans/umkm", label: "Data UMKM", icon: IconStore },
  { href: "/disnakertrans/notifikasi", label: "Notifikasi", icon: IconBell, badge: true },
  { href: "/disnakertrans/pengaturan", label: "Pengaturan Akun", icon: IconSettings },
];

export default function DisnakertransLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell role="disnakertrans" items={NAV} profile={<RoleProfile label="Disnakertrans" />}>
      {children}
    </DashboardShell>
  );
}
