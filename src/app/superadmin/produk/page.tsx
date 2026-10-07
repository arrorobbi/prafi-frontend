"use client";

import { ProductBrowser } from "@/components/dashboard/ProductBrowser";
import { PageHeader } from "@/components/ui";

/** Read-only: only admins approve products. */
export default function ProductsPage() {
  return (
    <>
      <PageHeader title="DATA PRODUK" />
      <ProductBrowser />
    </>
  );
}
