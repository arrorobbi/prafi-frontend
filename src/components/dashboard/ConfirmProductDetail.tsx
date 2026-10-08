"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useProductReview } from "./ProductReview";
import styles from "./dashboard.module.css";
import { IconWarning } from "@/components/Icons";
import { Loading, PageHeader, StatusBadge, Thumb } from "@/components/ui";
import { api } from "@/lib/api";
import { approvalReason, DEACTIVATE_PREFIX, formatDate, formatRupiah, imageSrc, productStatus, REJECT_PREFIX, sellerName } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import local from "./ConfirmProductDetail.module.css";
import { Button } from "@/components/shadcn/button";
import { Textarea } from "@/components/shadcn/textarea";
import { Alert } from "@/components/shadcn/alert";

/**
 * Product detail for an approver (admin or disnakertrans): approve, reject (with reason) or take down.
 * `base` is the role's Konfirmasi Produk list, e.g. /admin/konfirmasi.
 */
export function ConfirmProductDetail({ base }: { base: string }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  const { data, loading, error, reload } = useAsync(async () => {
    const { data: product } = await api.products.get(id);
    return { product };
  }, [id]);

  const review = useProductReview(() => reload());

  if (loading && !data) return <Loading />;
  if (error || !data)
    return (
      <>
        <PageHeader title="KONFIRMASI PRODUK" backHref={base} />
        <Alert variant="destructive">{error ?? "Produk tidak ditemukan"}</Alert>
      </>
    );

  const { product } = data;
  const status = productStatus(product);
  const lastReason = approvalReason(product);
  const busy = review.busyId === product.id;
  const max = 255 - Math.max(REJECT_PREFIX.length, DEACTIVATE_PREFIX.length);

  const reject = async () => {
    if (!reason.trim()) {
      setReasonError("Alasan penolakan wajib diisi");
      return;
    }
    setReasonError(null);
    if (await review.reject(product.id, reason)) router.push(base);
  };

  return (
    <>
      <PageHeader title="KONFIRMASI PRODUK" backHref={base} />

      <div className={local.layout}>
        <div className={local.photo}>
          <Thumb src={imageSrc(product.image)} alt={product.name} />
          <StatusBadge status={status} />
        </div>

        <div className="stack">
          <div className="field">
            <span className="label">Nama Produk</span>
            <div className={styles.readonlyBox}>{product.name}</div>
          </div>
          <div className="field">
            <span className="label">Deskripsi Produk</span>
            <div className={styles.readonlyBox}>{product.description}</div>
          </div>
          <div className="field">
            <span className="label">Informasi Produk</span>
            <div className={styles.readonlyBox}>{product.details}</div>
          </div>
          <div className={styles.formGrid}>
            <div className="field">
              <span className="label">Harga</span>
              <div className={styles.readonlyBox}>{formatRupiah(product.price)}</div>
            </div>
            <div className="field">
              <span className="label">Kategori Produk</span>
              <div className={styles.readonlyBox}>{product.category?.name ?? "-"}</div>
            </div>
            <div className="field">
              <span className="label">Tanggal Pengajuan</span>
              <div className={styles.readonlyBox}>{formatDate(product.createdAt)}</div>
            </div>
            <div className="field">
              <span className="label">Penjual</span>
              <div className={styles.readonlyBox}>
                {sellerName(product)}
                {product.tenant?.email ? ` · ${product.tenant.email}` : ""}
              </div>
            </div>
          </div>
        </div>
      </div>

      {lastReason && status !== "active" && (
        <Alert variant="warning" className="mt">
          <IconWarning />
          <span>
            Keputusan sebelumnya: <strong>{lastReason}</strong>
            {status === "pending" && " — produk telah diperbarui penjual dan diajukan ulang."}
          </span>
        </Alert>
      )}

      <label className={`field ${local.reason}`}>
        <span className="label">{status === "active" ? "Alasan Penonaktifan" : "Alasan Penolakan"}</span>
        <Textarea
         
          placeholder={status === "active" ? "Tuliskan alasan produk ini dinonaktifkan (opsional)" : "Tuliskan alasan penolakan produk ini"}
          value={reason}
          maxLength={max}
          onChange={(e) => setReason(e.target.value)}
        />
        {reasonError && <span className="field-error">{reasonError}</span>}
      </label>

      <div className={local.actions}>
        {status === "active" ? (
          <Button
            type="button"
            variant="red" size="lg"
            disabled={busy}
            onClick={async () => {
              if (await review.deactivate(product.id, reason)) setReason("");
            }}
          >
            NONAKTIFKAN PRODUK
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="green" size="lg"
              disabled={busy}
              onClick={async () => {
                if (await review.approve(product.id)) router.push(base);
              }}
            >
              TERIMA PRODUK
            </Button>
            {status !== "rejected" && (
              <Button type="button" variant="red" size="lg" disabled={busy} onClick={reject}>
                TOLAK PRODUK
              </Button>
            )}
          </>
        )}
      </div>
    </>
  );
}
