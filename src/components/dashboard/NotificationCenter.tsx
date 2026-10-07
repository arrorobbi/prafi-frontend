"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { notificationHref, notificationMessage, notificationTitle, notificationTone } from "@/lib/notificationText";
import { useNotifications } from "@/lib/notifications";
import type { AppNotification } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { IconBell, IconCheck, IconClock, IconClose, IconTrash } from "../Icons";
import { useToast } from "../Toast";
import { EmptyState, Loading, PageHeader, Pagination } from "../ui";
import styles from "./NotificationCenter.module.css";

type Tab = "all" | "unread" | "read";
const LIMIT = 10;

const TONE_ICON = {
  pending: IconClock,
  success: IconCheck,
  danger: IconClose,
  info: IconBell,
};

/** Notifications page shared by the admin and tenant dashboards. */
export function NotificationCenter() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { unread, refresh, version } = useNotifications();
  const [tab, setTab] = useState<Tab>("all");
  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useAsync(
    () => api.notifications.list({ page, limit: LIMIT, ...(tab === "unread" ? { unread: true } : {}) }),
    [page, tab, version],
  );

  useEffect(() => setPage(1), [tab]);

  const items = (data?.data ?? []).filter((n) => (tab === "read" ? n.isRead : true));
  const meta = data?.meta;

  const open = async (n: AppNotification) => {
    if (!n.isRead) {
      await api.notifications.markRead(n.id).catch(() => {});
      refresh();
    }
    const href = user ? notificationHref(n, user.role) : null;
    if (href) router.push(href);
    else reload();
  };

  const markAll = async () => {
    try {
      const { data: r } = await api.notifications.markAllRead();
      toast.success("Notifikasi ditandai sudah dibaca", `${r.updated} notifikasi diperbarui`);
      refresh();
      reload();
    } catch (err) {
      toast.error("Gagal", errorMessage(err));
    }
  };

  const remove = async (n: AppNotification) => {
    try {
      await api.notifications.remove(n.id);
      refresh();
      reload();
    } catch (err) {
      toast.error("Gagal menghapus", errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader title="NOTIFIKASI" />
      <div className={styles.bar}>
        <div className={styles.tabs} role="tablist">
          {(
            [
              ["all", "Semua"],
              ["unread", "Belum Dibaca"],
              ["read", "Dibaca"],
            ] as const
          ).map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? styles.tabActive : ""} onClick={() => setTab(key)}>
              {label}
              {key === "unread" && unread > 0 && <b>{unread}</b>}
            </button>
          ))}
        </div>
        <button type="button" className={styles.markAll} onClick={markAll} disabled={unread === 0}>
          Tandai semua sebagai sudah dibaca
        </button>
      </div>

      {loading && !data ? (
        <Loading />
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState title="Tidak ada notifikasi">Notifikasi baru akan muncul di sini.</EmptyState>
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((n) => {
            const tone = notificationTone(n.type);
            const Icon = TONE_ICON[tone];
            return (
              <li key={n.id} className={`${styles.item} ${n.isRead ? "" : styles.unread}`}>
                <span className={styles.dot} aria-label={n.isRead ? "Sudah dibaca" : "Belum dibaca"} />
                <span className={`${styles.icon} ${styles[tone]}`}>
                  <Icon />
                </span>
                <button type="button" className={styles.text} onClick={() => open(n)}>
                  <strong>{notificationTitle(n)}</strong>
                  <span>{notificationMessage(n)}</span>
                </button>
                <div className={styles.meta}>
                  <time dateTime={n.createdAt}>{timeAgo(n.createdAt)}</time>
                  <button type="button" className={styles.delete} aria-label="Hapus notifikasi" onClick={() => remove(n)}>
                    <IconTrash />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} shown={items.length} noun="notifikasi" onChange={setPage} />
      )}
    </>
  );
}
