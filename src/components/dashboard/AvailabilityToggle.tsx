"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useToast } from "../Toast";
import local from "./AvailabilityToggle.module.css";

const OPTIONS = [
  { value: true, label: "Tersedia", tone: "on" },
  { value: false, label: "Stok Kosong", tone: "off" },
] as const;

/**
 * "Tersedia" | "Stok Kosong" as a two-option segmented control: both states are always readable and one click
 * switches. `pending`: the option being saved (its dot pulses). Used in Produk Saya and in the product form.
 */
export function AvailabilityChoice({
  value,
  onChange,
  label,
  pending = null,
  disabled = false,
  stacked = false,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
  pending?: boolean | null;
  disabled?: boolean;
  /** One option under the other: narrow enough for a table column */
  stacked?: boolean;
}) {
  return (
    <span className={`${local.group} ${stacked ? local.stacked : ""}`} role="radiogroup" aria-label={label} aria-busy={pending !== null}>
      {OPTIONS.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.label}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`${local.option} ${selected ? local[o.tone] : ""}`}
            disabled={disabled || pending !== null}
            onClick={() => o.value !== value && onChange(o.value)}
          >
            <i className={`${local.dot} ${pending === o.value ? local.pulse : ""}`} aria-hidden />
            {o.label}
          </button>
        );
      })}
    </span>
  );
}

/**
 * The seller's availability control in Produk Saya: saves at once (PATCH /api/products/:id { isAvailable }). Out of
 * stock hides the product from the public pages; admins, disnakertrans and the superadmin are notified of every change.
 */
export function AvailabilityToggle({ product, onChanged }: { product: Product; onChanged: (p: Product) => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState<boolean | null>(null);

  const choose = async (value: boolean) => {
    setBusy(value);
    try {
      const { data } = await api.products.update(product.id, { isAvailable: value });
      onChanged(data);
      toast.success(
        data.isAvailable ? "Produk tersedia" : "Produk stok kosong",
        data.isAvailable ? `"${data.name}" tampil lagi di halaman utama.` : `"${data.name}" disembunyikan dari halaman utama sampai tersedia lagi.`,
      );
    } catch (err) {
      toast.error("Gagal mengubah ketersediaan", errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return <AvailabilityChoice stacked value={product.isAvailable !== false} onChange={choose} pending={busy} label={`Ketersediaan ${product.name}`} />;
}
