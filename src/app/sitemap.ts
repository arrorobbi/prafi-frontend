import type { MetadataRoute } from "next";
import { abs } from "@/lib/seo";
import { getAllLandingProducts, getLandingCategories, getLandingTenants } from "@/lib/server-api";
import { categoryPath, productPath, tenantPath } from "@/lib/format";

/** Rebuilt at most once an hour (and at once when the backend reports a public change, like the other pages) */
export const revalidate = 3600;

/**
 * /sitemap.xml: every page worth finding: the fixed pages, each product category's list, every approved product and
 * every public UMKM. If the API is down, the fixed pages are still listed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ products }, { tenants }, { categories }] = await Promise.all([getAllLandingProducts(), getLandingTenants(), getLandingCategories()]);
  const newest = (dates: string[]) => (dates.length ? new Date(dates.reduce((a, b) => (a > b ? a : b))) : new Date());

  return [
    { url: abs("/"), lastModified: newest(products.map((p) => p.updatedAt)), changeFrequency: "daily", priority: 1 },
    { url: abs("/produk"), lastModified: newest(products.map((p) => p.updatedAt)), changeFrequency: "daily", priority: 0.9 },
    { url: abs("/umkm"), lastModified: newest(tenants.map((t) => t.updatedAt)), changeFrequency: "weekly", priority: 0.8 },
    { url: abs("/panduan"), changeFrequency: "monthly", priority: 0.4 },
    { url: abs("/register"), changeFrequency: "yearly", priority: 0.3 },
    ...categories
      .filter((c) => c.productCount > 0)
      .map((c) => ({ url: abs(categoryPath(c)), changeFrequency: "daily" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: abs(productPath(p)), lastModified: new Date(p.updatedAt), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...tenants.map((t) => ({ url: abs(tenantPath(t)), lastModified: new Date(t.updatedAt), changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
