"use client";

import { GuideManager } from "@/components/dashboard/GuideManager";
import { PageHeader } from "@/components/ui";

/** The Panduan (help pages): topics, steps and their desktop / HP pictures. */
export default function ManageGuidesPage() {
  return (
    <>
      <PageHeader title="KELOLA PANDUAN" />
      <GuideManager />
    </>
  );
}
