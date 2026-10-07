"use client";

import { UserAccounts } from "@/components/dashboard/UserAccounts";
import { IconWarning } from "@/components/Icons";
import { PageHeader } from "@/components/ui";

/** Admin accounts: a new admin can log in only after a disnakertrans activates it. */
export default function AdminActivationPage() {
  return (
    <>
      <PageHeader title="AKTIVASI ADMIN" />
      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        <IconWarning />
        <span>
          Admin yang mendaftar sendiri baru bisa login setelah diaktifkan di sini. Pastikan identitas admin sudah
          diperiksa sebelum mengaktifkan. Menonaktifkan akun langsung mengakhiri sesi login admin tersebut.
        </span>
      </div>
      <UserAccounts role="admin" approvable noun="akun admin" />
    </>
  );
}
