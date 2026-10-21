"use client";

import { useState, useSyncExternalStore } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import type { LogStats, StatsOverview } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../shadcn/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "../shadcn/chart";
import { PeriodSelect } from "./PeriodSelect";
import { Loading } from "../ui";
import { ROLE_LABEL } from "./UserAccounts";
import local from "./StatsCharts.module.css";

// ---------- shared pieces ----------

const DAY = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" });
/** "2026-10-08" → "08 Okt" */
const shortDate = (iso: string) => DAY.format(new Date(`${iso}T00:00:00`));
const NUMBER = new Intl.NumberFormat("id-ID");

const PHONE = "(max-width: 640px)";
/** true on phone-width screens: charts use fewer axis labels, slimmer bars and a lower height there */
export function useCompact() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(PHONE);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
}

function ChartCard({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={`flex min-w-0 flex-col gap-4 py-5 ${className ?? ""}`}>
      <CardHeader className="px-5">
        <CardTitle className="text-base font-bold text-brand-navy">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="px-5">{children}</CardContent>
    </Card>
  );
}

function Empty({ children = "Belum ada data pada periode ini." }: { children?: React.ReactNode }) {
  return <p className="grid h-[180px] place-items-center text-center text-sm text-muted-foreground">{children}</p>;
}

function RangePicker({ value, options, onChange }: { value: number; options: number[]; onChange: (d: number) => void }) {
  return <PeriodSelect label="Periode grafik" value={value} onChange={onChange} options={options.map((d) => ({ value: d, label: `${d} hari terakhir` }))} />;
}

function Section({ title, picker, children }: { title: string; picker: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-brand-navy">{title}</h2>
        {picker}
      </div>
      {children}
    </section>
  );
}

/** A coloured dot + name, as in every legend */
function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className={local.swatch}>
      <i style={{ background: color }} aria-hidden />
      {label}
    </span>
  );
}

/** Legend of the time charts: wraps on narrow screens */
function SeriesLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className={local.seriesLegend}>
      {items.map((i) => (
        <Swatch key={i.label} {...i} />
      ))}
    </div>
  );
}

type Slice = { key: string; label: string; value: number; color: string };

/**
 * Donut with the total in the middle and a legend with counts and shares: beside it on wide cards, under it on
 * phones. A thick ring with rounded, slightly separated segments.
 */
function Donut({ slices, unit }: { slices: Slice[]; unit: string }) {
  const shown = slices.filter((s) => s.value > 0);
  const total = shown.reduce((a, s) => a + s.value, 0);
  const config: ChartConfig = Object.fromEntries([["value", { label: unit }], ...shown.map((s) => [s.key, { label: s.label, color: s.color }])]);
  return (
    <div className={local.donut}>
      <ChartContainer config={config} className={`${local.donutChart} aspect-square`}>
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
          <Pie data={shown} dataKey="value" nameKey="key" innerRadius="60%" outerRadius="92%" paddingAngle={shown.length > 1 ? 2 : 0} cornerRadius={6} strokeWidth={0}>
            {shown.map((s) => (
              <Cell key={s.key} fill={s.color} />
            ))}
            <Label
              content={({ viewBox }) =>
                viewBox && "cx" in viewBox ? (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 6} className="fill-foreground text-2xl font-bold">
                      {NUMBER.format(total)}
                    </tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 16} className="fill-muted-foreground text-xs">
                      {unit}
                    </tspan>
                  </text>
                ) : null
              }
            />
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className={local.donutLegend}>
        {shown.map((s) => (
          <li key={s.key}>
            <Swatch color={s.color} label={s.label} />
            <span className={local.num}>
              {NUMBER.format(s.value)}
              <small>{total ? Math.round((s.value / total) * 100) : 0}%</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type BarRow = { label: string; title?: string; parts: { value: number; color: string; name: string }[] };

/**
 * Ranking as a list: name and number on one line, a slim rounded bar under it (segments for stacked values). Reads
 * the same on a phone and a wide screen, however few or many rows there are.
 */
function BarList({ rows, legend }: { rows: BarRow[]; legend?: { color: string; label: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.parts.reduce((a, p) => a + p.value, 0)));
  return (
    <>
      <ul className={local.barList}>
        {rows.map((r) => {
          const total = r.parts.reduce((a, p) => a + p.value, 0);
          return (
            <li key={r.label}>
              <div className={local.barHead}>
                <span className={local.barLabel} title={r.title ?? r.label}>
                  {r.label}
                </span>
                <span className={local.num}>{NUMBER.format(total)}</span>
              </div>
              <div className={local.track} role="img" aria-label={`${r.label}: ${r.parts.map((p) => `${p.value} ${p.name}`).join(", ")}`}>
                <div className={local.fill} style={{ width: `${(total / max) * 100}%` }}>
                  {r.parts
                    .filter((p) => p.value > 0)
                    .map((p) => (
                      <span key={p.name} style={{ flexGrow: p.value, background: p.color }} title={`${p.name}: ${p.value}`} />
                    ))}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {legend && <SeriesLegend items={legend} />}
    </>
  );
}

/** Soft vertical gradient under a line (one <defs> entry per series) */
function Gradient({ id, color }: { id: string; color: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity={0.28} />
      <stop offset="100%" stopColor={color} stopOpacity={0.02} />
    </linearGradient>
  );
}

// ---------- dashboards: products, users ----------

const ACTIVITY = [
  { key: "products", label: "Produk baru", color: "var(--chart-2)" },
  { key: "users", label: "Akun baru", color: "var(--chart-3)" },
  { key: "outOfStock", label: "Ditandai stok kosong", color: "#dc2626" },
  { key: "backInStock", label: "Tersedia kembali", color: "#0ea5a4" },
] as const;
const activityConfig: ChartConfig = Object.fromEntries(ACTIVITY.map((a) => [a.key, { label: a.label, color: a.color }]));

const STATUS_COLORS = { active: "var(--chart-3)", outOfStock: "#f97316", pending: "#f5b700", rejected: "var(--chart-5)", inactive: "#9ca3af" };
const USER_COLORS = { active: "var(--chart-3)", inactive: "var(--chart-2)" };

/**
 * Charts on the superadmin, disnakertrans and admin dashboards (GET /api/stats/overview): activity per day,
 * product status, products per category, accounts per role (only the roles the user may see).
 */
export function DashboardStats() {
  const [days, setDays] = useState(30);
  const compact = useCompact();
  const { data, loading, error } = useAsync(() => api.stats.overview(days), [days]);
  const s: StatsOverview | undefined = data?.data;

  return (
    <Section title="STATISTIK" picker={<RangePicker value={days} options={[7, 30, 90]} onChange={setDays} />}>
      {loading && !s ? (
        <Loading />
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        s && (
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Aktivitas"
              description={`Produk dan akun baru, serta produk yang ditandai stok kosong / tersedia kembali oleh penjual, per hari (${days} hari terakhir)`}
              className="lg:col-span-2"
            >
              {s.perDay.some((d) => ACTIVITY.some((a) => d[a.key])) ? (
                <>
                  <ChartContainer config={activityConfig} className="aspect-auto h-[210px] w-full sm:h-[280px]">
                    <AreaChart data={s.perDay} margin={{ left: 0, right: 8, top: 8 }}>
                      <defs>
                        {ACTIVITY.map((a) => (
                          <Gradient key={a.key} id={`act-${a.key}`} color={a.color} />
                        ))}
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="4 4" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={compact ? 40 : 24} tickFormatter={shortDate} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={compact ? 26 : 34} />
                      <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => shortDate(String(v))} />} />
                      {ACTIVITY.map((a) => (
                        <Area
                          key={a.key}
                          dataKey={a.key}
                          type="monotone"
                          stroke={a.color}
                          fill={`url(#act-${a.key})`}
                          strokeWidth={2.2}
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                      ))}
                    </AreaChart>
                  </ChartContainer>
                  <SeriesLegend items={[...ACTIVITY]} />
                </>
              ) : (
                <Empty />
              )}
            </ChartCard>

            <ChartCard title="Status Produk" description={`${s.products.total} produk`}>
              {s.products.total ? (
                <Donut
                  unit="produk"
                  slices={[
                    // "Aktif" split: approved and in stock (shown to visitors) / approved but "Stok Kosong" (hidden)
                    { key: "active", label: "Aktif · Tersedia", value: s.products.byStatus.active - (s.products.outOfStock?.active ?? 0), color: STATUS_COLORS.active },
                    { key: "outOfStock", label: "Aktif · Stok Kosong", value: s.products.outOfStock?.active ?? 0, color: STATUS_COLORS.outOfStock },
                    { key: "pending", label: "Menunggu", value: s.products.byStatus.pending, color: STATUS_COLORS.pending },
                    { key: "rejected", label: "Ditolak", value: s.products.byStatus.rejected, color: STATUS_COLORS.rejected },
                    { key: "inactive", label: "Dinonaktifkan", value: s.products.byStatus.inactive, color: STATUS_COLORS.inactive },
                  ]}
                />
              ) : (
                <Empty>Belum ada produk.</Empty>
              )}
            </ChartCard>

            <ChartCard title="Produk per Kategori" description={`${s.products.total} produk`}>
              {s.products.byCategory.length ? (
                <BarList rows={s.products.byCategory.map((c) => ({ label: c.name, parts: [{ value: c.count, color: "var(--chart-1)", name: "produk" }] }))} />
              ) : (
                <Empty>Belum ada kategori.</Empty>
              )}
            </ChartCard>

            {s.users.byRole.length > 0 && (
              <ChartCard
                title="Akun per Role"
                description={`${s.users.total} akun ${s.users.roles.map((r) => ROLE_LABEL[r]).join(", ")}`}
                className="lg:col-span-2"
              >
                <BarList
                  rows={s.users.byRole.map((r) => ({
                    label: ROLE_LABEL[r.role],
                    parts: [
                      { value: r.active, color: USER_COLORS.active, name: "aktif" },
                      { value: r.inactive, color: USER_COLORS.inactive, name: "belum / tidak aktif" },
                    ],
                  }))}
                  legend={[
                    { color: USER_COLORS.active, label: "Aktif" },
                    { color: USER_COLORS.inactive, label: "Belum / tidak aktif" },
                  ]}
                />
              </ChartCard>
            )}
          </div>
        )
      )}
    </Section>
  );
}

// ---------- superadmin: API log ----------

const LOG_DAY = [
  { key: "success", label: "Berhasil", color: "var(--chart-3)" },
  { key: "failed", label: "Gagal", color: "var(--chart-5)" },
] as const;
const logDayConfig: ChartConfig = Object.fromEntries(LOG_DAY.map((a) => [a.key, { label: a.label, color: a.color }]));

const METHOD_COLORS: Record<string, string> = {
  POST: "var(--chart-1)",
  PATCH: "var(--chart-2)",
  PUT: "var(--chart-4)",
  DELETE: "var(--chart-5)",
  GET: "#9ca3af",
};

/** Charts on the Log API page (GET /api/logs/stats): per day, by method, busiest endpoints, top errors. */
export function LogStatsCharts({ reloadKey = 0 }: { reloadKey?: number }) {
  const [days, setDays] = useState(14);
  const compact = useCompact();
  const { data, loading, error } = useAsync(() => api.logs.stats(days), [days, reloadKey]);
  const s: LogStats | undefined = data?.data;

  return (
    <Section title="GRAFIK LOG" picker={<RangePicker value={days} options={[7, 14, 30]} onChange={setDays} />}>
      {loading && !s ? (
        <Loading />
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        s && (
          <div className="mb-8 grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Permintaan per Hari"
              description={`${s.total} permintaan: ${s.success} berhasil, ${s.failed} gagal (${days} hari terakhir)`}
              className="lg:col-span-2"
            >
              {s.total ? (
                <>
                  <ChartContainer config={logDayConfig} className="aspect-auto h-[200px] w-full sm:h-[260px]">
                    <BarChart data={s.perDay} margin={{ left: 0, right: 8, top: 8 }} barCategoryGap="28%">
                      <CartesianGrid vertical={false} strokeDasharray="4 4" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={compact ? 36 : 20} tickFormatter={shortDate} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={compact ? 28 : 36} />
                      <ChartTooltip cursor={{ fill: "var(--gray-100)", radius: 6 }} content={<ChartTooltipContent labelFormatter={(v) => shortDate(String(v))} />} />
                      <Bar dataKey="success" stackId="a" fill="var(--color-success)" maxBarSize={compact ? 12 : 22} />
                      <Bar dataKey="failed" stackId="a" fill="var(--color-failed)" maxBarSize={compact ? 12 : 22} radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                  <SeriesLegend items={[...LOG_DAY]} />
                </>
              ) : (
                <Empty />
              )}
            </ChartCard>

            <ChartCard title="Per Method" description={`${s.total} permintaan`}>
              {s.byMethod.length ? (
                <Donut
                  unit="permintaan"
                  slices={s.byMethod.map((m) => ({ key: m.method, label: m.method, value: m.count, color: METHOD_COLORS[m.method] ?? "var(--chart-4)" }))}
                />
              ) : (
                <Empty />
              )}
            </ChartCard>

            <ChartCard title="Error Terbanyak" description="Kode error dan berapa kali terjadi">
              {s.topErrors.length ? (
                <BarList rows={s.topErrors.map((e) => ({ label: e.errorCode, parts: [{ value: e.count, color: "var(--chart-5)", name: "kejadian" }] }))} />
              ) : (
                <Empty>Tidak ada error pada periode ini.</Empty>
              )}
            </ChartCard>

            <ChartCard title="Endpoint Terbanyak" description="Id pada alamat digabung (mis. /api/products/:id)" className="lg:col-span-2">
              {s.topEndpoints.length ? (
                <BarList
                  rows={s.topEndpoints.map((e) => ({
                    label: e.endpoint,
                    parts: [
                      { value: e.count - e.failed, color: "var(--chart-1)", name: "berhasil" },
                      { value: e.failed, color: "var(--chart-5)", name: "gagal" },
                    ],
                  }))}
                  legend={[
                    { color: "var(--chart-1)", label: "Berhasil" },
                    { color: "var(--chart-5)", label: "Gagal" },
                  ]}
                />
              ) : (
                <Empty />
              )}
            </ChartCard>
          </div>
        )
      )}
    </Section>
  );
}
