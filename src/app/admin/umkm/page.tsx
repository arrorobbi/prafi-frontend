"use client";

import { useState } from "react";
import { TenantProfiles } from "@/components/dashboard/TenantProfiles";
import { UserAccounts } from "@/components/dashboard/UserAccounts";
import { PageHeader } from "@/components/ui";
import { PillTabs } from "@/components/dashboard/PillTabs";

/** Seller accounts (GET /api/users, activate/deactivate) and their shop profiles (GET /api/tenants). */
export default function ManageSellersPage() {
  const [tab, setTab] = useState<"accounts" | "profiles">("accounts");
  return (
    <>
      <PageHeader title="MANAJEMEN UMKM" />
      <PillTabs
        label="Data UMKM"
        value={tab}
        onChange={setTab}
        items={[
          { value: "accounts", label: "Akun Penjual" },
          { value: "profiles", label: "Profil Toko" },
        ]}
      />
      {tab === "accounts" ? <UserAccounts role="tenant" approvable noun="akun penjual" /> : <TenantProfiles />}
    </>
  );
}
