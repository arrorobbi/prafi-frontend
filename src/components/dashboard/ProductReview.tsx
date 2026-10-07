"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { DEACTIVATE_PREFIX, REJECT_PREFIX } from "@/lib/format";
import { Modal } from "../Modal";
import { useToast } from "../Toast";

const MAX_REASON = 255;

/**
 * Admin product decisions (PATCH /api/approvals/:id?type=product). The reason is stored with a
 * prefix so the frontend can tell "rejected" from "deactivated" (see productStatus).
 */
export function useProductReview(onDone: () => void) {
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const run = async (id: string, isActive: boolean, reason: string | undefined, success: string) => {
    setBusyId(id);
    try {
      await api.approvals.setProduct(id, isActive, reason?.slice(0, MAX_REASON));
      toast.success(success);
      onDone();
      return true;
    } catch (err) {
      toast.error("Gagal memproses produk", errorMessage(err));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  return {
    busyId,
    approve: (id: string) => run(id, true, "Disetujui administrator", "Produk disetujui dan tampil di halaman utama"),
    reject: (id: string, reason: string) => run(id, false, `${REJECT_PREFIX}${reason.trim()}`, "Produk ditolak"),
    deactivate: (id: string, reason: string) =>
      run(id, false, `${DEACTIVATE_PREFIX}${reason.trim() || "Diturunkan administrator"}`, "Produk dinonaktifkan"),
  };
}

/** Asks for the rejection / deactivation reason. */
export function ReasonDialog({
  open,
  mode,
  productName,
  busy,
  onSubmit,
  onClose,
}: {
  open: boolean;
  mode: "reject" | "deactivate";
  productName?: string;
  busy?: boolean;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const required = mode === "reject";
  const prefix = mode === "reject" ? REJECT_PREFIX : DEACTIVATE_PREFIX;

  return (
    <Modal
      open={open}
      title={mode === "reject" ? "Tolak Produk" : "Nonaktifkan Produk"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-light" onClick={onClose} disabled={busy}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn-red"
            disabled={busy || (required && !reason.trim())}
            onClick={() => onSubmit(reason)}
          >
            {busy ? "Memproses..." : mode === "reject" ? "Tolak Produk" : "Nonaktifkan"}
          </button>
        </>
      }
    >
      <div className="stack">
        {productName && (
          <p>
            Produk: <strong>{productName}</strong>
          </p>
        )}
        <label className="field">
          <span className="label">{mode === "reject" ? "Alasan Penolakan" : "Alasan (opsional)"}</span>
          <textarea
            className="textarea"
            placeholder={mode === "reject" ? "Tuliskan alasan penolakan produk ini" : "Tuliskan alasan produk dinonaktifkan"}
            maxLength={MAX_REASON - prefix.length}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <span className="hint">Alasan akan terlihat oleh penjual.</span>
        </label>
      </div>
    </Modal>
  );
}
