"use client";

import { ProductBrowser } from "@/components/dashboard/ProductBrowser";
import { PageHeader } from "@/components/ui";

/** Every product; opening one leads to its approval page (disnakertrans approve products like admins). */
export default function ProductsPage() {
  return (
    <>
      <PageHeader title="DATA PRODUK" />
      <ProductBrowser detailHref={(p) => `/disnakertrans/konfirmasi/${p.id}`} />
    </>
  );
}
