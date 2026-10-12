"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui";
import { Card } from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { calculateAdProfit } from "@/lib/adCalculator";
import { cn } from "@/lib/utils";

const FIELDS = [
  { key: "price", label: "Harga Jual Produk per Unit", prefix: "Rp", placeholder: "200.000" },
  { key: "cogs", label: "Modal Produk (COGS + Packing)", prefix: "Rp", placeholder: "120.000" },
  { key: "cpa", label: "Realisasi Biaya Iklan per Sales (CPA Target)", prefix: "Rp", placeholder: "40.000" },
  { key: "units", label: "Estimasi Target Penjualan (Unit/Bulan)", prefix: "Unit", placeholder: "100" },
] as const;

type Key = (typeof FIELDS)[number]["key"];

/** The example the calculator opens with */
const EXAMPLE: Record<Key, string> = { price: "200000", cogs: "120000", cpa: "40000", units: "100" };

const RUPIAH = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const rupiah = (n: number) => RUPIAH.format(n);
const roas = (n: number) => (n > 0 ? `${n.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x` : "-");
/** Green for a profit, red for a loss, neutral at zero */
const tone = (n: number) => (n > 0 ? "text-[#16a34a]" : n < 0 ? "text-destructive" : "text-foreground");

function Result({ title, value, className, valueClassName }: { title: string; value: string; className?: string; valueClassName?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-muted/50 px-4 py-3.5", className)}>
      <div className="mb-1 text-[0.7rem] font-bold tracking-wider text-muted-foreground uppercase">{title}</div>
      <div className={cn("text-lg font-bold [overflow-wrap:anywhere]", valueClassName)}>{value}</div>
    </div>
  );
}

/** Tenant: how much can be spent on ads before a product stops making money (nothing is saved or sent). */
export default function AdCalculatorPage() {
  const [values, setValues] = useState(EXAMPLE);
  const set = (key: Key) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 13) }));

  const num = (key: Key) => Number(values[key]) || 0;
  const r = calculateAdProfit({ price: num("price"), cogs: num("cogs"), cpa: num("cpa"), units: num("units") });

  return (
    <>
      <PageHeader title="KALKULATOR PROFIT & IKLAN" />
      <p className="muted mb-5 max-w-[720px]">
        Hitung batas aman biaya iklan, target ROAS, dan perkiraan profit bersih usaha Anda. Angka yang diisi hanya dihitung
        di perangkat ini dan tidak disimpan.
      </p>

      <div className="grid items-start gap-5 min-[900px]:grid-cols-2">
        <Card className="flex flex-col gap-4 p-6 max-[480px]:p-4">
          {FIELDS.map((f) => (
            <label key={f.key} className="field">
              <span className="label">{f.label}</span>
              <span className="relative block">
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[0.85rem] font-semibold text-muted-foreground">
                  {f.prefix}
                </span>
                <Input
                  inputMode="numeric"
                  autoComplete="off"
                  className={f.prefix === "Unit" ? "pl-14" : "pl-11"}
                  placeholder={f.placeholder}
                  value={values[f.key] ? Number(values[f.key]).toLocaleString("id-ID") : ""}
                  onChange={set(f.key)}
                />
              </span>
            </label>
          ))}
          <button type="button" className="self-start text-[0.85rem] font-semibold text-brand-navy underline" onClick={() => setValues(EXAMPLE)}>
            Kembalikan ke contoh
          </button>
        </Card>

        <Card className="p-6 max-[480px]:p-4" aria-live="polite">
          <div className="grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
            <Result title="Margin Kotor / Unit" value={rupiah(r.marginKotor)} />
            <Result title="Break-Even ROAS" value={roas(r.beRoas)} valueClassName="text-brand-navy" />
            <Result title="Batas Max CPA (BEP)" value={rupiah(r.maxCpa)} />
            <Result title="ROAS Realisasi" value={roas(r.currentRoas)} />
            <Result
              title="Profit Bersih / Unit"
              value={rupiah(r.netProfitUnit)}
              className="col-span-full border-[#bfdbfe] bg-[#eff6ff] dark:border-[#1e3a8a] dark:bg-[#172554]/40"
              valueClassName={tone(r.netProfitUnit)}
            />
            <Result
              title="Total Profit Bersih (Bulanan)"
              value={rupiah(r.totalNetProfit)}
              className="col-span-full border-[#bbf7d0] bg-[#f0fdf4] dark:border-[#14532d] dark:bg-[#052e16]/40"
              valueClassName={cn("text-2xl", tone(r.totalNetProfit))}
            />
          </div>

          <div className="mt-5 border-t border-border pt-4 text-[0.82rem] leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Petunjuk ringkas</strong>
            <ul className="mt-1.5 grid list-disc gap-1 pl-5">
              <li>
                <strong>Break-Even ROAS:</strong> angka ROAS minimal agar iklan tidak rugi.
              </li>
              <li>
                <strong>Batas Max CPA:</strong> biaya iklan per unit maksimal sebelum Anda mengalami rugi.
              </li>
              <li>
                <strong>ROAS Realisasi:</strong> harga jual dibagi biaya iklan per penjualan. Aman bila lebih besar dari Break-Even ROAS.
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </>
  );
}
