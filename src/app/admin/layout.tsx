"use client";

import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { RoleProfile } from "@/components/dashboard/RoleProfile";
import { IconBell, IconBox, IconCheckCircle, IconHome, IconSettings, IconStore, IconTag } from "@/components/Icons";

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: IconHome, exact: true },
  { href: "/admin/konfirmasi", label: "Konfirmasi Produk", icon: IconCheckCircle },
  { href: "/admin/produk", label: "Manajemen Produk", icon: IconBox },
  { href: "/admin/kategori", label: "Kategori UMKM", icon: IconTag },
  { href: "/admin/umkm", label: "Manajemen UMKM", icon: IconStore },
  { href: "/admin/notifikasi", label: "Notifikasi", icon: IconBell, badge: true },
  { href: "/admin/pengaturan", label: "Pengaturan Administrator", icon: IconSettings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell role="admin" items={NAV} profile={<RoleProfile label="Administrator" />}>
      {children}
    </DashboardShell>
  );
}
