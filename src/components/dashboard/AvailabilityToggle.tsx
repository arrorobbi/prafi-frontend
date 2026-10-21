"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { availabilityLabel } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useToast } from "../Toast";
import local from "./AvailabilityToggle.module.css";

/**
 * The seller's switch between "Tersedia" and "Stok Kosong" (PATCH /api/products/:id { isAvailable }). Out of stock
 * hides the product from the public pages; admins, disnakertrans and the superadmin are notified of every change.
 */
export function AvailabilityToggle({ product, onChanged }: { product: Product; onChanged: (p: Product) => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const on = product.isAvailable !== false;

  const toggle = async () => {
    setBusy(true);
    try {
      const { data } = await api.products.update(product.id, { isAvailable: !on });
      onChanged(data);
      toast.success(
        data.isAvailable ? "Produk tersedia" : "Produk stok kosong",
        data.isAvailable ? `"${data.name}" tampil lagi di halaman utama.` : `"${data.name}" disembunyikan dari halaman utama sampai tersedia lagi.`,
      );
    } catch (err) {
      toast.error("Gagal mengubah ketersediaan", errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`Ketersediaan ${product.name}: ${availabilityLabel(on)}`}
      title={on ? "Klik jika stok habis" : "Klik jika stok sudah ada lagi"}
      className={`${local.switch} ${on ? local.on : local.off}`}
      disabled={busy}
      onClick={toggle}
    >
      <span className={local.knob} aria-hidden />
      <span className={local.text}>{availabilityLabel(on)}</span>
    </button>
  );
}
