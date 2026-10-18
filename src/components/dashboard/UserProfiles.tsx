"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { formatDate, formatTime, fullName, imageSrc, tenantPath } from "@/lib/format";
import type { ApiLog, Role, User } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { IconChevronDown, IconSearch } from "../Icons";
import { EmptyState, Loading, Pagination, Thumb } from "../ui";
import { EmailIssueNote } from "./EmailIssueNote";
import { PillTabs } from "./PillTabs";
import { ROLE_LABEL } from "./UserAccounts";
import styles from "./dashboard.module.css";
import local from "./UserProfiles.module.css";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Alert } from "@/components/shadcn/alert";

const LIMIT = 8;
const LOG_LIMIT = 10;
const ROLES: Role[] = ["superadmin", "disnakertrans", "admin", "tenant"];
const when = (iso?: string | null) => (iso ? `${formatDate(iso)} ${formatTime(iso)}` : "-");
const isLink = (v?: string | null): v is string => !!v && v !== "-";

function accountStatus(u: User) {
  if (u.approval?.isActive) return { label: "Aktif", variant: "active" as const };
  if (!u.approval || u.approval.reason?.startsWith("Waiting")) return { label: "Menunggu Aktivasi", variant: "pending" as const };
  return { label: "Nonaktif", variant: "inactive" as const };
}

function statusVariant(code: number) {
  if (code >= 500) return "rejected" as const;
  if (code >= 400) return "pending" as const;
  return "active" as const;
}

/**
 * Superadmin "Profil Pengguna": one card per account with its user data, its shop profile (sellers) and its API
 * log (GET /api/logs?email=…&emailExact=true: what it did signed in, plus logins / sign-up with that email).
 */
export function UserProfiles() {
  const [tab, setTab] = useState<Role | "">("");
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const { data, loading, error } = useAsync(
    () => api.users.list({ page, limit: LIMIT, ...(tab ? { role: tab } : {}), ...(query ? { q: query } : {}) }),
    [page, tab, query],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(draft.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [draft]);

  return (
    <>
      <PillTabs<Role | "">
        label="Role akun"
        value={tab}
        onChange={(r) => {
          setTab(r);
          setPage(1);
        }}
        items={[{ value: "", label: "Semua" }, ...ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))]}
      />
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className="sr-only">Cari pengguna</span>
          <input placeholder="Cari nama, email, telepon, toko" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <IconSearch />
        </label>
      </div>
      {loading && !data ? (
        <div className={styles.panel}>
          <Loading />
        </div>
      ) : error ? (
        <Alert variant="destructive">{error}</Alert>
      ) : data!.data.length === 0 ? (
        <div className={styles.panel}>
          <EmptyState title={query ? "Tidak ada pengguna yang cocok" : "Belum ada pengguna"} />
        </div>
      ) : (
        <>
          <div className={local.list}>
            {data!.data.map((u) => (
              <UserCard key={u.id} user={u} />
            ))}
          </div>
          <div className={local.pager}>
            <Pagination
              page={page}
              totalPages={data!.meta?.totalPages ?? 1}
              total={data!.meta?.total ?? data!.data.length}
              shown={data!.data.length}
              noun="pengguna"
              onChange={setPage}
            />
          </div>
        </>
      )}
    </>
  );
}

function UserCard({ user: u }: { user: User }) {
  const [showLog, setShowLog] = useState(false);
  const status = accountStatus(u);
  const t = u.tenant;
  return (
    <article className={local.card}>
      <header className={local.head}>
        <Thumb zoom src={imageSrc(u.faceImage)} alt={`Foto ${fullName(u)}`} className={local.face} />
        <div className={local.title}>
          <h2>{fullName(u)}</h2>
          <span className={local.badges}>
            <Badge variant="outline">{ROLE_LABEL[u.role]}</Badge>
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant={u.mailActive ? "active" : "pending"}>{u.mailActive ? "Email Terverifikasi" : "Email Belum Verifikasi"}</Badge>
          </span>
        </div>
      </header>

      <div className={local.body}>
        <section>
          <h3>Data Akun</h3>
          <dl className={local.facts}>
            <dt>Email</dt>
            <dd>
              {u.email}
              <EmailIssueNote issue={u.emailIssue} detail={u.emailIssueDetail} at={u.emailIssueAt} full />
            </dd>
            <dt>Telepon</dt>
            <dd>{u.phoneNumber}</dd>
            {u.role === "tenant" && (
              <>
                <dt>Nama Toko (akun)</dt>
                <dd>{u.tenantName ?? "-"}</dd>
              </>
            )}
            <dt>Terdaftar</dt>
            <dd>{when(u.createdAt)}</dd>
            <dt>Diperbarui</dt>
            <dd>{when(u.updatedAt)}</dd>
            {u.approval?.reason && !/^Waiting|^(Activ|Deactiv)ated|^Active on/.test(u.approval.reason) && (
              <>
                <dt>Catatan Status</dt>
                <dd>{u.approval.reason}</dd>
              </>
            )}
          </dl>
        </section>

        {u.role === "tenant" && (
          <section>
            <h3>Data Toko</h3>
            {t ? (
              <div className={local.shop}>
                <Thumb zoom src={imageSrc(t.logo)} alt={`Logo ${t.name}`} className={local.logo} />
                <dl className={local.facts}>
                  <dt>Nama Toko</dt>
                  <dd>
                    <Link href={tenantPath(t)} target="_blank" className={local.link}>
                      {t.name}
                    </Link>
                  </dd>
                  <dt>Wilayah</dt>
                  <dd>{t.area}</dd>
                  <dt>Alamat</dt>
                  <dd>{t.address}</dd>
                  <dt>Jam Buka</dt>
                  <dd>{t.operationalHours}</dd>
                  <dt>Deskripsi</dt>
                  <dd className={local.clamp}>{t.description}</dd>
                  {[t.whatsappLink, t.gmapsLink, t.fbLink, t.instagramLink, t.shopeeLink, t.googleBusinessLink].some(isLink) && (
                    <>
                      <dt>Tautan</dt>
                      <dd className={local.links}>
                        {(
                          [
                            ["WhatsApp", t.whatsappLink],
                            ["Lokasi", t.gmapsLink],
                            ["Facebook", t.fbLink],
                            ["Instagram", t.instagramLink],
                            ["Shopee", t.shopeeLink],
                            ["Google Bisnis", t.googleBusinessLink],
                          ] as const
                        )
                          .filter(([, href]) => isLink(href))
                          .map(([label, href]) => (
                            <a key={label} href={href!} target="_blank" rel="noreferrer">
                              {label}
                            </a>
                          ))}
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            ) : (
              <p className="muted">Penjual belum membuat profil toko.</p>
            )}
          </section>
        )}
      </div>

      <section className={local.logSection}>
        <button type="button" className={local.logToggle} aria-expanded={showLog} onClick={() => setShowLog((v) => !v)}>
          <span>Log Aktivitas · {u.email}</span>
          <IconChevronDown className={showLog ? local.flip : undefined} />
        </button>
        {showLog && <UserLog email={u.email} />}
      </section>
    </article>
  );
}

/** The newest API requests of one email, LOG_LIMIT at a time ("Muat lebih banyak" adds the next ones). */
function UserLog({ email }: { email: string }) {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setLoading(true);
    api.logs
      .list({ email, emailExact: true, page, limit: LOG_LIMIT })
      .then(({ data, meta }) => {
        if (!live) return;
        setLogs((prev) => (page === 1 ? data : [...prev, ...data]));
        setTotal(meta?.total ?? data.length);
        setError(null);
      })
      .catch((err) => live && setError(errorMessage(err)))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [email, page]);

  if (error) return <Alert variant="destructive">{error}</Alert>;
  if (loading && !logs.length) return <Loading label="Memuat log..." />;
  if (!logs.length) return <p className="muted">Belum ada log untuk email ini.</p>;
  return (
    <>
      <ol className={local.logs}>
        {logs.map((l) => (
          <li key={l.id}>
            <span className={local.logTime}>{when(l.createdAt)}</span>
            <span className={local.logReq}>
              <strong>{l.method}</strong> <code>{l.path}</code>
            </span>
            <Badge variant={statusVariant(l.statusCode)}>{l.statusCode}</Badge>
            {(l.errorMessage || (!l.userEmail && l.authEmail)) && (
              <span className={local.logNote}>
                {[!l.userEmail && l.authEmail ? "Tanpa login" : "", l.errorMessage ?? ""].filter(Boolean).join(" · ")}
              </span>
            )}
          </li>
        ))}
      </ol>
      <div className={local.logFoot}>
        <span className="muted">
          {logs.length} dari {total} log
        </span>
        {logs.length < total && (
          <Button type="button" variant="light" size="sm" disabled={loading} onClick={() => setPage((p) => p + 1)}>
            {loading ? "Memuat..." : "Muat Lebih Banyak"}
          </Button>
        )}
      </div>
    </>
  );
}
