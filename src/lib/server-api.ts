import type { PageMeta, Product } from "./types";

/** Server components call the backend directly (no proxy, no CORS). */
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.transniaga.manokwarikab.go.id").replace(/\/+$/, "");

const EMPTY_META: PageMeta = { page: 1, limit: 0, total: 0, totalPages: 0 };

/** Public landing products (approved only). Never throws: the landing page still renders if the API is down. */
export async function getLandingProducts(page = 1, limit = 20): Promise<{ products: Product[]; meta: PageMeta; failed: boolean }> {
  try {
    const res = await fetch(`${API_URL}/api/landing/products?page=${page}&limit=${limit}`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
    return { products: json.data as Product[], meta: json.meta as PageMeta, failed: false };
  } catch {
    return { products: [], meta: EMPTY_META, failed: true };
  }
}

/** Every approved product (the public API has no search or detail endpoint, so pages filter this list). */
export async function getAllLandingProducts(maxPages = 10) {
  const first = await getLandingProducts(1, 100);
  const products = [...first.products];
  for (let page = 2; page <= Math.min(first.meta.totalPages, maxPages); page++) {
    products.push(...(await getLandingProducts(page, 100)).products);
  }
  return { products, failed: first.failed };
}
