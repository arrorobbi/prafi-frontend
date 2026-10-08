/** Shapes returned by the Prafi API (https://api.transniaga.manokwarikab.go.id/docs). */

export type Role = "superadmin" | "disnakertrans" | "admin" | "tenant";

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  unreadCount?: number;
}

export interface ApiFieldError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ImageFile {
  id: number;
  url: string;
  imgUrl: string;
  name?: string;
  altText?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Approval {
  id: number;
  isActive: boolean;
  reason: string | null;
  type?: "user" | "product";
  userId?: string;
  createdAt?: string;
  updatedAt: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  role: Role;
  faceImageId: number | null;
  tenantName: string | null;
  mailActive: boolean;
  passwordChangedAt: string | null;
  createdAt: string;
  updatedAt: string;
  faceImage?: ImageFile | null;
  approval?: Approval | null;
}

export interface ProductOwner {
  id: string;
  tenantName: string | null;
  firstName: string;
  lastName: string;
  email?: string;
  /** Public product responses: the owner's UMKM profile, for "Lihat UMKM" and its contact buttons */
  tenant?: {
    id: string;
    name: string;
    whatsappLink?: string | null;
    instagramLink?: string | null;
    shopeeLink?: string | null;
    googleBusinessLink?: string | null;
    fbLink?: string | null;
    gmapsLink?: string | null;
  } | null;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  details: string;
  /** Rupiah (IDR) */
  price: number;
  /** Set by the tenant: shown in the landing page's recommendations */
  isRecommended: boolean;
  /** Average of its reviews (1 decimal), null without reviews */
  ratingAverage: number | null;
  reviewCount: number;
  imageId: number | null;
  approvalId?: number | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  image: ImageFile | null;
  approval?: Approval | null;
  tenant: ProductOwner | null;
}

export interface TenantCategory {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantProfile {
  id: string;
  name: string;
  description: string;
  address: string;
  area: string;
  operationalHours: string;
  fbLink: string;
  whatsappLink: string;
  gmapsLink: string;
  /** Optional links: null when the tenant didn't add one */
  instagramLink: string | null;
  googleBusinessLink: string | null;
  shopeeLink: string | null;
  logoId: number;
  tenantCategoryId: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  logo: ImageFile | null;
  category: TenantCategory | null;
  owner?: ProductOwner;
  /** GET /api/tenants/me: whether products can be added yet, and which fields are still empty */
  isComplete?: boolean;
  missingFields?: string[];
}

/** GET /api/landing/tenants: a public UMKM with a summary of its approved products */
export interface PublicTenant extends Omit<TenantProfile, "owner" | "isComplete" | "missingFields"> {
  productCount: number;
  ratingAverage: number | null;
  reviewCount: number;
  owner: { id: string; tenantName: string | null };
}

/** A visitor's product review (public, no login) */
export interface Review {
  id: number;
  productId: string;
  name: string;
  stars: number;
  review: string;
  createdAt: string;
  updatedAt: string;
}

export interface RatingSummary {
  ratingAverage: number | null;
  reviewCount: number;
}

export type NotificationType =
  | "USER_REGISTERED"
  | "ADMIN_PENDING_ACTIVATION"
  | "PRODUCT_SUBMITTED"
  | "USER_DEACTIVATED"
  | "PRODUCT_DEACTIVATED"
  | "PRODUCT_PUBLISHED"
  | "PRODUCT_UPDATED"
  | "TENANT_PROFILE_UPDATED"
  | "TENANT_REGISTERED"
  | "PRODUCT_UNDER_REVIEW"
  | "PRODUCT_APPROVED"
  | "PRODUCT_TAKEN_DOWN"
  | "PRODUCT_CHANGES_SAVED"
  | "PRODUCT_REVIEWED";

export interface AppNotification {
  id: number;
  type: NotificationType;
  name: string;
  description: string;
  approvalId: number | null;
  entityType: "user" | "product" | "tenant" | null;
  entityId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  approval: (Approval & { user?: Partial<User> }) | null;
}

export interface Verification {
  method: "otp" | "link";
  sentTo: string;
  expiresAt: string;
  emailSent: boolean;
  devCode?: string;
  devLink?: string;
}

export interface LoginResult {
  accessToken: string;
  tokenType: "Bearer";
  user: User;
}

export type LogLevel = "info" | "warn" | "error";

/** One API request from GET /api/logs (superadmin). errorStack only comes from GET /api/logs/:id, for 5xx. */
export interface ApiLog {
  id: number;
  level: LogLevel;
  method: string;
  path: string;
  query: string | null;
  statusCode: number;
  durationMs: number;
  userId: string | null;
  userEmail: string | null;
  userRole: Role | null;
  /** Auth actions (login, sign-up, forgot password…): the email that was given, also for guests and failed attempts */
  authEmail: string | null;
  ip: string | null;
  userAgent: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  errorDetails: unknown;
  errorStack?: string | null;
  /** Names of the fields that were sent (never their values) */
  requestFields: string[] | null;
  /** Safe extract of a successful response (id, name, email, role, isActive…); lists: { count } */
  responseSummary: LogSummary | null;
  createdAt: string;
}

export interface LogSummary {
  [key: string]: unknown;
  id?: string | number;
  name?: string;
  email?: string;
  tenantName?: string | null;
  firstName?: string;
  lastName?: string;
  price?: number;
  isActive?: boolean;
  message?: string;
  count?: number;
  user?: { email?: string; firstName?: string; lastName?: string };
  approval?: { isActive?: boolean; reason?: string };
}

/** GET /api/stats/overview: dashboard chart numbers (user numbers only for the roles the caller may list) */
export interface StatsOverview {
  days: number;
  timezone: string;
  products: { total: number; byStatus: { active: number; pending: number; rejected: number; inactive: number } };
  tenants: { total: number; byCategory: { name: string; count: number }[]; byArea: { area: string; count: number }[] };
  users: { roles: Role[]; total: number; byRole: { role: Role; active: number; inactive: number }[] };
  perDay: { date: string; products: number; tenants: number; users: number }[];
}

/** GET /api/logs/stats: API log chart numbers (superadmin) */
export interface LogStats {
  days: number;
  timezone: string;
  total: number;
  success: number;
  failed: number;
  perDay: { date: string; success: number; failed: number }[];
  byMethod: { method: string; count: number }[];
  byRole: { role: string; count: number }[];
  topEndpoints: { endpoint: string; count: number; failed: number }[];
  topErrors: { errorCode: string; count: number }[];
}
