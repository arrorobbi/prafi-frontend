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
    /** For the UMKM's address (tenantPath) */
    slug?: string | null;
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
  /** The readable part of the product's address, made from the name (productPath); missing on rows from before slugs */
  slug?: string | null;
  description: string;
  details: string;
  /** Rupiah (IDR) */
  price: number;
  /** Set by the server: true while its reviews average 4.8 stars or more (shown in the landing page's recommendations) */
  isRecommended: boolean;
  /** Null only for older products created before categories moved to products */
  categoryId: number | null;
  category?: Pick<ProductCategory, "id" | "name" | "slug"> | null;
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

/** Managed by admins; the image is a slide of the home page carousel */
export interface ProductCategory {
  id: number;
  name: string;
  /** The readable part of the category's address (categoryPath); never numbered: category names can't repeat */
  slug?: string | null;
  imageId: number | null;
  image: ImageFile | null;
  /** Dashboard: all its products; landing (GET /api/landing/categories): approved products only */
  productCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantProfile {
  id: string;
  name: string;
  /** The readable part of the UMKM's address, made from the name (tenantPath) */
  slug?: string | null;
  description: string;
  address: string;
  area: string;
  operationalHours: string;
  /** Every link is optional: null when the tenant didn't add one */
  fbLink: string | null;
  whatsappLink: string | null;
  gmapsLink: string | null;
  instagramLink: string | null;
  googleBusinessLink: string | null;
  shopeeLink: string | null;
  logoId: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  logo: ImageFile | null;
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

/** A seller's report on a review: waiting for an admin / disnakertrans, or their decision */
export type ReportStatus = "pending" | "kept" | "hidden";

/** A review as sellers (their products) and admins / disnakertrans (reported ones) see it */
export interface ModeratedReview extends Omit<Review, "updatedAt"> {
  /** Hidden by an admin / disnakertrans: not shown publicly, not counted in the rating */
  isHidden: boolean;
  /** null = never reported */
  reportStatus: ReportStatus | null;
  reportReason: string | null;
  reportedAt: string | null;
  moderatedAt: string | null;
  moderationNote: string | null;
  product?: { id: string; name: string; slug?: string | null; tenantId: string; tenant?: ProductOwner | null };
  reporter?: Pick<ProductOwner, "id" | "tenantName" | "firstName" | "lastName"> | null;
  moderator?: { id: string; firstName: string; lastName: string; role: Role } | null;
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
  | "PRODUCT_DELETED"
  | "TENANT_PROFILE_UPDATED"
  | "TENANT_REGISTERED"
  | "PRODUCT_UNDER_REVIEW"
  | "PRODUCT_APPROVED"
  | "PRODUCT_TAKEN_DOWN"
  | "PRODUCT_CHANGES_SAVED"
  | "PRODUCT_REVIEWED"
  | "REVIEW_REPORTED"
  | "REVIEW_MODERATED";

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
  /** Development only (disnakertrans): the temporary password from the email */
  devTemporaryPassword?: string;
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
  products: {
    total: number;
    byStatus: { active: number; pending: number; rejected: number; inactive: number };
    byCategory: { name: string; count: number }[];
  };
  tenants: { total: number; byArea: { area: string; count: number }[] };
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

export type ServiceState = "active" | "inactive" | "failed" | "activating" | "unknown";

/** GET /api/server/metrics and the live `server:metrics` event: one reading of the server (superadmin) */
export interface ServerMetrics {
  at: string;
  host: { hostname: string; os: string; uptimeSeconds: number; cores: number; loadAverage: number[] };
  /** Busy share of all cores since the previous reading */
  cpu: { percent: number };
  memory: { totalBytes: number; usedBytes: number; percent: number; swapTotalBytes: number; swapUsedBytes: number };
  /** alertPercent: an email is sent at this level (0 = no alert) */
  disk: { path: string; totalBytes: number; usedBytes: number; freeBytes: number; percent: number; alertPercent: number };
  app: { nodeVersion: string; environment: string; backendUptimeSeconds: number; backendMemoryBytes: number };
  services: { name: string; label: string; state: ServiceState }[];
  storage: {
    databaseBytes: number | null;
    imagesBytes: number;
    imagesCount: number;
    backupsBytes: number;
    lastBackup: { file: string; at: string; bytes: number } | null;
  };
}
