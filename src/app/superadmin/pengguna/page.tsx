"use client";

import { UserAccounts } from "@/components/dashboard/UserAccounts";
import { PageHeader } from "@/components/ui";

/** Every account (read-only: the superadmin approves nobody). */
export default function UsersPage() {
  return (
    <>
      <PageHeader title="SEMUA PENGGUNA" />
      <UserAccounts roleTabs={["superadmin", "disnakertrans", "admin", "tenant"]} noun="pengguna" />
    </>
  );
}
