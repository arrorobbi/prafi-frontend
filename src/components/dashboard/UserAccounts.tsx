"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { formatDate, fullName } from "@/lib/format";
import type { Role, User } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { ConfirmDialog } from "../Modal";
import { useToast } from "../Toast";
import { EmptyState, Loading, Pagination } from "../ui";
import styles from "./dashboard.module.css";
import { Button, buttonVariants } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Badge } from "@/components/shadcn/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { Alert } from "@/components/shadcn/alert";
import { PillTabs } from "./PillTabs";

const LIMIT = 10;

export const ROLE_LABEL: Record<Role, string> = {
  superadmin: "Superadmin",
  disnakertrans: "Disnakertrans",
  admin: "Admin",
  tenant: "Penjual",
};

/** Account status from approval + reason (admins wait for a disnakertrans after sign-up). */
function accountStatus(u: User) {
  if (u.approval?.isActive) return { label: "Aktif", variant: "active" as const };
  if (!u.approval || u.approval.reason?.startsWith("Waiting")) return { label: "Menunggu Aktivasi", variant: "pending" as const };
  return { label: "Nonaktif", variant: "inactive" as const };
}

/**
 * Accounts from GET /api/users (the API limits what each role sees). With `approvable`, each row can be
 * activated/deactivated (PATCH /api/approvals/:id?type=user). With `canResend`, unverified accounts can get a
 * new verification email.
 */
export function UserAccounts({
  role,
  roleTabs,
  approvable = false,
  canResend = false,
  noun = "akun",
  reloadKey = 0,
}: {
  role?: Role;
  roleTabs?: Role[];
  approvable?: boolean;
  canResend?: boolean;
  noun?: string;
  reloadKey?: number;
}) {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<Role | "">(role ?? "");
  const [target, setTarget] = useState<User | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useAsync(
    () => api.users.list({ page, limit: LIMIT, ...(tab ? { role: tab } : {}) }),
    [page, tab, reloadKey],
  );

  const selectTab = (r: Role | "") => {
    setTab(r);
    setPage(1);
  };
  const active = target?.approval?.isActive === true;
  const showTenant = tab === "tenant" || !tab;
  const showRole = !!roleTabs;

  const toggle = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await api.approvals.setUser(target.id, target.role, !active, reason.trim() || undefined);
      toast.success(active ? "Akun dinonaktifkan" : "Akun diaktifkan");
      setTarget(null);
      reload();
    } catch (err) {
      toast.error("Gagal", errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const resend = async (u: User) => {
    try {
      const { data: r } = await api.auth.resendVerification(u.id);
      toast.success("Email verifikasi dikirim ulang", r.message);
    } catch (err) {
      toast.error("Gagal mengirim ulang", errorMessage(err));
    }
  };

  return (
    <>
      {roleTabs && (
        <PillTabs<Role | "">
          label="Role akun"
          value={tab}
          onChange={selectTab}
          items={[{ value: "", label: "Semua" }, ...roleTabs.map((r) => ({ value: r, label: ROLE_LABEL[r] }))]}
        />
      )}
      <div className={styles.panel}>
        {loading && !data ? (
          <Loading />
        ) : error ? (
          <Alert variant="destructive">{error}</Alert>
        ) : data!.data.length === 0 ? (
          <EmptyState title={`Belum ada ${noun}`} />
        ) : (
          <>
            <div className="table-wrap">
              <Table className="table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    {showRole && <TableHead>Role</TableHead>}
                    {showTenant && <TableHead>Nama Toko</TableHead>}
                    <TableHead>Email</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Terdaftar</TableHead>
                    <TableHead>Verifikasi</TableHead>
                    <TableHead>Status</TableHead>
                    {(approvable || canResend) && <TableHead className="col-actions">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data!.data.map((u) => {
                    const status = accountStatus(u);
                    return (
                      <TableRow key={u.id}>
                        <TableCell data-label="Nama">{fullName(u)}</TableCell>
                        {showRole && <TableCell data-label="Role">{ROLE_LABEL[u.role]}</TableCell>}
                        {showTenant && <TableCell data-label="Nama Toko">{u.tenantName ?? "-"}</TableCell>}
                        <TableCell data-label="Email" className={styles.wrap}>
                          {u.email}
                        </TableCell>
                        <TableCell data-label="Telepon">{u.phoneNumber}</TableCell>
                        <TableCell data-label="Terdaftar">{formatDate(u.createdAt)}</TableCell>
                        <TableCell data-label="Verifikasi">
                          <Badge variant={u.mailActive ? "active" : "pending"}>
                            {u.mailActive ? "Terverifikasi" : "Belum"}
                          </Badge>
                        </TableCell>
                        <TableCell data-label="Status">
                          <Badge variant={status.variant}>{status.label}</Badge>
                          {u.approval?.reason && !u.approval.reason.startsWith("Waiting") && !/^(Activ|Deactiv)ated|^Active on/.test(u.approval.reason) && (
                            <small className={styles.note}>
                              {u.approval.reason}
                            </small>
                          )}
                        </TableCell>
                        {(approvable || canResend) && (
                          <TableCell data-label="">
                            <span className="actions">
                              {approvable && (
                                <button
                                  type="button"
                                  className={buttonVariants({ size: "sm", variant: u.approval?.isActive ? "red" : "green" })}
                                  onClick={() => {
                                    setReason("");
                                    setTarget(u);
                                  }}
                                >
                                  {u.approval?.isActive ? "Nonaktifkan" : "Aktifkan"}
                                </button>
                              )}
                              {canResend && !u.mailActive && (
                                <Button type="button" variant="blue" size="sm" onClick={() => resend(u)}>
                                  Kirim Ulang Verifikasi
                                </Button>
                              )}
                            </span>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <Pagination
              page={page}
              totalPages={data!.meta?.totalPages ?? 1}
              total={data!.meta?.total ?? data!.data.length}
              shown={data!.data.length}
              noun={noun}
              onChange={setPage}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!target}
        title={active ? `Nonaktifkan Akun ${target ? ROLE_LABEL[target.role] : ""}` : `Aktifkan Akun ${target ? ROLE_LABEL[target.role] : ""}`}
        danger={active}
        busy={busy}
        confirmLabel={active ? "Nonaktifkan" : "Aktifkan"}
        message={
          <div className="stack">
            <p>
              {active
                ? "Pengguna tidak akan bisa login dan sesi yang sedang berjalan akan diakhiri."
                : "Pengguna akan dapat login dan menggunakan panelnya."}{" "}
              Akun: <strong>{target?.tenantName || fullName(target)}</strong> ({target?.email})
            </p>
            {target && !target.mailActive && !active && (
              <Alert variant="warning">Email akun ini belum diverifikasi; pengguna tetap harus memverifikasi email sebelum bisa login.</Alert>
            )}
            <label className="field">
              <span className="label">Alasan (opsional)</span>
              <Input value={reason} maxLength={255} onChange={(e) => setReason(e.target.value)} />
            </label>
          </div>
        }
        onConfirm={toggle}
        onClose={() => setTarget(null)}
      />
    </>
  );
}
