"use client";

import dynamic from "next/dynamic";
import { Loading, PageHeader } from "@/components/ui";

/** The chart library (Recharts) loads separately, so the page shows right away */
const ServerMonitor = dynamic(() => import("@/components/dashboard/ServerMonitor").then((m) => m.ServerMonitor), {
  ssr: false,
  loading: () => <Loading label="Membaca keadaan server..." />,
});

export default function ServerMonitorPage() {
  return (
    <>
      <PageHeader title="MONITOR SERVER" />
      <ServerMonitor />
    </>
  );
}
