"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import type { ModeratedReview, ReportStatus } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { IconWarning } from "../Icons";
import { Modal } from "../Modal";
import { useToast } from "../Toast";
import { EmptyState, Loading, PageHeader, Pagination } from "../ui";
import { Alert } from "../shadcn/alert";
import { Button } from "../shadcn/button";
import { Textarea } from "../shadcn/textarea";
import { PILL_COUNT, PillTabs } from "./PillTabs";
import { ReviewCard } from "./ReviewCard";

type Tab = ReportStatus | "all";
type Action = "hide" | "keep" | "unhide";

const PER_PAGE = 10;

const ACTION_TEXT: Record<Action, { title: string; confirm: string; done: string; explain: string }> = {
  hide: {
    title: "Sembunyikan Ulasan",
    confirm: "Sembunyikan",
    done: "Ulasan disembunyikan",
    explain: "Ulasan tidak lagi tampil di halaman produk dan tidak dihitung dalam rating maupun rekomendasi. Datanya tetap tersimpan dan dapat ditampilkan kembali.",
  },
  keep: {
    title: "Tetap Tampilkan Ulasan",
    confirm: "Tetap Tampilkan",
    done: "Ulasan tetap ditampilkan",
    explain: "Laporan ditutup dan ulasan tetap tampil. Penjual tidak dapat melaporkan ulasan ini lagi.",
  },
  unhide: {
    title: "Tampilkan Lagi",
    confirm: "Tampilkan Lagi",
    done: "Ulasan ditampilkan kembali",
    explain: "Ulasan kembali tampil dan dihitung lagi dalam rating produk.",
  },
};

/**
 * Admin / disnakertrans: reviews reported by sellers (GET /api/reviews) and the decision (PATCH /api/reviews/:id/moderation):
 * hide (not shown, not counted), keep (stays visible) or show a hidden one again. The seller is notified.
 */
export function ReviewModeration() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("pending");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<{ review: ModeratedReview; action: Action } | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const { data, loading, error, reload } = useAsync(() => api.reviews.reported({ status: tab, page, limit: PER_PAGE }), [tab, page]);
  // The "Menunggu" count on its tab
  const { data: pending, reload: reloadPending } = useAsync(() => api.reviews.reported({ status: "pending", limit: 1 }), []);
  const waiting = pending?.meta?.total ?? 0;

  const open = (review: ModeratedReview, action: Action) => {
    setTarget({ review, action });
    setNote("");
    setDialogError(null);
  };

  const decide = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await api.reviews.moderate(target.review.id, target.action, note.trim() || undefined);
      toast.success(ACTION_TEXT[target.action].done, "Penjual menerima notifikasi keputusan ini.");
      setTarget(null);
      reload();
      reloadPending();
    } catch (err) {
      setDialogError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const actionsFor = (r: ModeratedReview) => {
    if (r.isHidden)
      return (
        <Button type="button" variant="navy" size="sm" onClick={() => open(r, "unhide")}>
          Tampilkan Lagi
        </Button>
      );
    return (
      <>
        {r.reportStatus === "pending" && (
          <Button type="button" variant="green" size="sm" onClick={() => open(r, "keep")}>
            Tetap Tampilkan
          </Button>
        )}
        <Button type="button" variant="red" size="sm" onClick={() => open(r, "hide")}>
          Sembunyikan
        </Button>
      </>
    );
  };

  const reviews = data?.data ?? [];
  const text = target ? ACTION_TEXT[target.action] : null;
  return (
    <>
      <PageHeader title="LAPORAN ULASAN" />
      <Alert variant="info" className="mb-5">
        <IconWarning />
        <span>
          Ulasan yang dilaporkan penjual karena dianggap palsu atau tidak pantas. Periksa isinya, lalu pilih <b>Sembunyikan</b>{" "}
          (tidak tampil dan tidak dihitung dalam rating) atau <b>Tetap Tampilkan</b>. Keputusan dapat diubah kembali, dan
          penjual menerima notifikasi.
        </span>
      </Alert>
      <PillTabs<Tab>
        label="Status laporan"
        value={tab}
        onChange={(t) => {
          setTab(t);
          setPage(1);
        }}
        items={[
          { value: "pending", label: <>Menunggu{waiting > 0 && <b className={PILL_COUNT}>{waiting}</b>}</> },
          { value: "hidden", label: "Disembunyikan" },
          { value: "kept", label: "Dipertahankan" },
          { value: "all", label: "Semua" },
        ]}
      />

      {loading && !data ? (
        <Loading />
      ) : error ? (
        <Alert variant="destructive">{error}</Alert>
      ) : reviews.length === 0 ? (
        <EmptyState title={tab === "pending" ? "Tidak ada laporan yang menunggu" : "Belum ada ulasan di sini"}>
          {tab === "pending" ? "Laporan ulasan baru dari penjual akan muncul di sini." : undefined}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} showSeller actions={actionsFor(r)} />
          ))}
          <Pagination
            page={page}
            totalPages={data?.meta?.totalPages ?? 1}
            total={data?.meta?.total ?? reviews.length}
            shown={reviews.length}
            noun="ulasan"
            onChange={setPage}
          />
        </div>
      )}

      <Modal
        open={!!target}
        title={text?.title ?? ""}
        onClose={() => !busy && setTarget(null)}
        footer={
          <>
            <Button type="button" variant="light" onClick={() => setTarget(null)} disabled={busy}>
              Batal
            </Button>
            <Button type="button" variant={target?.action === "hide" ? "red" : target?.action === "keep" ? "green" : "navy"} onClick={decide} disabled={busy}>
              {busy ? "Menyimpan..." : text?.confirm}
            </Button>
          </>
        }
      >
        {target && text && (
          <div className="flex flex-col gap-3">
            <p className="text-[0.9rem]">{text.explain}</p>
            <blockquote className="rounded-xl bg-[#f4f5f7] p-3 text-[0.9rem] [overflow-wrap:anywhere]">
              <b>{target.review.name}</b> ({target.review.stars} bintang): {target.review.review}
            </blockquote>
            <label className="field">
              <span className="label">Catatan untuk penjual (opsional)</span>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Contoh: ulasan terbukti palsu" />
              <span className="hint">{note.length}/500 karakter</span>
            </label>
            {dialogError && <Alert variant="destructive">{dialogError}</Alert>}
          </div>
        )}
      </Modal>
    </>
  );
}
