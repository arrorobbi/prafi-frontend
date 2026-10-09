"use client";

import type {
  ApiFieldError,
  ApiLog,
  AppNotification,
  ImageFile,
  LoginResult,
  LogStats,
  LogLevel,
  PageMeta,
  Product,
  PublicTenant,
  RatingSummary,
  StatsOverview,
  Review,
  Role,
  ProductCategory,
  ModeratedReview,
  ReportStatus,
  TenantProfile,
  User,
  Verification,
} from "./types";

/**
 * Browser-side client for the Prafi API. Requests go to this site's own origin (/api/...),
 * which next.config.ts proxies to the backend.
 */

const TOKEN_KEY = "prafi_token";
export const UNAUTHORIZED_EVENT = "prafi:unauthorized";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable (private mode): the session lasts until reload
  }
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Field → message, for showing validation errors next to inputs. */
  get fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    if (Array.isArray(this.details)) {
      for (const d of this.details as ApiFieldError[]) {
        if (d?.field && !out[d.field]) out[d.field] = d.message;
      }
    }
    return out;
  }
}

/** A message ready to show the user (the API's messages are already in Bahasa Indonesia). */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const fields = Object.values(err.fieldErrors);
    return fields.length ? fields.join(", ") : err.message;
  }
  if (err instanceof TypeError) return "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
  return err instanceof Error ? err.message : "Terjadi kesalahan";
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  /** Send without the Bearer token (public endpoints). */
  anonymous?: boolean;
}

function buildUrl(path: string, query?: Query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return `/api${path}${qs ? `?${qs}` : ""}`;
}

export interface Envelope<T> {
  data: T;
  meta?: PageMeta & { verification?: Verification; devLink?: string };
}

async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<Envelope<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = opts.anonymous ? null : getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (opts.body instanceof FormData) {
    body = opts.body;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(buildUrl(path, opts.query), { method, headers, body, cache: "no-store" });
  let json: { success?: boolean; data?: T; meta?: Envelope<T>["meta"]; error?: { code: string; message: string; details?: unknown } } = {};
  try {
    json = await res.json();
  } catch {
    // non-JSON (e.g. proxy error page)
  }

  if (!res.ok || json.success === false) {
    const e = json.error;
    const err = new ApiError(res.status, e?.code ?? `HTTP_${res.status}`, e?.message ?? httpErrorMessage(res.status), e?.details);
    // An authenticated request rejected with 401: the session is over (expired, logged out elsewhere, password reset)
    if (res.status === 401 && token && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: err.message }));
    }
    throw err;
  }
  return { data: json.data as T, meta: json.meta };
}

/** Messages for responses that aren't the API's JSON (e.g. nginx refusing a large upload before the API sees it). */
function httpErrorMessage(status: number) {
  if (status === 413) return "Ukuran file terlalu besar untuk diunggah (maksimal 5 MB)";
  if (status === 502 || status === 503 || status === 504) return "Server sedang tidak dapat dihubungi, silakan coba lagi sebentar lagi";
  return `Permintaan gagal (${status})`;
}

/**
 * POST /api/images with upload progress (fetch can't report it). onProgress gets 0-100.
 * Errors are ApiErrors with the API's own message (Bahasa Indonesia), or a clear one when the request
 * never reached the API (connection lost, file too large for the server).
 */
function uploadImage(file: File, altText: string | undefined, onProgress?: (percent: number) => void): Promise<Envelope<ImageFile>> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("image", file);
    if (altText) form.append("altText", altText);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", buildUrl("/images"));
    xhr.setRequestHeader("Accept", "application/json");
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.onerror = () => reject(new ApiError(0, "NETWORK_ERROR", "Koneksi terputus saat mengunggah gambar. Periksa internet Anda lalu coba lagi."));
    xhr.ontimeout = () => reject(new ApiError(0, "TIMEOUT", "Unggahan gambar terlalu lama. Periksa internet Anda lalu coba lagi."));
    xhr.onload = () => {
      let json: { success?: boolean; data?: ImageFile; error?: { code: string; message: string; details?: unknown } } = {};
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        // non-JSON (e.g. nginx 413 page)
      }
      if (xhr.status >= 200 && xhr.status < 300 && json.success !== false && json.data) {
        onProgress?.(100);
        resolve({ data: json.data });
        return;
      }
      const e = json.error;
      const err = new ApiError(xhr.status, e?.code ?? `HTTP_${xhr.status}`, e?.message ?? httpErrorMessage(xhr.status), e?.details);
      if (xhr.status === 401 && token) window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: err.message }));
      reject(err);
    };
    xhr.send(form);
  });
}

const get = <T>(path: string, query?: Query, anonymous = false) => request<T>("GET", path, { query, anonymous });
const post = <T>(path: string, body?: unknown, anonymous = false) => request<T>("POST", path, { body, anonymous });
const patch = <T>(path: string, body?: unknown, query?: Query) => request<T>("PATCH", path, { body, query });
const del = <T>(path: string) => request<T>("DELETE", path);

export interface Paged {
  page?: number;
  limit?: number;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
  tenantName?: string;
}

export type ProductInput = {
  name: string;
  description: string;
  details: string;
  /** Rupiah, whole numbers */
  price: number;
  categoryId: number;
  imageId: number;
};

export type TenantInput = {
  name?: string;
  description: string;
  address: string;
  area: string;
  operationalHours: string;
  fbLink: string;
  whatsappLink: string;
  gmapsLink: string;
  /** Optional: null (or empty) = no link */
  instagramLink?: string | null;
  googleBusinessLink?: string | null;
  shopeeLink?: string | null;
  logoId: number;
};

export type CategoryInput = {
  name: string;
  /** Required on create (upload it first); an update can replace it but not remove it */
  imageId: number;
};

/** One function per endpoint in the API docs. */
export const api = {
  health: () => get<{ status: string }>("/health", undefined, true),

  auth: {
    login: (email: string, password: string) => post<LoginResult>("/auth/login", { email, password }, true),
    logout: () => post<{ message: string }>("/auth/logout"),
    /** superadmin only: the account is active right away; its email is activated with a link (24 h). */
    registerDisnakertrans: (input: RegisterInput) => post<User>("/auth/register/disnakertrans", input),
    registerAdmin: (input: RegisterInput) => post<User>("/auth/register/admin", input, true),
    registerTenant: (input: RegisterInput) => post<User>("/auth/register/tenant", input, true),
    verifyOtp: (userId: string, otp: string) =>
      post<{ message: string; user: User }>(`/auth/verify-otp/${userId}`, { otp }, true),
    resendVerification: (userId: string) =>
      post<{ message: string }>(`/auth/resend-verification/${userId}`, undefined, true),
    forgotPassword: (email: string) => post<{ message: string }>("/auth/forgot-password", { email }, true),
    checkResetLink: (userId: string, token: string) =>
      post<{ valid: boolean; email: string; expiresAt: string }>("/auth/reset-password/check", { userId, token }, true),
    resetPassword: (userId: string, token: string, password: string) =>
      post<{ message: string }>("/auth/reset-password", { userId, token, password }, true),
    me: () => get<User>("/auth/me"),
    updateMe: (changes: Partial<Pick<User, "firstName" | "lastName" | "phoneNumber" | "email" | "tenantName" | "faceImageId">> & {
      password?: string;
      currentPassword?: string;
    }) => patch<User>("/auth/me", changes),
  },

  images: {
    upload: (file: File, altText?: string, onProgress?: (percent: number) => void) => uploadImage(file, altText, onProgress),
    remove: (id: number) => del<null>(`/images/${id}`),
  },

  users: {
    list: (q: Paged & { role?: Role } = {}) => get<User[]>("/users", { page: 1, limit: 20, ...q }),
  },

  approvals: {
    setUser: (userId: string, role: Role, isActive: boolean, reason?: string) =>
      patch<unknown>(`/approvals/${userId}`, { isActive, role, ...(reason ? { reason } : {}) }, { type: "user" }),
    setProduct: (productId: string, isActive: boolean, reason?: string) =>
      patch<unknown>(`/approvals/${productId}`, { isActive, ...(reason ? { reason } : {}) }, { type: "product" }),
  },

  products: {
    list: (q: Paged & { isActive?: boolean; categoryId?: number } = {}) => get<Product[]>("/products", { page: 1, limit: 20, ...q }),
    get: (id: string) => get<Product>(`/products/${id}`),
    create: (input: ProductInput) => post<Product>("/products", input),
    update: (id: string, changes: Partial<ProductInput>) => patch<Product>(`/products/${id}`, changes),
    remove: (id: string) => del<null>(`/products/${id}`),
  },

  landing: {
    categories: () => get<ProductCategory[]>("/landing/categories", undefined, true),
    products: (q: Paged & { recommended?: boolean; tenantId?: string; categoryId?: number; sort?: "newest" | "rating" } = {}) =>
      get<Product[]>("/landing/products", { page: 1, limit: 20, ...q }, true),
    product: (id: string) => get<Product>(`/landing/products/${id}`, undefined, true),
    tenants: (q: Paged & { q?: string } = {}) =>
      get<PublicTenant[]>("/landing/tenants", { page: 1, limit: 20, ...q }, true),
    tenant: (id: string) => get<PublicTenant>(`/landing/tenants/${id}`, undefined, true),
    /** Newest first; meta has ratingAverage and reviewCount */
    reviews: (productId: string, q: Paged = {}) =>
      request<Review[]>("GET", `/landing/products/${productId}/reviews`, { query: { page: 1, limit: 10, ...q }, anonymous: true }) as Promise<{
        data: Review[];
        meta?: PageMeta & RatingSummary;
      }>,
    /** clientId: this browser's id (lib/clientId); turnstileToken: the "not a robot" check */
    addReview: (productId: string, input: { name: string; stars: number; review: string; clientId: string; turnstileToken?: string }) =>
      request<Review>("POST", `/landing/products/${productId}/reviews`, { body: input, anonymous: true }) as Promise<{
        data: Review;
        meta?: RatingSummary;
      }>,
  },

  productCategories: {
    list: (q: Paged = {}) => get<ProductCategory[]>("/product-categories", { page: 1, limit: 100, ...q }),
    get: (id: number) => get<ProductCategory>(`/product-categories/${id}`),
    create: (input: CategoryInput) => post<ProductCategory>("/product-categories", input),
    update: (id: number, changes: Partial<CategoryInput>) => patch<ProductCategory>(`/product-categories/${id}`, changes),
    remove: (id: number) => del<null>(`/product-categories/${id}`),
  },

  reviews: {
    /** Tenant: reviews of their own products (hidden ones too) */
    mine: (q: Paged & { productId?: string } = {}) => get<ModeratedReview[]>("/reviews/mine", { page: 1, limit: 20, ...q }),
    /** Tenant: report a review of their own product */
    report: (id: number, reason: string) => post<ModeratedReview>(`/reviews/${id}/report`, { reason }),
    /** Admin / disnakertrans: reported reviews by status */
    reported: (q: Paged & { status?: ReportStatus | "all" } = {}) => get<ModeratedReview[]>("/reviews", { page: 1, limit: 20, status: "pending", ...q }),
    /** Admin / disnakertrans: hide, keep (a pending report) or show a hidden review again */
    moderate: (id: number, action: "hide" | "keep" | "unhide", note?: string) =>
      patch<ModeratedReview>(`/reviews/${id}/moderation`, { action, ...(note ? { note } : {}) }),
  },

  tenants: {
    mine: () => get<TenantProfile>("/tenants/me"),
    createMine: (input: TenantInput) => post<TenantProfile>("/tenants/me", input),
    updateMine: (changes: Partial<TenantInput>) => patch<TenantProfile>("/tenants/me", changes),
    deleteMine: () => del<null>("/tenants/me"),
    list: (q: Paged = {}) => get<TenantProfile[]>("/tenants", { page: 1, limit: 20, ...q }),
    get: (id: string) => get<TenantProfile>(`/tenants/${id}`),
  },

  notifications: {
    list: (q: Paged & { unread?: boolean } = {}) =>
      get<AppNotification[]>("/notifications", { page: 1, limit: 20, ...q }),
    unreadCount: () => get<{ count: number }>("/notifications/unread-count"),
    markRead: (id: number) => patch<AppNotification>(`/notifications/${id}/read`),
    markAllRead: () => patch<{ updated: number }>("/notifications/read-all"),
    remove: (id: number) => del<null>(`/notifications/${id}`),
  },

  /** superadmin only: request and error logs, newest first. status: an exact code ("404") or a class ("4xx"). */
  logs: {
    list: (
      q: Paged & {
        level?: LogLevel;
        /** success = status < 400, failed = 4xx and 5xx */
        outcome?: "success" | "failed";
        method?: string;
        status?: string;
        path?: string;
        email?: string;
        errorCode?: string;
        userId?: string;
        from?: string;
        to?: string;
      } = {},
    ) => get<ApiLog[]>("/logs", { page: 1, limit: 20, ...q }),
    get: (id: number) => get<ApiLog>(`/logs/${id}`),
    /** Chart numbers for the last `days` days */
    stats: (days = 14) => get<LogStats>("/logs/stats", { days }),
  },

  /** superadmin, disnakertrans, admin: dashboard chart numbers for the last `days` days */
  stats: {
    overview: (days = 30) => get<StatsOverview>("/stats/overview", { days }),
  },
};

/** Fetches every page of a paged endpoint (limit 100 per page), up to `maxPages`. */
export async function fetchAll<T>(
  fetchPage: (page: number) => Promise<Envelope<T[]>>,
  maxPages = 20,
): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const { data, meta } = await fetchPage(page);
    items.push(...data);
    if (!meta || page >= meta.totalPages) break;
  }
  return items;
}
