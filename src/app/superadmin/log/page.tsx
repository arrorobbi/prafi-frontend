"use client";

import { useState } from "react";
import styles from "@/components/dashboard/dashboard.module.css";
import { ROLE_LABEL } from "@/components/dashboard/UserAccounts";
import { Modal } from "@/components/Modal";
import { EmptyState, Loading, PageHeader, Pagination } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate, formatRupiah, formatTime } from "@/lib/format";
import type { ApiLog, LogLevel, LogSummary } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import s from "./log.module.css";

const LIMIT = 20;
/** Only changes are stored (reads are not) */
const METHODS = ["POST", "PATCH", "PUT", "DELETE"];
const EMPTY = { result: "", method: "", status: "", path: "", email: "", from: "", to: "" };

/** The "Hasil" filter → API query (outcome for success/all failures, level for one kind of failure) */
const RESULT_QUERY: Record<string, { outcome?: "success" | "failed"; level?: LogLevel }> = {
  success: { outcome: "success" },
  failed: { outcome: "failed" },
  client: { level: "warn" },
  server: { level: "error" },
};
type Filters = typeof EMPTY;

const LEVEL_LABEL: Record<LogLevel, string> = { info: "Berhasil", warn: "Gagal (permintaan ditolak)", error: "Gagal (kesalahan server)" };

function statusBadge(code: number) {
  if (code >= 500) return "badge badge-rejected";
  if (code >= 400) return "badge badge-pending";
  if (code >= 300) return "badge badge-inactive";
  return "badge badge-active";
}

/** One line for the table: what was created/changed (name, email, price, status), or how many rows a list had */
function summaryLine(s: LogSummary | null) {
  if (!s) return "-";
  if (typeof s.count === "number") return `${s.count} data`;
  const parts: string[] = [];
  const main = s.name ?? s.tenantName ?? (s.firstName ? `${s.firstName} ${s.lastName ?? ""}`.trim() : null) ?? (s.user?.firstName ? `${s.user.firstName} ${s.user.lastName ?? ""}`.trim() : null);
  if (main) parts.push(main);
  const email = s.email ?? s.user?.email;
  if (email) parts.push(email);
  if (typeof s.price === "number") parts.push(formatRupiah(s.price));
  const active = s.isActive ?? s.approval?.isActive;
  if (typeof active === "boolean") parts.push(active ? "Aktif" : "Nonaktif");
  if (!parts.length && s.message) parts.push(s.message);
  return parts.join(" · ") || "-";
}

const when = (iso: string) => `${formatDate(iso)} ${formatTime(iso)}`;
const who = (log: ApiLog) => (log.userEmail ? `${log.userEmail}${log.userRole ? ` (${ROLE_LABEL[log.userRole]})` : ""}` : "Tamu");

/** Request and error logs of the API (GET /api/logs): superadmin only. */
export default function LogsPage() {
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);

  const { data, loading, error, reload } = useAsync(
    () =>
      api.logs.list({
        page,
        limit: LIMIT,
        ...RESULT_QUERY[filters.result],
        method: filters.method,
        status: filters.status.trim(),
        path: filters.path.trim(),
        email: filters.email.trim(),
        from: filters.from,
        to: filters.to,
      }),
    [page, filters],
  );

  const set = (key: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft((f) => ({ ...f, [key]: e.target.value }));

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(draft);
    setPage(1);
  };

  const clear = () => {
    setDraft(EMPTY);
    setFilters(EMPTY);
    setPage(1);
  };

  return (
    <>
      <PageHeader title="LOG API" />
      <p className="muted" style={{ marginBottom: 14 }}>
        Setiap perubahan data (tambah, ubah, hapus) oleh pengguna yang login, baik yang berhasil maupun yang gagal,
        terbaru di atas. Permintaan baca (GET) dan permintaan tamu (login, pendaftaran, ulasan, bot) tidak dicatat. Yang
        disimpan hanya nama field yang dikirim dan ringkasan hasil (mis. nama, email, status), tidak pernah isi password
        atau token.
      </p>

      <form className={s.filters} onSubmit={apply}>
        <label className="field">
          <span className={s.filterLabel}>Hasil</span>
          <select className="select" value={draft.result} onChange={set("result")}>
            <option value="">Semua</option>
            <option value="success">Berhasil</option>
            <option value="failed">Gagal (semua)</option>
            <option value="client">Gagal – permintaan ditolak (4xx)</option>
            <option value="server">Gagal – kesalahan server (5xx)</option>
          </select>
        </label>
        <label className="field">
          <span className={s.filterLabel}>Method</span>
          <select className="select" value={draft.method} onChange={set("method")}>
            <option value="">Semua</option>
            {METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className={s.filterLabel}>Status</span>
          <input className="input" value={draft.status} onChange={set("status")} placeholder="mis. 404 atau 5xx" />
        </label>
        <label className="field">
          <span className={s.filterLabel}>Path</span>
          <input className="input" value={draft.path} onChange={set("path")} placeholder="mis. /api/tenants" />
        </label>
        <label className="field">
          <span className={s.filterLabel}>Email Pengguna</span>
          <input className="input" value={draft.email} onChange={set("email")} placeholder="Cari email" />
        </label>
        <label className="field">
          <span className={s.filterLabel}>Dari Tanggal</span>
          <input className="input" type="date" value={draft.from} onChange={set("from")} />
        </label>
        <label className="field">
          <span className={s.filterLabel}>Sampai Tanggal</span>
          <input className="input" type="date" value={draft.to} onChange={set("to")} />
        </label>
        <div className={s.filterActions}>
          <button type="submit" className="btn btn-navy">
            Terapkan
          </button>
          <button type="button" className="btn btn-light" onClick={clear}>
            Reset
          </button>
        </div>
      </form>

      <div className={styles.panel}>
        <div className={`${styles.toolbar}`}>
          <span className="muted">{data?.meta ? `${data.meta.total} log` : ""}</span>
          <span className={styles.toolbarSpacer} />
          <button type="button" className="btn btn-light btn-sm" onClick={reload} disabled={loading}>
            {loading ? "Memuat..." : "Muat Ulang"}
          </button>
        </div>
        {loading && !data ? (
          <Loading />
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : data!.data.length === 0 ? (
          <EmptyState title="Tidak ada log">Ubah atau reset filter.</EmptyState>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Permintaan</th>
                    <th>Status</th>
                    <th>Durasi</th>
                    <th>Pengguna</th>
                    <th>Hasil</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.data.map((log) => (
                    <tr key={log.id} className={log.statusCode >= 400 ? s.failedRow : undefined}>
                      <td data-label="Waktu">{when(log.createdAt)}</td>
                      <td data-label="Permintaan" className={s.mono}>
                        <span className={s.method}>{log.method}</span> {log.path}
                        {log.query && <span className={s.query}>?{log.query}</span>}
                      </td>
                      <td data-label="Status">
                        <span className={statusBadge(log.statusCode)}>{log.statusCode}</span>
                      </td>
                      <td data-label="Durasi">{log.durationMs} ms</td>
                      <td data-label="Pengguna" className={styles.wrap}>
                        {who(log)}
                      </td>
                      <td data-label="Hasil" className={styles.wrap}>
                        {log.errorCode ? (
                          <span className={s.error}>
                            <strong>{log.errorCode}</strong>
                            <br />
                            {log.errorMessage}
                          </span>
                        ) : (
                          summaryLine(log.responseSummary)
                        )}
                      </td>
                      <td data-label="Aksi">
                        <button type="button" className="btn btn-orange btn-sm" onClick={() => setOpenId(log.id)}>
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={data!.meta?.totalPages ?? 1}
              total={data!.meta?.total ?? 0}
              shown={data!.data.length}
              noun="log"
              onChange={setPage}
            />
          </>
        )}
      </div>

      <LogDetail id={openId} onClose={() => setOpenId(null)} />
    </>
  );
}

/** GET /api/logs/:id: everything about one request, including the stack trace of a 5xx. */
function LogDetail({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { data, loading, error } = useAsync(() => (id ? api.logs.get(id) : Promise.resolve(null)), [id]);
  const log = data?.data;

  return (
    <Modal open={id !== null} title={`Detail Log #${id ?? ""}`} onClose={onClose} wide>
      {loading || (!log && !error) ? (
        <Loading />
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        log && (
          <div className="stack">
            <dl className={s.details}>
              <dt>Waktu</dt>
              <dd>{when(log.createdAt)}</dd>
              <dt>Permintaan</dt>
              <dd className={s.mono}>
                <span className={s.method}>{log.method}</span> {log.path}
                {log.query && `?${log.query}`}
              </dd>
              <dt>Status</dt>
              <dd>
                <span className={statusBadge(log.statusCode)}>{log.statusCode}</span> {LEVEL_LABEL[log.level]}
              </dd>
              <dt>Durasi</dt>
              <dd>{log.durationMs} ms</dd>
              <dt>Pengguna</dt>
              <dd>{who(log)}</dd>
              <dt>IP</dt>
              <dd className={s.mono}>{log.ip ?? "-"}</dd>
              <dt>User Agent</dt>
              <dd className={s.mono}>{log.userAgent ?? "-"}</dd>
              {log.errorCode && (
                <>
                  <dt>Kode Error</dt>
                  <dd className={s.mono}>{log.errorCode}</dd>
                  <dt>Pesan Error</dt>
                  <dd>{log.errorMessage}</dd>
                </>
              )}
            </dl>
            {log.requestFields && log.requestFields.length > 0 && (
              <div>
                <p className={s.filterLabel}>Field yang dikirim (tanpa isi)</p>
                <div className={s.chips}>
                  {log.requestFields.map((f) => (
                    <span key={f} className={s.chip}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {log.responseSummary && (
              <div>
                <p className={s.filterLabel}>Hasil (ringkasan)</p>
                <pre className={s.code}>{JSON.stringify(log.responseSummary, null, 2)}</pre>
              </div>
            )}
            {log.errorDetails != null && (
              <div>
                <p className={s.filterLabel}>Detail Error</p>
                <pre className={s.code}>{JSON.stringify(log.errorDetails, null, 2)}</pre>
              </div>
            )}
            {log.errorStack && (
              <div>
                <p className={s.filterLabel}>Stack Trace (hanya untuk superadmin)</p>
                <pre className={s.code}>{log.errorStack}</pre>
              </div>
            )}
          </div>
        )
      )}
    </Modal>
  );
}
