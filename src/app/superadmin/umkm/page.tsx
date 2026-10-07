"use client";

import { TenantProfiles } from "@/components/dashboard/TenantProfiles";
import { PageHeader } from "@/components/ui";

export default function ShopsPage() {
  return (
    <>
      <PageHeader title="DATA UMKM" />
      <TenantProfiles />
    </>
  );
}
