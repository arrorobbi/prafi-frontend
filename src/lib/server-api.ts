import type { PageMeta, Product, ProductCategory, PublicTenant } from "./types";

/** Server components call the backend directly (no proxy, no CORS). */
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.transniaga.manokwarikab.go.id").replace(/\/+$/, "");

const EMPTY_META: PageMeta = { page: 1, limit: 0, total: 0, totalPages: 0 };

type Query = Record<string, string | number | boolean | undefined>;

/** GET a public endpoint, cached for a minute. Throws on failure; `status` is set for HTTP errors (e.g. 404). */
async function getPublic<T>(path: string, query: Query = {}): Promise<{ data: T; meta?: PageMeta }> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== "") params.set(k, String(v));
  const qs = params.toString();
  const res = await fetch(`${API_URL}/api${path}${qs ? `?${qs}` : ""}`, {
    next: { revalidate: 60 },
    headers: { Accept: "application/json" },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw Object.assign(new Error(json?.error?.message ?? `HTTP ${res.status}`), { status: res.status });
  }
  return { data: json.data as T, meta: json.meta as PageMeta | undefined };
}

const isNotFound = (err: unknown) => (err as { status?: number })?.status === 404;

/**
 * Public landing products (approved only). recommended: only the recommended ones (reviews average 4.8+);
 * tenantId: one owner's products; categoryId: one category; sort: newest (default) or rating.
 * Never throws: pages still render if the API is down.
 */
export async function getLandingProducts(
  page = 1,
  limit = 20,
  filters: { recommended?: boolean; tenantId?: string; categoryId?: number; sort?: "newest" | "rating" } = {},
): Promise<{ products: Product[]; meta: PageMeta; failed: boolean }> {
  try {
    const { data, meta } = await getPublic<Product[]>("/landing/products", { page, limit, ...filters });
    return { products: data, meta: meta ?? EMPTY_META, failed: false };
  } catch {
    return { products: [], meta: EMPTY_META, failed: true };
  }
}

/** Every approved product (the public API has no text search, so the product list page filters this). */
export async function getAllLandingProducts(maxPages = 10) {
  const first = await getLandingProducts(1, 100);
  const products = [...first.products];
  for (let page = 2; page <= Math.min(first.meta.totalPages, maxPages); page++) {
    products.push(...(await getLandingProducts(page, 100)).products);
  }
  return { products, failed: first.failed };
}

/** One approved product; product null when it doesn't exist or isn't approved, failed when the API is down. */
export async function getLandingProduct(id: string): Promise<{ product: Product | null; failed: boolean }> {
  try {
    return { product: (await getPublic<Product>(`/landing/products/${id}`)).data, failed: false };
  } catch (err) {
    return { product: null, failed: !isNotFound(err) };
  }
}

/** Every product category with its image and number of approved products, A→Z. Never throws. */
export async function getLandingCategories(): Promise<{ categories: ProductCategory[]; failed: boolean }> {
  try {
    return { categories: (await getPublic<ProductCategory[]>("/landing/categories")).data, failed: false };
  } catch {
    return { categories: [], failed: true };
  }
}

/** Public UMKM (active owners), A→Z, with productCount and rating. Never throws. */
export async function getLandingTenants(
  filters: { q?: string; page?: number; limit?: number } = {},
): Promise<{ tenants: PublicTenant[]; meta: PageMeta; failed: boolean }> {
  try {
    const { data, meta } = await getPublic<PublicTenant[]>("/landing/tenants", { page: 1, limit: 100, ...filters });
    return { tenants: data, meta: meta ?? EMPTY_META, failed: false };
  } catch {
    return { tenants: [], meta: EMPTY_META, failed: true };
  }
}

/** One UMKM by its profile id or its owner's user id (product.tenant.id). */
export async function getLandingTenant(id: string): Promise<{ tenant: PublicTenant | null; failed: boolean }> {
  try {
    return { tenant: (await getPublic<PublicTenant>(`/landing/tenants/${id}`)).data, failed: false };
  } catch (err) {
    return { tenant: null, failed: !isNotFound(err) };
  }
}
