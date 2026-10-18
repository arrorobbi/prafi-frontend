"use client";

import { GuideList } from "@/components/GuideList";
import { Loading, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { Alert } from "@/components/shadcn/alert";

/** The Panduan topics meant for sellers (edited in "Kelola Panduan"). */
export default function TenantHelpPage() {
  const { data, loading, error } = useAsync(() => api.landing.guides("tenant"), []);
  return (
    <>
      <PageHeader title="BANTUAN & KETENTUAN" />
      {loading && !data ? <Loading /> : error ? <Alert variant="destructive">{error}</Alert> : <GuideList guides={data!.data} />}
    </>
  );
}
