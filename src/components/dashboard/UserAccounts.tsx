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

const LIMIT = 10;

export const ROLE_LABEL: Record<Role, string> = {
  superadmin: "Superadmin",
  disnakertrans: "Disnakertrans",
  admin: "Admin",
  tenant: "Penjual",
};

/** Account status from approval + reason (admins wait for a disnakertrans after sign-up). */
function accountStatus(u: User) {
  if (u.approval?.isActive) return { label: "Aktif", className: "badge badge-active" };
  if (!u.approval || u.approval.reason?.startsWith("Waiting")) return { label: "Menunggu Aktivasi", className: "badge badge-pending" };
  return { label: "Nonaktif", className: "badge badge-inactive" };
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
        <div className={styles.tabs}>
          <button type="button" className={!tab ? styles.tabActive : ""} onClick={() => selectTab("")}>
            Semua
          </button>
          {roleTabs.map((r) => (
            <button key={r} type="button" className={tab === r ? styles.tabActive : ""} onClick={() => selectTab(r)}>
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      )}
      <div className={styles.panel}>
        {loading && !data ? (
          <Loading />
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : data!.data.length === 0 ? (
          <EmptyState title={`Belum ada ${noun}`} />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    {showRole && <th>Role</th>}
                    {showTenant && <th>Nama Toko</th>}
                    <th>Email</th>
                    <th>Telepon</th>
                    <th>Terdaftar</th>
                    <th>Verifikasi</th>
                    <th>Status</th>
                    {(approvable || canResend) && <th>Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {data!.data.map((u) => {
                    const status = accountStatus(u);
                    return (
                      <tr key={u.id}>
                        <td data-label="Nama">{fullName(u)}</td>
                        {showRole && <td data-label="Role">{ROLE_LABEL[u.role]}</td>}
                        {showTenant && <td data-label="Nama Toko">{u.tenantName ?? "-"}</td>}
                        <td data-label="Email" className={styles.wrap}>
                          {u.email}
                        </td>
                        <td data-label="Telepon">{u.phoneNumber}</td>
                        <td data-label="Terdaftar">{formatDate(u.createdAt)}</td>
                        <td data-label="Verifikasi">
                          <span className={`badge ${u.mailActive ? "badge-active" : "badge-pending"}`}>
                            {u.mailActive ? "Terverifikasi" : "Belum"}
                          </span>
                        </td>
                        <td data-label="Status">
                          <span className={status.className}>{status.label}</span>
                          {u.approval?.reason && !u.approval.reason.startsWith("Waiting") && !/^(Activ|Deactiv)ated|^Active on/.test(u.approval.reason) && (
                            <small className={styles.note}>
                              {u.approval.reason}
                            </small>
                          )}
                        </td>
                        {(approvable || canResend) && (
                          <td data-label="">
                            <span className="actions">
                              {approvable && (
                                <button
                                  type="button"
                                  className={`btn btn-sm ${u.approval?.isActive ? "btn-red" : "btn-green"}`}
                                  onClick={() => {
                                    setReason("");
                                    setTarget(u);
                                  }}
                                >
                                  {u.approval?.isActive ? "Nonaktifkan" : "Aktifkan"}
                                </button>
                              )}
                              {canResend && !u.mailActive && (
                                <button type="button" className="btn btn-blue btn-sm" onClick={() => resend(u)}>
                                  Kirim Ulang Verifikasi
                                </button>
                              )}
                            </span>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
              <div className="alert alert-warning">Email akun ini belum diverifikasi; pengguna tetap harus memverifikasi email sebelum bisa login.</div>
            )}
            <label className="field">
              <span className="label">Alasan (opsional)</span>
              <input className="input" value={reason} maxLength={255} onChange={(e) => setReason(e.target.value)} />
            </label>
          </div>
        }
        onConfirm={toggle}
        onClose={() => setTarget(null)}
      />
    </>
  );
}
