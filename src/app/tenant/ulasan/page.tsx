"use client";

import { useState } from "react";
import { ReviewCard } from "@/components/dashboard/ReviewCard";
import { IconWarning } from "@/components/Icons";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { EmptyState, Loading, PageHeader, Pagination } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import type { ModeratedReview } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { Alert } from "@/components/shadcn/alert";
import { Button } from "@/components/shadcn/button";
import { Textarea } from "@/components/shadcn/textarea";

const PER_PAGE = 10;

/**
 * The seller's reviews (GET /api/reviews/mine), hidden ones too. A review that looks fake or abusive can be reported
 * once (POST /api/reviews/:id/report); an admin or disnakertrans then hides it or keeps it.
 */
export default function TenantReviewsPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<ModeratedReview | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useAsync(() => api.reviews.mine({ page, limit: PER_PAGE }), [page]);

  const open = (r: ModeratedReview) => {
    setTarget(r);
    setReason("");
    setReasonError(null);
  };

  const send = async () => {
    if (!target) return;
    if (!reason.trim()) return setReasonError("Tuliskan alasan Anda melaporkan ulasan ini");
    setBusy(true);
    try {
      await api.reviews.report(target.id, reason.trim());
      toast.success("Ulasan dilaporkan", "Administrator akan memeriksanya. Anda mendapat notifikasi setelah ada keputusan.");
      setTarget(null);
      reload();
    } catch (err) {
      setReasonError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const reviews = data?.data ?? [];
  return (
    <>
      <PageHeader title="ULASAN PRODUK" />
      <Alert variant="info" className="mb-5">
        <IconWarning />
        <span>
          Ulasan pembeli untuk produk Anda. Jika sebuah ulasan palsu, kasar, atau tidak berkaitan dengan produk, klik{" "}
          <b>Laporkan</b>. Administrator atau Disnakertrans akan memeriksanya; ulasan yang disembunyikan tidak lagi tampil
          dan tidak dihitung dalam rating. Setiap ulasan hanya dapat dilaporkan satu kali.
        </span>
      </Alert>

      {loading && !data ? (
        <Loading />
      ) : error ? (
        <Alert variant="destructive">{error}</Alert>
      ) : reviews.length === 0 ? (
        <EmptyState title="Belum ada ulasan">Ulasan pembeli untuk produk Anda akan tampil di sini.</EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              actions={
                !r.reportStatus && !r.isHidden ? (
                  <Button type="button" variant="red" size="sm" onClick={() => open(r)}>
                    Laporkan
                  </Button>
                ) : undefined
              }
            />
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
        title="Laporkan Ulasan"
        onClose={() => !busy && setTarget(null)}
        footer={
          <>
            <Button type="button" variant="light" onClick={() => setTarget(null)} disabled={busy}>
              Batal
            </Button>
            <Button type="button" variant="red" onClick={send} disabled={busy}>
              {busy ? "Mengirim..." : "Kirim Laporan"}
            </Button>
          </>
        }
      >
        {target && (
          <div className="flex flex-col gap-3">
            <p className="text-[0.9rem]">
              Ulasan dari <b>{target.name}</b> ({target.stars} bintang) untuk <b>{target.product?.name}</b>:
            </p>
            <blockquote className="rounded-xl bg-[#f4f5f7] p-3 text-[0.9rem] [overflow-wrap:anywhere]">{target.review}</blockquote>
            <label className="field">
              <span className="label">Alasan melaporkan</span>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                placeholder="Contoh: pembeli ini tidak pernah memesan; ulasan berisi kata kasar"
              />
              {reasonError && <span className="field-error">{reasonError}</span>}
              <span className="hint">{reason.length}/500 karakter</span>
            </label>
          </div>
        )}
      </Modal>
    </>
  );
}
