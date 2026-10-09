import Link from "next/link";
import { formatDate, formatTime, fullName } from "@/lib/format";
import type { ModeratedReview, ReportStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Stars } from "../Stars";
import { Badge } from "../shadcn/badge";
import { cardClassName } from "../shadcn/card";

const STATUS: Record<ReportStatus, { label: string; variant: "pending" | "active" | "rejected" }> = {
  pending: { label: "Dilaporkan · menunggu keputusan", variant: "pending" },
  kept: { label: "Tetap ditampilkan", variant: "active" },
  hidden: { label: "Disembunyikan", variant: "rejected" },
};

/** The report status of a review (nothing when it was never reported and is visible) */
export function ReviewStatusBadge({ review }: { review: ModeratedReview }) {
  const status = review.isHidden ? "hidden" : review.reportStatus;
  if (!status) return null;
  const { label, variant } = STATUS[status];
  return <Badge variant={variant}>{label}</Badge>;
}

const when = (iso?: string | null) => (iso ? `${formatDate(iso)} ${formatTime(iso)}` : "-");

/**
 * One review in the dashboards (seller's Ulasan Produk, admin / disnakertrans Laporan Ulasan): the product, the review,
 * the report and the decision. `actions`: the buttons for this page.
 */
export function ReviewCard({ review, showSeller, actions }: { review: ModeratedReview; showSeller?: boolean; actions?: React.ReactNode }) {
  const seller = review.product?.tenant;
  return (
    <article className={cn(cardClassName, "flex flex-col gap-3 p-5 max-[480px]:p-4", review.isHidden && "opacity-80")}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {review.product && (
            <Link href={`/produk/${review.product.id}#ulasan`} target="_blank" className="font-semibold text-brand-navy hover:underline">
              {review.product.name}
            </Link>
          )}
          {showSeller && seller && <p className="text-[0.8rem] text-muted-foreground">Penjual: {seller.tenantName || fullName(seller)}</p>}
        </div>
        <ReviewStatusBadge review={review} />
      </header>

      <div className="rounded-xl bg-[#f4f5f7] p-3.5">
        <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <strong className="text-[0.92rem]">{review.name}</strong>
          <Stars value={review.stars} size="sm" />
          <span className="text-[0.78rem] text-muted-foreground">{when(review.createdAt)}</span>
        </div>
        <p className="text-[0.92rem] whitespace-pre-line [overflow-wrap:anywhere]">{review.review}</p>
      </div>

      {review.reportStatus && (
        <dl className="grid gap-1.5 text-[0.85rem]">
          <div>
            <dt className="inline font-semibold">Alasan laporan: </dt>
            <dd className="inline [overflow-wrap:anywhere]">{review.reportReason || "-"}</dd>
            <span className="text-muted-foreground">
              {" "}
              · {when(review.reportedAt)}
              {showSeller && review.reporter ? ` · oleh ${review.reporter.tenantName || fullName(review.reporter)}` : ""}
            </span>
          </div>
          {review.moderatedAt && (
            <div>
              <dt className="inline font-semibold">Keputusan: </dt>
              <dd className="inline">
                {review.isHidden ? "disembunyikan" : "tetap ditampilkan"}
                {review.moderationNote ? ` — "${review.moderationNote}"` : ""}
              </dd>
              <span className="text-muted-foreground">
                {" "}
                · {when(review.moderatedAt)}
                {review.moderator ? ` · ${fullName(review.moderator)}` : ""}
              </span>
            </div>
          )}
        </dl>
      )}

      {actions && <div className="flex flex-wrap justify-end gap-2 max-[480px]:[&>*]:flex-1">{actions}</div>}
    </article>
  );
}
