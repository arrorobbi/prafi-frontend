"use client";

import { useState } from "react";
import styles from "@/components/dashboard/dashboard.module.css";
import { TenantProfiles } from "@/components/dashboard/TenantProfiles";
import { UserAccounts } from "@/components/dashboard/UserAccounts";
import { PageHeader } from "@/components/ui";

/** Seller accounts (GET /api/users, activate/deactivate) and their shop profiles (GET /api/tenants). */
export default function ManageSellersPage() {
  const [tab, setTab] = useState<"accounts" | "profiles">("accounts");
  return (
    <>
      <PageHeader title="MANAJEMEN UMKM" />
      <div className={styles.tabs}>
        <button type="button" className={tab === "accounts" ? styles.tabActive : ""} onClick={() => setTab("accounts")}>
          Akun Penjual
        </button>
        <button type="button" className={tab === "profiles" ? styles.tabActive : ""} onClick={() => setTab("profiles")}>
          Profil Toko
        </button>
      </div>
      {tab === "accounts" ? <UserAccounts role="tenant" approvable noun="akun penjual" /> : <TenantProfiles />}
    </>
  );
}
