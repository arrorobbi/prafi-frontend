"use client";

import { api, fetchAll } from "./api";
import { productStatus } from "./format";
import type { Role } from "./types";

/** Number of accounts of one role (meta.total of GET /api/users?role=). */
export async function countUsers(role: Role) {
  const { meta, data } = await api.users.list({ role, limit: 1 });
  return meta?.total ?? data.length;
}

/** Product counts per status and the number of shop profiles. */
export async function productAndShopStats() {
  const [products, tenants] = await Promise.all([
    fetchAll((page) => api.products.list({ page, limit: 100 })),
    api.tenants.list({ limit: 1 }),
  ]);
  const by = (s: ReturnType<typeof productStatus>) => products.filter((p) => productStatus(p) === s).length;
  return {
    products: products.length,
    active: by("active"),
    pending: by("pending"),
    rejected: by("rejected"),
    inactive: by("inactive"),
    shops: tenants.meta?.total ?? tenants.data.length,
  };
}
