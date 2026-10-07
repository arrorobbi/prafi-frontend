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
}

export interface Product {
  id: string;
  name: string;
  description: string;
  details: string;
  qty: number;
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
  logoId: number;
  tenantCategoryId: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  logo: ImageFile | null;
  category: TenantCategory | null;
  owner?: ProductOwner;
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
  | "PRODUCT_APPROVED";

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
  ip: string | null;
  userAgent: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  errorDetails: unknown;
  errorStack?: string | null;
  createdAt: string;
}
