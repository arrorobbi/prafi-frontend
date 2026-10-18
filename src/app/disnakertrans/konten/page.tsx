"use client";

import { SiteContentEditor } from "@/components/dashboard/SiteContentEditor";
import { PageHeader } from "@/components/ui";

/** Texts of the public site (the footer's about text). */
export default function SiteContentPage() {
  return (
    <>
      <PageHeader title="KONTEN SITUS" />
      <SiteContentEditor />
    </>
  );
}
