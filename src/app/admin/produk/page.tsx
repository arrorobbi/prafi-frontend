"use client";

import { ProductBrowser } from "@/components/dashboard/ProductBrowser";
import { PageHeader } from "@/components/ui";

export default function ManageProductsPage() {
  return (
    <>
      <PageHeader title="MANAJEMEN PRODUK" />
      <ProductBrowser detailHref={(p) => `/admin/konfirmasi/${p.id}`} />
    </>
  );
}
