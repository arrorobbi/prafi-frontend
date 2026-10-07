import type { ImageFile, Product, User } from "./types";

const DATE = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
const TIME = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });
const NUMBER = new Intl.NumberFormat("id-ID");

export const formatDate = (iso?: string | null) => (iso ? DATE.format(new Date(iso)) : "-");
export const formatTime = (iso?: string | null) => (iso ? TIME.format(new Date(iso)) : "");
export const formatNumber = (n: number) => NUMBER.format(n);
/** 25000 → "Rp 25.000" */
export const formatRupiah = (n: number) => `Rp ${NUMBER.format(n)}`;
/** 4.5 → "4,5" */
export const formatRating = (n: number) => n.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function timeAgo(iso: string) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit yang lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari yang lalu`;
  return formatDate(iso);
}

export const fullName = (u?: Pick<User, "firstName" | "lastName"> | null) =>
  u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : "";

/** Splits "Nama Lengkap" into the API's firstName / lastName (lastName falls back to the first name). */
export function splitName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() ?? "";
  return { firstName, lastName: parts.join(" ") || firstName };
}

/** Images are served by the backend; load them through this site's /images proxy. */
export function imageSrc(image?: Pick<ImageFile, "imgUrl" | "url"> | null) {
  if (!image) return "/logo.png";
  return image.imgUrl || image.url;
}

export const sellerName = (p: Pick<Product, "tenant">) =>
  p.tenant?.tenantName || fullName(p.tenant) || "UMKM Prafi";

/** "08123..." / "+62 812..." → "https://wa.me/62812..." */
export function whatsappUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}

// ---------- product status ----------
// The API only stores approval.isActive + reason. The frontend writes these reason prefixes when an admin
// rejects or deactivates a product, so "rejected" and "deactivated" can be told apart later.

export const WAITING_REASON = "Waiting for approval";
export const REJECT_PREFIX = "Ditolak: ";
export const DEACTIVATE_PREFIX = "Dinonaktifkan: ";

export type ProductStatus = "active" | "pending" | "rejected" | "inactive";

export function productStatus(p: Pick<Product, "approval" | "updatedAt">): ProductStatus {
  const a = p.approval;
  if (!a) return "pending";
  if (a.isActive) return "active";
  if (!a.reason || a.reason === WAITING_REASON) return "pending";
  // Edited by the tenant after the admin's decision: it is waiting for review again
  if (new Date(p.updatedAt).getTime() > new Date(a.updatedAt).getTime() + 1000) return "pending";
  if (a.reason.startsWith(REJECT_PREFIX)) return "rejected";
  return "inactive";
}

export const STATUS_LABEL: Record<ProductStatus, string> = {
  active: "Aktif",
  pending: "Menunggu Konfirmasi",
  rejected: "Ditolak",
  inactive: "Dinonaktifkan",
};

export const STATUS_BADGE: Record<ProductStatus, string> = {
  active: "badge badge-active",
  pending: "badge badge-pending",
  rejected: "badge badge-rejected",
  inactive: "badge badge-inactive",
};

/** The reason an admin typed, without the status prefix. */
export function approvalReason(p: Pick<Product, "approval">) {
  const reason = p.approval?.reason ?? "";
  if (reason.startsWith(REJECT_PREFIX)) return reason.slice(REJECT_PREFIX.length);
  if (reason.startsWith(DEACTIVATE_PREFIX)) return reason.slice(DEACTIVATE_PREFIX.length);
  if (reason === WAITING_REASON) return "";
  if (/^(Activated|Deactivated) by /.test(reason)) return "";
  return reason;
}
