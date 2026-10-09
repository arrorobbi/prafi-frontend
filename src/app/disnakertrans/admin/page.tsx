"use client";

import { UserAccounts } from "@/components/dashboard/UserAccounts";
import { IconWarning } from "@/components/Icons";
import { PageHeader } from "@/components/ui";
import { Alert } from "@/components/shadcn/alert";

/** Admin accounts: a new admin can log in only after a disnakertrans activates it. */
export default function AdminActivationPage() {
  return (
    <>
      <PageHeader title="AKTIVASI ADMIN" />
      <Alert variant="info" style={{ marginBottom: 20 }}>
        <IconWarning />
        <span>
          Admin yang mendaftar sendiri baru bisa login setelah diaktifkan di sini; admin tersebut langsung menerima email
          bahwa akunnya sudah aktif (alasan yang Anda isi ikut tercantum sebagai catatan). Pastikan identitas admin sudah
          diperiksa sebelum mengaktifkan. Menonaktifkan akun langsung mengakhiri sesi login admin tersebut.
        </span>
      </Alert>
      <UserAccounts role="admin" approvable noun="akun admin" />
    </>
  );
}
