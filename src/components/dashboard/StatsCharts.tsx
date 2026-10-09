"use client";

import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import type { LogStats, StatsOverview } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../shadcn/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../shadcn/chart";
import { PeriodSelect } from "./PeriodSelect";
import { Loading } from "../ui";
import { ROLE_LABEL } from "./UserAccounts";

// ---------- shared pieces ----------

const DAY = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" });
/** "2026-10-08" → "08 Okt" */
const shortDate = (iso: string) => DAY.format(new Date(`${iso}T00:00:00`));

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
  return <p className="grid h-[220px] place-items-center text-center text-sm text-muted-foreground">{children}</p>;
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

// ---------- dashboards: products, UMKM, users ----------

const activityConfig = {
  products: { label: "Produk baru", color: "var(--chart-2)" },
  tenants: { label: "UMKM baru", color: "var(--chart-1)" },
  users: { label: "Akun baru", color: "var(--chart-3)" },
} satisfies ChartConfig;

const statusConfig = {
  count: { label: "Produk" },
  active: { label: "Aktif", color: "var(--chart-3)" },
  pending: { label: "Menunggu", color: "#f5b700" },
  rejected: { label: "Ditolak", color: "var(--chart-5)" },
  inactive: { label: "Dinonaktifkan", color: "#9ca3af" },
} satisfies ChartConfig;

const categoryConfig = { count: { label: "Produk", color: "var(--chart-1)" } } satisfies ChartConfig;

const usersConfig = {
  active: { label: "Aktif", color: "var(--chart-3)" },
  inactive: { label: "Belum / tidak aktif", color: "var(--chart-2)" },
} satisfies ChartConfig;

/**
 * Charts on the superadmin, disnakertrans and admin dashboards (GET /api/stats/overview): activity per day,
 * product status, products per category, accounts per role (only the roles the user may see).
 */
export function DashboardStats() {
  const [days, setDays] = useState(30);
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
            <ChartCard title="Aktivitas" description={`Produk, UMKM, dan akun baru per hari (${days} hari terakhir)`} className="lg:col-span-2">
              {s.perDay.some((d) => d.products || d.tenants || d.users) ? (
                <ChartContainer config={activityConfig} className="aspect-auto h-[260px] w-full">
                  <AreaChart data={s.perDay} margin={{ left: 0, right: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={shortDate} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                    <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => shortDate(String(v))} />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    {(["products", "tenants", "users"] as const).map((key) => (
                      <Area
                        key={key}
                        dataKey={key}
                        type="monotone"
                        stroke={`var(--color-${key})`}
                        fill={`var(--color-${key})`}
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    ))}
                  </AreaChart>
                </ChartContainer>
              ) : (
                <Empty />
              )}
            </ChartCard>

            <ChartCard title="Status Produk" description={`${s.products.total} produk`}>
              {s.products.total ? (
                <ChartContainer config={statusConfig} className="mx-auto aspect-square h-[240px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
                    <Pie
                      data={(Object.keys(s.products.byStatus) as (keyof typeof s.products.byStatus)[])
                        .map((status) => ({ status, count: s.products.byStatus[status], fill: `var(--color-${status})` }))
                        .filter((d) => d.count > 0)}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={62}
                      strokeWidth={4}
                    >
                      <Label
                        content={({ viewBox }) =>
                          viewBox && "cx" in viewBox ? (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                                {s.products.total}
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 22} className="fill-muted-foreground text-xs">
                                produk
                              </tspan>
                            </text>
                          ) : null
                        }
                      />
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="status" />} className="flex-wrap" />
                  </PieChart>
                </ChartContainer>
              ) : (
                <Empty>Belum ada produk.</Empty>
              )}
            </ChartCard>

            <ChartCard title="Produk per Kategori" description={`${s.products.total} produk`}>
              {s.products.byCategory.length ? (
                <ChartContainer config={categoryConfig} className="aspect-auto h-[240px] w-full">
                  <BarChart data={s.products.byCategory} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={110} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={6} />
                  </BarChart>
                </ChartContainer>
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
                <ChartContainer config={usersConfig} className="aspect-auto h-[220px] w-full">
                  <BarChart data={s.users.byRole.map((r) => ({ ...r, label: ROLE_LABEL[r.role] }))} margin={{ left: 0, right: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="active" stackId="a" fill="var(--color-active)" radius={[0, 0, 6, 6]} />
                    <Bar dataKey="inactive" stackId="a" fill="var(--color-inactive)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </ChartCard>
            )}
          </div>
        )
      )}
    </Section>
  );
}

// ---------- superadmin: API log ----------

const logDayConfig = {
  success: { label: "Berhasil", color: "var(--chart-3)" },
  failed: { label: "Gagal", color: "var(--chart-5)" },
} satisfies ChartConfig;

const METHOD_COLORS: Record<string, string> = {
  POST: "var(--chart-1)",
  PATCH: "var(--chart-2)",
  PUT: "var(--chart-4)",
  DELETE: "var(--chart-5)",
  GET: "#9ca3af",
};

const endpointConfig = {
  ok: { label: "Berhasil", color: "var(--chart-1)" },
  failed: { label: "Gagal", color: "var(--chart-5)" },
} satisfies ChartConfig;

const errorConfig = { count: { label: "Kejadian", color: "var(--chart-5)" } } satisfies ChartConfig;

/** Charts on the Log API page (GET /api/logs/stats): per day, by method, busiest endpoints, top errors. */
export function LogStatsCharts({ reloadKey = 0 }: { reloadKey?: number }) {
  const [days, setDays] = useState(14);
  const { data, loading, error } = useAsync(() => api.logs.stats(days), [days, reloadKey]);
  const s: LogStats | undefined = data?.data;
  const methodConfig: ChartConfig = Object.fromEntries([
    ["count", { label: "Permintaan" }],
    ...(s?.byMethod ?? []).map((m) => [m.method, { label: m.method, color: METHOD_COLORS[m.method] ?? "var(--chart-4)" }]),
  ]);

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
                <ChartContainer config={logDayConfig} className="aspect-auto h-[240px] w-full">
                  <BarChart data={s.perDay} margin={{ left: 0, right: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={20} tickFormatter={shortDate} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                    <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => shortDate(String(v))} />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="success" stackId="a" fill="var(--color-success)" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="failed" stackId="a" fill="var(--color-failed)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <Empty />
              )}
            </ChartCard>

            <ChartCard title="Per Method">
              {s.byMethod.length ? (
                <ChartContainer config={methodConfig} className="mx-auto aspect-square h-[220px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="method" hideLabel />} />
                    <Pie data={s.byMethod} dataKey="count" nameKey="method" innerRadius={55} strokeWidth={4}>
                      {s.byMethod.map((m) => (
                        <Cell key={m.method} fill={METHOD_COLORS[m.method] ?? "var(--chart-4)"} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="method" />} />
                  </PieChart>
                </ChartContainer>
              ) : (
                <Empty />
              )}
            </ChartCard>

            <ChartCard title="Error Terbanyak">
              {s.topErrors.length ? (
                <ChartContainer config={errorConfig} className="aspect-auto h-[220px] w-full">
                  <BarChart data={s.topErrors} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="errorCode" tickLine={false} axisLine={false} width={150} tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={6} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <Empty>Tidak ada error pada periode ini.</Empty>
              )}
            </ChartCard>

            <ChartCard title="Endpoint Terbanyak" description="Id pada alamat digabung (mis. /api/products/:id)" className="lg:col-span-2">
              {s.topEndpoints.length ? (
                <ChartContainer config={endpointConfig} className="aspect-auto h-[260px] w-full">
                  <BarChart
                    data={s.topEndpoints.map((e) => ({ ...e, ok: e.count - e.failed }))}
                    layout="vertical"
                    margin={{ left: 8, right: 16 }}
                  >
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="endpoint" tickLine={false} axisLine={false} width={230} tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="ok" stackId="a" fill="var(--color-ok)" />
                    <Bar dataKey="failed" stackId="a" fill="var(--color-failed)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ChartContainer>
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
