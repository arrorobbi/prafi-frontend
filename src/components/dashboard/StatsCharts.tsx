"use client";

import { useState, useSyncExternalStore } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import type { LogStats, StatsOverview } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../shadcn/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "../shadcn/chart";
import { Button } from "../shadcn/button";
import { IconChevronLeft, IconChevronRight } from "../Icons";
import { Modal } from "../Modal";
import { PeriodSelect } from "./PeriodSelect";
import { Loading } from "../ui";
import { ROLE_LABEL } from "./UserAccounts";
import local from "./StatsCharts.module.css";

// ---------- shared pieces ----------

const DAY = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" });
const LONG_DAY = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
/** "2026-10-08" → "08 Okt" */
const shortDate = (iso: string) => DAY.format(new Date(`${iso}T00:00:00`));
/** "2026-10-08" → "Kamis, 8 Oktober 2026" */
const longDate = (iso: string) => LONG_DAY.format(new Date(`${iso}T00:00:00`));
const NUMBER = new Intl.NumberFormat("id-ID");
const fmt = (n: number) => NUMBER.format(n);
const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "0%");
const avg = (n: number, days: number) => (days ? (n / days).toLocaleString("id-ID", { maximumFractionDigits: n / days < 1 ? 2 : 1 }) : "0");

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

function ChartCard({
  title,
  description,
  children,
  className,
  clickable,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Shows the "click for details" hint */
  clickable?: boolean;
}) {
  return (
    <Card className={`flex min-w-0 flex-col gap-4 py-5 ${className ?? ""}`}>
      <CardHeader className="px-5">
        <CardTitle className="text-base font-bold text-brand-navy">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="px-5">
        {children}
        {clickable && <p className={local.hint}>Klik grafik untuk melihat detail</p>}
      </CardContent>
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

// ---------- the detail popup ----------

type DetailItem = { label: string; value: number; color: string; note?: string; active?: boolean };

/** What a click on a chart opens: a headline number, the breakdown, and optionally the whole list for comparison */
interface Detail {
  title: string;
  subtitle?: string;
  /** The big number and what it counts */
  headline: { value: number; unit: string };
  /** One line per series / part, with a bar of its share of the headline */
  items: DetailItem[];
  /** Small facts under the breakdown, e.g. "Rata-rata per hari: 1,3" */
  facts?: { label: string; value: string }[];
  /** All entries of the chart, the clicked one highlighted */
  list?: { title: string; items: DetailItem[] };
  /** Step to the neighbouring day / entry */
  prev?: () => void;
  next?: () => void;
}

function DetailModal({ detail, onClose }: { detail: Detail | null; onClose: () => void }) {
  const d = detail;
  const listMax = Math.max(1, ...(d?.list?.items.map((i) => i.value) ?? [0]));
  return (
    <Modal
      open={!!d}
      title={d?.title ?? ""}
      onClose={onClose}
      footer={
        d && (d.prev || d.next) ? (
          <div className={local.detailNav}>
            <Button type="button" variant="light" size="sm" disabled={!d.prev} onClick={d.prev}>
              <IconChevronLeft /> Sebelumnya
            </Button>
            <Button type="button" variant="light" size="sm" disabled={!d.next} onClick={d.next}>
              Berikutnya <IconChevronRight />
            </Button>
          </div>
        ) : undefined
      }
    >
      {d && (
        <div className={local.detail}>
          {d.subtitle && <p className={local.detailSub}>{d.subtitle}</p>}
          <div className={local.headline}>
            <strong>{fmt(d.headline.value)}</strong>
            <span>{d.headline.unit}</span>
          </div>
          {d.items.length > 0 && (
            <ul className={local.detailItems}>
              {d.items.map((i) => (
                <li key={i.label}>
                  <div className={local.detailRow}>
                    <Swatch color={i.color} label={i.label} />
                    <span className={local.num}>
                      {fmt(i.value)}
                      <small>{pct(i.value, d.headline.value)}</small>
                    </span>
                  </div>
                  <div className={local.track}>
                    <div className={local.fill} style={{ width: pct(i.value, d.headline.value), background: i.color }} />
                  </div>
                  {i.note && <p className={local.detailNote}>{i.note}</p>}
                </li>
              ))}
            </ul>
          )}
          {d.facts && d.facts.length > 0 && (
            <dl className={local.facts}>
              {d.facts.map((f) => (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {d.list && (
            <div className={local.compare}>
              <p className={local.compareTitle}>{d.list.title}</p>
              <ul>
                {d.list.items.map((i) => (
                  <li key={i.label} className={i.active ? local.compareActive : undefined}>
                    <span className={local.compareLabel} title={i.label}>
                      {i.label}
                    </span>
                    <span className={local.compareBar}>
                      <i style={{ width: `${(i.value / listMax) * 100}%`, background: i.color }} />
                    </span>
                    <span className={local.num}>{fmt(i.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ---------- chart building blocks ----------

type Slice = { key: string; label: string; value: number; color: string };

/**
 * Donut with the total in the middle and a legend with counts and shares: beside it on wide cards, under it on
 * phones. A click on a slice or a legend row opens its details.
 */
function Donut({ slices, unit, onPick }: { slices: Slice[]; unit: string; onPick: (index: number) => void }) {
  const shown = slices.filter((s) => s.value > 0);
  const total = shown.reduce((a, s) => a + s.value, 0);
  const config: ChartConfig = Object.fromEntries([["value", { label: unit }], ...shown.map((s) => [s.key, { label: s.label, color: s.color }])]);
  return (
    <div className={local.donut}>
      <ChartContainer config={config} className={`${local.donutChart} ${local.clickable} aspect-square`}>
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
          <Pie
            data={shown}
            dataKey="value"
            nameKey="key"
            innerRadius="60%"
            outerRadius="92%"
            paddingAngle={shown.length > 1 ? 2 : 0}
            cornerRadius={6}
            strokeWidth={0}
            onClick={(_, index) => onPick(index)}
          >
            {shown.map((s) => (
              <Cell key={s.key} fill={s.color} />
            ))}
            <Label
              content={({ viewBox }) =>
                viewBox && "cx" in viewBox ? (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 6} className="fill-foreground text-2xl font-bold">
                      {fmt(total)}
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
        {shown.map((s, i) => (
          <li key={s.key}>
            <button type="button" onClick={() => onPick(i)} aria-label={`Detail ${s.label}`}>
              <Swatch color={s.color} label={s.label} />
              <span className={local.num}>
                {fmt(s.value)}
                <small>{pct(s.value, total)}</small>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

type BarRow = { label: string; parts: { value: number; color: string; name: string }[] };

const rowTotal = (r: BarRow) => r.parts.reduce((a, p) => a + p.value, 0);

/**
 * Ranking as a list: name and number on one line, a slim rounded bar under it (segments for stacked values). Each
 * row is a button that opens its details.
 */
function BarList({ rows, legend, onPick }: { rows: BarRow[]; legend?: { color: string; label: string }[]; onPick: (index: number) => void }) {
  const max = Math.max(1, ...rows.map(rowTotal));
  return (
    <>
      <ul className={local.barList}>
        {rows.map((r, i) => {
          const total = rowTotal(r);
          return (
            <li key={r.label}>
              <button type="button" className={local.barRow} onClick={() => onPick(i)} aria-label={`Detail ${r.label}: ${total}`}>
                <span className={local.barHead}>
                  <span className={local.barLabel} title={r.label}>
                    {r.label}
                  </span>
                  <span className={local.num}>{fmt(total)}</span>
                </span>
                <span className={local.track}>
                  <span className={local.fill} style={{ width: `${(total / max) * 100}%` }}>
                    {r.parts
                      .filter((p) => p.value > 0)
                      .map((p) => (
                        <span key={p.name} style={{ flexGrow: p.value, background: p.color }} />
                      ))}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {legend && <SeriesLegend items={legend} />}
    </>
  );
}

/** Details of one bar-list row: its parts, rank and share, and every row for comparison */
function rowDetail(rows: BarRow[], index: number, opts: { title: string; unit: string; listTitle: string; color: string }, open: (i: number) => void): Detail {
  const r = rows[index];
  const total = rowTotal(r);
  const all = rows.reduce((a, x) => a + rowTotal(x), 0);
  const rank = [...rows].sort((a, b) => rowTotal(b) - rowTotal(a)).findIndex((x) => x.label === r.label) + 1;
  return {
    title: r.label,
    subtitle: opts.title,
    headline: { value: total, unit: opts.unit },
    items: r.parts.length > 1 ? r.parts.map((p) => ({ label: p.name.charAt(0).toUpperCase() + p.name.slice(1), value: p.value, color: p.color })) : [],
    facts: [
      { label: "Peringkat", value: `${rank} dari ${rows.length}` },
      { label: "Bagian dari semua", value: `${pct(total, all)} dari ${fmt(all)}` },
    ],
    list: { title: opts.listTitle, items: rows.map((x, i) => ({ label: x.label, value: rowTotal(x), color: opts.color, active: i === index })) },
    prev: index > 0 ? () => open(index - 1) : undefined,
    next: index < rows.length - 1 ? () => open(index + 1) : undefined,
  };
}

/** Details of one donut slice: value, share, and every slice for comparison */
function sliceDetail(slices: Slice[], index: number, opts: { title: string; unit: string }, open: (i: number) => void): Detail {
  const shown = slices.filter((s) => s.value > 0);
  const s = shown[index];
  const total = shown.reduce((a, x) => a + x.value, 0);
  return {
    title: s.label,
    subtitle: opts.title,
    headline: { value: s.value, unit: `${opts.unit} · ${pct(s.value, total)} dari ${fmt(total)}` },
    items: [],
    list: { title: `Semua ${opts.title.toLowerCase()}`, items: shown.map((x, i) => ({ label: x.label, value: x.value, color: x.color, active: i === index })) },
    prev: index > 0 ? () => open(index - 1) : undefined,
    next: index < shown.length - 1 ? () => open(index + 1) : undefined,
  };
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

/** The clicked day of a time chart (recharts passes the index of the day under the pointer) */
const clickedIndex = (state: unknown) => {
  const i = Number((state as { activeTooltipIndex?: unknown } | null)?.activeTooltipIndex);
  return Number.isInteger(i) && i >= 0 ? i : null;
};

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
 * product status, products per category, accounts per role (only the roles the user may see). A click on any part
 * opens its details in a popup.
 */
export function DashboardStats() {
  const [days, setDays] = useState(30);
  const compact = useCompact();
  const [detail, setDetail] = useState<Detail | null>(null);
  const { data, loading, error } = useAsync(() => api.stats.overview(days), [days]);
  const s: StatsOverview | undefined = data?.data;

  const statusSlices: Slice[] = s
    ? [
        // "Aktif" split: approved and in stock (shown to visitors) / approved but "Stok Kosong" (hidden)
        { key: "active", label: "Aktif · Tersedia", value: s.products.byStatus.active - (s.products.outOfStock?.active ?? 0), color: STATUS_COLORS.active },
        { key: "outOfStock", label: "Aktif · Stok Kosong", value: s.products.outOfStock?.active ?? 0, color: STATUS_COLORS.outOfStock },
        { key: "pending", label: "Menunggu", value: s.products.byStatus.pending, color: STATUS_COLORS.pending },
        { key: "rejected", label: "Ditolak", value: s.products.byStatus.rejected, color: STATUS_COLORS.rejected },
        { key: "inactive", label: "Dinonaktifkan", value: s.products.byStatus.inactive, color: STATUS_COLORS.inactive },
      ]
    : [];
  const categoryRows: BarRow[] = s?.products.byCategory.map((c) => ({ label: c.name, parts: [{ value: c.count, color: "var(--chart-1)", name: "produk" }] })) ?? [];
  const roleRows: BarRow[] =
    s?.users.byRole.map((r) => ({
      label: ROLE_LABEL[r.role],
      parts: [
        { value: r.active, color: USER_COLORS.active, name: "aktif" },
        { value: r.inactive, color: USER_COLORS.inactive, name: "belum / tidak aktif" },
      ],
    })) ?? [];

  const openDay = (i: number) => {
    if (!s) return;
    const day = s.perDay[i];
    const sum = (k: (typeof ACTIVITY)[number]["key"]) => s.perDay.reduce((a, d) => a + d[k], 0);
    const total = ACTIVITY.reduce((a, x) => a + day[x.key], 0);
    setDetail({
      title: longDate(day.date),
      subtitle: `Aktivitas · hari ke-${i + 1} dari ${s.perDay.length}`,
      headline: { value: total, unit: "kejadian pada hari ini" },
      items: ACTIVITY.map((a) => ({
        label: a.label,
        value: day[a.key],
        color: a.color,
        note: `Periode ini: ${fmt(sum(a.key))} total, rata-rata ${avg(sum(a.key), s.perDay.length)} per hari`,
      })),
      prev: i > 0 ? () => openDay(i - 1) : undefined,
      next: i < s.perDay.length - 1 ? () => openDay(i + 1) : undefined,
    });
  };
  const openStatus = (i: number) => setDetail(sliceDetail(statusSlices, i, { title: "Status Produk", unit: "produk" }, openStatus));
  const openCategory = (i: number) =>
    setDetail(rowDetail(categoryRows, i, { title: "Produk per Kategori", unit: "produk", listTitle: "Semua kategori", color: "var(--chart-1)" }, openCategory));
  const openRole = (i: number) => setDetail(rowDetail(roleRows, i, { title: "Akun per Role", unit: "akun", listTitle: "Semua role", color: USER_COLORS.active }, openRole));

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
              clickable
            >
              {s.perDay.some((d) => ACTIVITY.some((a) => d[a.key])) ? (
                <>
                  <ChartContainer config={activityConfig} className={`${local.clickable} aspect-auto h-[210px] w-full sm:h-[280px]`}>
                    <AreaChart data={s.perDay} margin={{ left: 0, right: 8, top: 8 }} onClick={(st) => { const i = clickedIndex(st); if (i !== null) openDay(i); }}>
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
                          activeDot={{ r: 5, strokeWidth: 0 }}
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

            <ChartCard title="Status Produk" description={`${s.products.total} produk`} clickable={s.products.total > 0}>
              {s.products.total ? <Donut unit="produk" slices={statusSlices} onPick={openStatus} /> : <Empty>Belum ada produk.</Empty>}
            </ChartCard>

            <ChartCard title="Produk per Kategori" description={`${s.products.total} produk`} clickable={categoryRows.length > 0}>
              {categoryRows.length ? <BarList rows={categoryRows} onPick={openCategory} /> : <Empty>Belum ada kategori.</Empty>}
            </ChartCard>

            {roleRows.length > 0 && (
              <ChartCard
                title="Akun per Role"
                description={`${s.users.total} akun ${s.users.roles.map((r) => ROLE_LABEL[r]).join(", ")}`}
                className="lg:col-span-2"
                clickable
              >
                <BarList
                  rows={roleRows}
                  onPick={openRole}
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
      <DetailModal detail={detail} onClose={() => setDetail(null)} />
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
  const [detail, setDetail] = useState<Detail | null>(null);
  const { data, loading, error } = useAsync(() => api.logs.stats(days), [days, reloadKey]);
  const s: LogStats | undefined = data?.data;

  const methodSlices: Slice[] = s?.byMethod.map((m) => ({ key: m.method, label: m.method, value: m.count, color: METHOD_COLORS[m.method] ?? "var(--chart-4)" })) ?? [];
  const errorRows: BarRow[] = s?.topErrors.map((e) => ({ label: e.errorCode, parts: [{ value: e.count, color: "var(--chart-5)", name: "kejadian" }] })) ?? [];
  const endpointRows: BarRow[] =
    s?.topEndpoints.map((e) => ({
      label: e.endpoint,
      parts: [
        { value: e.count - e.failed, color: "var(--chart-1)", name: "berhasil" },
        { value: e.failed, color: "var(--chart-5)", name: "gagal" },
      ],
    })) ?? [];

  const openDay = (i: number) => {
    if (!s) return;
    const day = s.perDay[i];
    const total = day.success + day.failed;
    setDetail({
      title: longDate(day.date),
      subtitle: `Permintaan per hari · hari ke-${i + 1} dari ${s.perDay.length}`,
      headline: { value: total, unit: "permintaan pada hari ini" },
      items: LOG_DAY.map((a) => ({ label: a.label, value: day[a.key], color: a.color })),
      facts: [
        { label: "Tingkat berhasil", value: total ? pct(day.success, total) : "-" },
        { label: "Rata-rata per hari (periode)", value: avg(s.total, s.perDay.length) },
        { label: "Total periode", value: `${fmt(s.total)} (${fmt(s.failed)} gagal)` },
      ],
      prev: i > 0 ? () => openDay(i - 1) : undefined,
      next: i < s.perDay.length - 1 ? () => openDay(i + 1) : undefined,
    });
  };
  const openMethod = (i: number) => setDetail(sliceDetail(methodSlices, i, { title: "Per Method", unit: "permintaan" }, openMethod));
  const openError = (i: number) =>
    setDetail(rowDetail(errorRows, i, { title: "Error Terbanyak", unit: "kejadian", listTitle: "Semua error teratas", color: "var(--chart-5)" }, openError));
  const openEndpoint = (i: number) =>
    setDetail(rowDetail(endpointRows, i, { title: "Endpoint Terbanyak", unit: "permintaan", listTitle: "Semua endpoint teratas", color: "var(--chart-1)" }, openEndpoint));

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
              clickable={s.total > 0}
            >
              {s.total ? (
                <>
                  <ChartContainer config={logDayConfig} className={`${local.clickable} aspect-auto h-[200px] w-full sm:h-[260px]`}>
                    <BarChart data={s.perDay} margin={{ left: 0, right: 8, top: 8 }} barCategoryGap="28%" onClick={(st) => { const i = clickedIndex(st); if (i !== null) openDay(i); }}>
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

            <ChartCard title="Per Method" description={`${s.total} permintaan`} clickable={methodSlices.length > 0}>
              {methodSlices.length ? <Donut unit="permintaan" slices={methodSlices} onPick={openMethod} /> : <Empty />}
            </ChartCard>

            <ChartCard title="Error Terbanyak" description="Kode error dan berapa kali terjadi" clickable={errorRows.length > 0}>
              {errorRows.length ? <BarList rows={errorRows} onPick={openError} /> : <Empty>Tidak ada error pada periode ini.</Empty>}
            </ChartCard>

            <ChartCard title="Endpoint Terbanyak" description="Id pada alamat digabung (mis. /api/products/:id)" className="lg:col-span-2" clickable={endpointRows.length > 0}>
              {endpointRows.length ? (
                <BarList
                  rows={endpointRows}
                  onPick={openEndpoint}
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
      <DetailModal detail={detail} onClose={() => setDetail(null)} />
    </Section>
  );
}
