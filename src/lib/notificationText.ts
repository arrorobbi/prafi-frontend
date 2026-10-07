import type { AppNotification, NotificationType, Role } from "./types";

/**
 * The backend writes notification titles/messages in English. Show them in Bahasa Indonesia,
 * keyed on `type`, falling back to the original text.
 */
const TITLES: Record<NotificationType, string> = {
  USER_REGISTERED: "Akun Baru Terdaftar",
  ADMIN_PENDING_ACTIVATION: "Admin Baru Menunggu Aktivasi",
  PRODUCT_SUBMITTED: "Produk Baru Menunggu Konfirmasi",
  USER_DEACTIVATED: "Akun Dinonaktifkan",
  PRODUCT_DEACTIVATED: "Produk Dinonaktifkan",
  PRODUCT_PUBLISHED: "Produk Ditayangkan",
  PRODUCT_UPDATED: "Produk Diperbarui",
  TENANT_PROFILE_UPDATED: "Profil Toko Diperbarui",
  TENANT_REGISTERED: "Penjual Baru Mendaftar",
  PRODUCT_UNDER_REVIEW: "Produk Berhasil Diajukan",
  PRODUCT_APPROVED: "Produk Disetujui",
};

const quoted = (text: string) => text.match(/"([^"]+)"/)?.[1];
const before = (text: string, marker: string) => (text.includes(marker) ? text.slice(0, text.indexOf(marker)).trim() : undefined);

export function notificationTitle(n: AppNotification) {
  return TITLES[n.type] ?? n.name;
}

export function notificationMessage(n: AppNotification) {
  const d = n.description ?? "";
  const product = quoted(d);
  switch (n.type) {
    case "PRODUCT_UNDER_REVIEW":
      return product ? `Produk "${product}" berhasil diajukan dan menunggu konfirmasi administrator.` : d;
    case "PRODUCT_APPROVED":
      return product ? `Produk "${product}" telah disetujui dan sekarang aktif di UMKM Transniaga.` : d;
    case "PRODUCT_SUBMITTED": {
      const by = before(d, " created");
      return product ? `${by ?? "Penjual"} mengajukan produk "${product}". Silakan periksa dan konfirmasi.` : d;
    }
    case "PRODUCT_PUBLISHED":
      return product ? `Produk "${product}" telah diaktifkan dan tampil di halaman utama.` : d;
    case "PRODUCT_UPDATED": {
      const by = before(d, " updated");
      return product ? `${by ?? "Penjual"} memperbarui produk "${product}".` : d;
    }
    case "TENANT_PROFILE_UPDATED": {
      const by = before(d, " updated");
      return by ? `${by} memperbarui profil tokonya.` : d;
    }
    case "TENANT_REGISTERED": {
      const by = before(d, " just signed up");
      return by ? `${by} mendaftar sebagai penjual.` : d;
    }
    case "USER_REGISTERED": {
      const m = d.match(/^(.+) was registered as (\w+)\.?$/);
      return m ? `${m[1]} terdaftar sebagai ${m[2]}.` : d;
    }
    case "ADMIN_PENDING_ACTIVATION": {
      const who = before(d, " signed up as admin");
      return who ? `${who} mendaftar sebagai admin dan perlu diaktifkan.` : d;
    }
    case "USER_DEACTIVATED": {
      const m = d.match(/^(\S+) deactivated the (\w+) account (\S+?)\.?$/);
      return m ? `${m[1]} menonaktifkan akun ${m[2]} ${m[3]}.` : d;
    }
    case "PRODUCT_DEACTIVATED":
      return product ? `Produk "${product}" dinonaktifkan.` : d;
    default:
      return d;
  }
}

/** Where clicking a notification leads, per role. */
export function notificationHref(n: AppNotification, role: Role) {
  if (role === "admin") {
    if (n.entityType === "product" && n.entityId) return `/admin/konfirmasi/${n.entityId}`;
    if (n.entityType === "user" || n.entityType === "tenant") return "/admin/umkm";
  }
  if (role === "tenant" && n.entityType === "product" && n.entityId) return `/tenant/produk/${n.entityId}/edit`;
  if (role === "superadmin") {
    if (n.entityType === "product") return "/superadmin/produk";
    if (n.entityType === "user") return n.approval?.user?.role === "disnakertrans" ? "/superadmin/disnakertrans" : "/superadmin/pengguna";
    if (n.entityType === "tenant") return "/superadmin/umkm";
  }
  if (role === "disnakertrans" && n.entityType === "user") return "/disnakertrans/admin";
  return null;
}

export type NotificationTone = "pending" | "success" | "danger" | "info";

export function notificationTone(type: NotificationType): NotificationTone {
  if (type === "PRODUCT_APPROVED" || type === "PRODUCT_PUBLISHED") return "success";
  if (type === "USER_DEACTIVATED" || type === "PRODUCT_DEACTIVATED") return "danger";
  if (type === "PRODUCT_UNDER_REVIEW" || type === "PRODUCT_SUBMITTED" || type === "ADMIN_PENDING_ACTIVATION") return "pending";
  return "info";
}
